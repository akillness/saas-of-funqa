import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "saas-of-funqa", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
