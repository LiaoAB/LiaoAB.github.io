import { cpSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(repositoryRoot, "dist");

execFileSync("npm", ["run", "build:portfolio"], {
  cwd: repositoryRoot,
  stdio: "inherit",
});

const sourceDirectory = join(repositoryRoot, "nz2027");
const travelOutputDirectory = join(outputDirectory, "nz2027");
rmSync(travelOutputDirectory, { recursive: true, force: true });
cpSync(sourceDirectory, travelOutputDirectory, { recursive: true });

const legacyDirectory = join(repositoryRoot, "nz17");
const legacyOutputDirectory = join(outputDirectory, "nz17");
rmSync(legacyOutputDirectory, { recursive: true, force: true });
cpSync(legacyDirectory, legacyOutputDirectory, { recursive: true });

console.log(`Published portfolio to ${outputDirectory}`);
console.log(`Published ${sourceDirectory} to ${travelOutputDirectory}`);
console.log(`Published legacy redirect to ${legacyOutputDirectory}`);
