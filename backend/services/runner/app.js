const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const { execSync, spawn } = require("child_process");
const pty = require("node-pty");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const ROOT_DIR = path.join(__dirname, "..", "..", "..");
const projectPath = path.join(ROOT_DIR, "s3", "code");
const DB_PATH = path.join(ROOT_DIR, "db/db.json");
const BASE_IMAGE = "sandbox";

app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

const getContainerName = (userId, projectId) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  let containerName;

  const project = db.projects.find(
    (p) => p.userId === userId && p.projectId === projectId
  );

  containerName = project?.containerName;

  if (containerName) {
    return containerName;
  }

  containerName = `runner-${userId}-${projectId}`;

  project.containerName = containerName;

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  return containerName;
};

const createOrStartContainer = (containerName) => {
  try {
    execSync(`docker inspect ${containerName}`, { stdio: "ignore" });
    return;
  } catch {}

  try {
    execSync(
      `docker run -dit \
    --name ${containerName} \
    -v ${projectPath}/${userId}/${projectId}:/app \
    --memory=256m --cpus="0.5" \
    ${BASE_IMAGE} \
    python3 main.py`,
      { stdio: "ignore" }
    );
  } catch (e) {
    console.log(e);
  }
};

const stopContainer = (containerName) => {
  try {
    execSync(`docker rm -f ${containerName}`, { stdio: "ignore" });

    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

    const project = db.projects.find((p) => p.containerName === containerName);

    if (project) {
      project.containerName = null;
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
  } catch (e) {
    console.log(e);
  }
};

wss.on("connection", (ws, req) => {
  console.log("Client connected");

  const urlParams = new URLSearchParams(req.url.replace("/?", ""));
  const userId = urlParams.get("userId");
  const projectId = urlParams.get("projectId");

  const containerName = getContainerName(userId, projectId);

  createOrStartContainer(containerName, userId, projectId);

  const shell = pty.spawn("docker", ["exec", "-it", containerName, "bash"], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: "/app",
    env: process.env,
  });

  shell.onData((data) => {
    ws.send(
      JSON.stringify({
        type: "terminal:output",
        data,
      })
    );
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "file:update") {
        const { userId, projectId, filePath, content } = data;

        const FILE_PATH = path.join(
          ROOT_DIR,
          `/s3/code/${userId}/${projectId}/${filePath}`
        );
        fs.writeFileSync(FILE_PATH, content);
      }

      if (data.type === "terminal:input") {
        shell.write(data.input);
      }
    } catch (e) {
      console.log(e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    stopContainer(containerName);
  });

  ws.on("error", (error) => {
    console.log(error);

    stopContainer(containerName);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
