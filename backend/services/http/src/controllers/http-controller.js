const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const { execSync, spawn } = require("child_process");

const {
  BASE_FILE_TREE_PYTHON,
  BASE_FILE_TREE_NODEJS,
  DB_PATH,
  ROOT_DIR,
} = require("../utils/constants");
const {
  copyFolder,
  updateFileTree,
  getOrCreateContainer,
} = require("../utils/http-utils");

const router = express.Router();

router.post("/create-project", (req, res) => {
  try {
    const { userId, template } = req.query;

    const projectId = Date.now().toString();

    const SOURCE_PATH = path.join(ROOT_DIR, `/s3/base/${template}`);
    const DESTINATION_PATH = path.join(
      ROOT_DIR,
      `/s3/code/${userId}/${projectId}`
    );
    copyFolder(SOURCE_PATH, DESTINATION_PATH);

    let db = { projects: [] };
    if (fs.existsSync(DB_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_PATH));
    }
    db.projects.push({
      userId,
      projectId,
      template,
      containerName: null,
      fileTree:
        template === "node" ? BASE_FILE_TREE_NODEJS : BASE_FILE_TREE_PYTHON,
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(db));

    res.status(200).json({ projectId, containerName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/file-content", (req, res) => {
  try {
    const { userId, projectId, filepath } = req.query;
    const FILE_PATH = path.join(
      ROOT_DIR,
      `/s3/code/${userId}/${projectId}/${filepath}`
    );
    const fileContent = fs.readFileSync(FILE_PATH, "utf8");
    res.status(200).json({ fileContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/file-tree", (req, res) => {
  try {
    const { userId, projectId } = req.query;
    const db = JSON.parse(fs.readFileSync(DB_PATH));

    const fileTree = db.projects.find(
      (user) => user.userId === userId && user.projectId === projectId
    ).fileTree;
    res.status(200).json({ fileTree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/file-tree", (req, res) => {
  try {
    const { userId, projectId, filepath, type } = req.query;

    const fullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      filepath
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

router.put("/file-tree", (req, res) => {
  try {
    const { userId, projectId, filepath, newFilepath } = req.query;

    const fullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      filepath
    );

    const newFullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      newFilepath
    );

    fs.renameSync(fullPath, newFullPath);

    updateFileTree(userId, projectId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/file-tree", (req, res) => {
  try {
    const { userId, projectId, filepath } = req.query;

    const fullPath = path.join(
      ROOT_DIR,
      "s3",
      "code",
      userId,
      projectId,
      filepath
    );

    fs.rmSync(fullPath, { recursive: true, force: true });

    updateFileTree(userId, projectId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
