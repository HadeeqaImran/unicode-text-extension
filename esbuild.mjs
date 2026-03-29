import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";

const outdir = "dist";

await rm(outdir, { recursive: true, force: true });
await mkdir(`${outdir}/background`, { recursive: true });

await build({
  entryPoints: {
    "background/service-worker": "src/background/service-worker.ts",
    "content-script": "src/content/content-script.ts",
    popup: "src/popup/popup.ts"
  },
  outdir,
  bundle: true,
  format: "iife",
  target: "chrome114",
  platform: "browser",
  sourcemap: false,
  minify: true,
  legalComments: "none",
  charset: "utf8"
});
