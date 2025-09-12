const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..", "..", "..");
console.log(ROOT_DIR);

const app = express();

app.use(express.json());

console.log(Date.now());

const copyFolder = (src, dest) => {
  fs.copy(src, dest, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

copyFolder(ROOT_DIR + "/s3/base/node", ROOT_DIR + `/s3/code/${Date.now()}`);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
