import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Contracts ship as TypeScript source, so they are bundled into the build.
  // sanitize-html is CommonJS but requires htmlparser2 (ESM only), which Vercel's Node can't require().
  noExternal: ["@nosa/contracts", "sanitize-html"],
});
