import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Set base to repo name for GitHub Pages deployment
  base: "/memory-match-game/",
});
