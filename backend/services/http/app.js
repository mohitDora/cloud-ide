const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "..", "..");
const DB_PATH = path.join(ROOT_DIR, "db/db.json");

const app = express();

app.use(express.json());

const copyFolder = (src, dest) => {
  fs.copy(src, dest, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

function getFileTree(dirPath, basePath = dirPath) {
  const stats = fs.statSync(dirPath);

  if (stats.isFile()) {
    return {
      name: path.basename(dirPath),
      type: "file",
      fullPath: path.relative(basePath, dirPath), // relative path
    };
  }

  if (stats.isDirectory()) {
    return {
      name: path.basename(dirPath),
      type: "folder",
      fullPath: path.relative(basePath, dirPath), // relative path
      children: fs
        .readdirSync(dirPath)
        .map((child) => getFileTree(path.join(dirPath, child), basePath)),
    };
  }
}

const updateFileTree = (userId, projectId) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  const projectDir = path.join(ROOT_DIR, "s3", "code", userId, projectId);

  const tree = getFileTree(projectDir);

  const project = db.users.find(
    (p) => p.userId === userId && p.projectId === projectId
  );

  if (project) {
    project.fileTree = tree;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
};

const BASE_FILE_TREE_PYTHON = [
  {
    name: "app.py",
    type: "file",
  },
];

const BASE_FILE_TREE_NODEJS = [
  {
    name: "server.js",
    type: "file",
  },
  {
    name: "package.json",
    type: "file",
  },
];

app.post("/create-project", (req, res) => {
  try {
    const { userId, template } = req.query;

    const projectId = Date.now().toString();

    const SOURCE_PATH = path.join(ROOT_DIR, `/s3/base/${template}`);
    const DESTINATION_PATH = path.join(
      ROOT_DIR,
      `/s3/code/${userId}/${projectId}`
    );
    copyFolder(SOURCE_PATH, DESTINATION_PATH);

    let db = { users: [] };
    if (fs.existsSync(DB_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_PATH));
    }
    db.users.push({
      userId,
      projectId,
      template,
      fileTree:
        template === "node" ? BASE_FILE_TREE_NODEJS : BASE_FILE_TREE_PYTHON,
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(db));

    res.status(200).json({ projectId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/file-content", (req, res) => {
  try {
    const { userId, projectId, filePath } = req.query;
    const FILE_PATH = path.join(
      ROOT_DIR,
      `/s3/code/${userId}/${projectId}/${filePath}`
    );
    const fileContent = fs.readFileSync(FILE_PATH, "utf8");
    res.status(200).json({ fileContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/file-tree", (req, res) => {
  try {
    const { userId, projectId } = req.query;
    const db = JSON.parse(fs.readFileSync(DB_PATH));

    const fileTree = db.users.find(
      (user) => user.userId === userId && user.projectId === projectId
    ).fileTree;
    res.status(200).json({ fileTree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/file-tree", (req, res) => {
  try {
    const { userId, projectId, filePath, type } = req.query;

    const fullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      filePath
    );

    if (type === "folder") {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      fs.writeFileSync(fullPath, "", "utf-8");
    }

    updateFileTree(userId, projectId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/file-tree", (req, res) => {
  try {
    const { userId, projectId, filePath, newFilePath } = req.query;

    const fullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      filePath
    );

    const newFullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      newFilePath
    );

    fs.renameSync(fullPath, newFullPath);

    updateFileTree(userId, projectId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/file-tree", (req, res) => {
  try {
    const { userId, projectId, filePath } = req.query;

    const fullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      filePath
    );

    fs.rmSync(fullPath, { recursive: true, force: true });

    updateFileTree(userId, projectId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
