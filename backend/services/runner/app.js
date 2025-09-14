const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const ROOT_DIR = path.join(__dirname, "..", "..", "..");

app.use(express.json());

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

wss.on("connection", (ws) => {
  console.log("Client connected");

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
    } catch (e) {
      console.log(e);
    }
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
