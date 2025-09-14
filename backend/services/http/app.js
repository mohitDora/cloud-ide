const express = require("express");
const cors = require("cors");

const router = require("./src/controllers/http-controller");

const app = express();

app.use(express.json());

app.use(cors());

app.use("/api", router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
