const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "..", "..", "..", "..");
const DB_PATH = path.join(ROOT_DIR, "db/db.json");

const BASE_FILE_TREE_PYTHON = [
  {
    name: "app.py",
    type: "file",
    fullpath: "app.py",
  },
];

const BASE_FILE_TREE_NODEJS = [
  {
    name: "index.js",
    type: "file",
    fullpath: "index.js",
  },
  {
    name: "main.js",
    type: "file",
    fullpath: "main.js",
  },
];

module.exports = {
  BASE_FILE_TREE_PYTHON,
  BASE_FILE_TREE_NODEJS,
  DB_PATH,
  ROOT_DIR,
};
