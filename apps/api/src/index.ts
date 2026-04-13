import { createServer } from "./server.js";
import { config, validateConfig } from "./config.js";

validateConfig();

const app = createServer();

app.listen(config.port, () => {
  console.log(`funqa api listening on http://localhost:${config.port}`);
});

