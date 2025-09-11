const fs = require("fs");
const path = require("path");

const folders_structure = [
  "backend",
  "backend/services",

  "backend/services/http",
  "backend/services/http/src/controllers/http-controller.js",
  "backend/services/http/src/routes/http-routes.js",
  "backend/services/http/src/middlewares/http-middleware.js",
  "backend/services/http/src/config/http-config.js",
  "backend/services/http/src/utils/http-utils.js",
  "backend/services/http/Dockerfile",
  "backend/services/http/.env",
  "backend/services/http/.env.example",
  "backend/services/http/app.js",

  "backend/services/orchestrator",
  "backend/services/orchestrator/src/controllers/orchestrator-controller.js",
  "backend/services/orchestrator/src/routes/orchestrator-routes.js",
  "backend/services/orchestrator/src/middlewares/orchestrator-middleware.js",
  "backend/services/orchestrator/src/config/orchestrator-config.js",
  "backend/services/orchestrator/src/utils/orchestrator-utils.js",
  "backend/services/orchestrator/Dockerfile",
  "backend/services/orchestrator/.env",
  "backend/services/orchestrator/.env.example",
  "backend/services/orchestrator/app.js",

  "backend/services/runner",
  "backend/services/runner/src",
  "backend/services/runner/Dockerfile.python",
  "backend/services/runner/Dockerfile.node",
  "backend/services/runner/.env",
  "backend/services/runner/.env.example",
  "backend/services/runner/app.js",

  "frontend",

  "db",

  "s3",
  "s3/base",
  "s3/base/python/main.py",
  "s3/base/node/index.js",
  "s3/base/node/package.json",
  "s3/code",

  "docker-compose.yml",

  "README.md",
  ".gitignore",
];

folders_structure.forEach((item) => {
  const fullPath = path.resolve(item);

  if (
    path.extname(item) ||
    ["Dockerfile", "README.md", ".env", ".env.example", ".gitignore"].includes(
      path.basename(item)
    )
  ) {
    fs.mkdir(path.dirname(fullPath), { recursive: true }, (err) => {
      if (err) throw err;

      if (!fs.existsSync(fullPath)) {
        fs.writeFile(fullPath, "", (err) => {
          if (err) throw err;
          console.log(`File created: ${fullPath}`);
        });
      }
    });
  } else {
    fs.mkdir(fullPath, { recursive: true }, (err) => {
      if (err) throw err;
      console.log(`Folder created: ${fullPath}`);
    });
  }
});
