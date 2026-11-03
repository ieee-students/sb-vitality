import react from "@vitejs/plugin-react";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vitest/config";

const base = "/sb-vitality/";

// Vite matches the base only when the slash is present, and answers
// /sb-vitality with a 404 that names /sb-vitality/. Send that visit home.
function redirectBareBase(): Plugin {
  const bare = base.replace(/\/$/, "");
  const redirect: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url ?? "";
    const queryAt = url.indexOf("?");
    const pathname = queryAt === -1 ? url : url.slice(0, queryAt);
    if (pathname !== bare) {
      next();
      return;
    }
    const query = queryAt === -1 ? "" : url.slice(queryAt);
    res.writeHead(302, { Location: `${base}${query}` });
    res.end();
  };
  return {
    name: "redirect-bare-base",
    configureServer(server) {
      server.middlewares.use(redirect);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect);
    },
  };
}

export default defineConfig({
  base,
  plugins: [redirectBareBase(), react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
