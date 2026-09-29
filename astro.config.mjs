import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// Server output throughout: every page here reads from the shared SQLite
// file at request time, so nothing can be prerendered.
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
});
