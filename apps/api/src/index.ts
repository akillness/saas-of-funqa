import { createServer } from "./server.js";
import { config } from "./config.js";

const app = createServer();

app.listen(config.port, () => {
  console.log(`funqa api listening on http://localhost:${config.port}`);
});
