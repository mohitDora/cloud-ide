const fs = require("fs-extra");
const path = require("path");

const { DB_PATH, ROOT_DIR } = require("./constants");

const copyFolder = (src, dest) => {
  fs.copy(src, dest, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

const getFileTree = (dirPath, basePath = dirPath) => {
  const stats = fs.statSync(dirPath);

  if (stats.isFile()) {
    return {
      name: path.basename(dirPath),
      type: "file",
      fullpath: path.relative(basePath, dirPath),
    };
  }

  if (stats.isDirectory()) {
    return {
      name: path.basename(dirPath),
      type: "folder",
      fullpath: path.relative(basePath, dirPath),
      children: fs
        .readdirSync(dirPath)
        .map((child) => getFileTree(path.join(dirPath, child), basePath)),
    };
  }
};

const updateFileTree = (userId, projectId) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  const projectDir = path.join(ROOT_DIR, "s3", "code", userId, projectId);

  const tree = getFileTree(projectDir).children;

  const project = db.projects.find(
    (p) => p.userId === userId && p.projectId === projectId
  );

  if (project) {
    project.fileTree = tree;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
};

module.exports = { copyFolder, updateFileTree };
