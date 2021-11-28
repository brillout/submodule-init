import { execCmd } from "./utils/execCmd";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import assert = require("assert");
import { projectName } from "./utils/projectName";

export { applySubmoduleFix };

const debug = false;

async function applySubmoduleFix() {
  if (isWindows()) {
    return;
  }
  const submodulePathRelative = getArg();
  const submodulePath = resolve(process.cwd(), submodulePathRelative);
  await setGitHead(submodulePath);
  await useSSHRemoteURL(submodulePath);
  console.log(
    `[${projectName}] submodule ${submodulePathRelative} initialized`
  );
}

async function setGitHead(submodulePath: string) {
  const cwd = submodulePath;
  const { stdout: revisionHash } = await execCmd("git rev-parse HEAD", {
    cwd,
    log: debug,
  });
  await execCmd("git checkout master", { cwd, log: debug });
  await execCmd(`git reset --hard ${revisionHash}`, { cwd, log: debug });
}

async function useSSHRemoteURL(submodulePath: string) {
  const before = "https://github.com/";
  const after = "git@github.com:";
  const gitConfigPath = getGitConfigPath(submodulePath);
  if (debug) {
    console.log(`[${projectName}] Git remote URLs updated (${gitConfigPath})`);
  }
  let gitConfigContent = readFileSync(gitConfigPath).toString();
  gitConfigContent = gitConfigContent.split(before).join(after);
  writeFileSync(gitConfigPath, gitConfigContent, "utf8");
}

function getGitConfigPath(submodulePath: string): string {
  let pointer = readFileSync(resolve(submodulePath, "./.git"))
    .toString()
    .trim();
  assert(pointer.split("\n").length === 1);
  const prefix = "gitdir: ";
  assert(pointer.startsWith(prefix));
  pointer = pointer.slice(prefix.length);
  return resolve(submodulePath, pointer, "./config");
}

function isWindows() {
  return process.platform === "win32";
}

function getArg(): string {
  const args = process.argv;
  assert(args.length === 3);
  return args[2];
}
