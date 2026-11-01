import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = join(repositoryRoot, "nz17");
const outputDirectory = join(repositoryRoot, "dist");

rmSync(outputDirectory, { recursive: true, force: true });
cpSync(sourceDirectory, outputDirectory, { recursive: true });

console.log(`Published ${sourceDirectory} to ${outputDirectory}`);
