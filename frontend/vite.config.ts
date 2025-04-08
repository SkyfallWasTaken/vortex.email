import { execSync } from "node:child_process";
import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function getGitCommitHash() {
  return execSync("git rev-parse --short HEAD").toString().trim();
}

function getGitCommitLink() {
  const commitHash = getGitCommitHash();
  return `https://github.com/SkyfallWasTaken/vortex.email/commit/${commitHash}`;
}

function getGitCommitTime() {
  return execSync("git log -1 --format=%ct").toString().trim(); // UNIX timestamp
}

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __GIT_COMMIT_URL__: JSON.stringify(getGitCommitLink()),
    __GIT_COMMIT_TIME__: JSON.stringify(getGitCommitTime()),
  },
  build: {
    rollupOptions: {
      external: ["react-icons/lu"],
    },
  },
  optimizeDeps: {
    include: ["react-icons/lu"],
  },
});
