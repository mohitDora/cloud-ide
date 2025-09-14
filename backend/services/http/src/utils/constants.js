const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "..", "..","..", "..");
const DB_PATH = path.join(ROOT_DIR, "db/db.json");

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

module.exports = {
  BASE_FILE_TREE_PYTHON,
  BASE_FILE_TREE_NODEJS,
  DB_PATH,
  ROOT_DIR,
};
