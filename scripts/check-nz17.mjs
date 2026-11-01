import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repositoryRoot = join(fileURLToPath(new URL("..", import.meta.url)));
const appRoot = join(repositoryRoot, "nz17");
const targetRoot = process.argv.includes("--dist") ? join(repositoryRoot, "dist") : appRoot;
const htmlPath = join(targetRoot, "index.html");
const html = readFileSync(htmlPath, "utf8");

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].trim())
  .filter(Boolean);

if (inlineScripts.length === 0) {
  throw new Error("NZ17 index.html does not contain an inline application script");
}

inlineScripts.forEach((source, index) => {
  new vm.Script(source, { filename: `${htmlPath}#script-${index + 1}` });
});

const serviceWorkerPath = join(targetRoot, "sw.js");
new vm.Script(readFileSync(serviceWorkerPath, "utf8"), { filename: serviceWorkerPath });

const manifestPath = join(targetRoot, "manifest.webmanifest");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.start_url !== "./" || manifest.display !== "standalone") {
  throw new Error("NZ17 manifest must use ./ as start_url and standalone display mode");
}

const requiredAssets = [
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "logo.svg",
  "offline-map.svg",
  "apple-touch-icon.png",
  "sw.js"
];

const missingAssets = requiredAssets.filter((asset) => !existsSync(join(targetRoot, asset)));
if (missingAssets.length > 0) {
  throw new Error(`Missing NZ17 assets: ${missingAssets.join(", ")}`);
}

const location = process.argv.includes("--dist") ? "dist" : "source";
console.log(`NZ17 ${location} checks passed: ${inlineScripts.length} inline script, ${requiredAssets.length} required assets`);
