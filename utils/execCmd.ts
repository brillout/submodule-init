import { exec, ExecException } from "child_process";
import assert = require("assert");
import { relative } from "path";
import { projectName } from "./projectName";

export { execCmd };

type ExecResult = {
  stdout: string;
};
type ExecError = ExecException &
  ExecResult & {
    isError: true;
    stderr: string;
  };

function execCmd(
  cmd: string,
  { cwd, log }: { cwd?: string; log?: boolean } = {}
): Promise<ExecError | ExecResult> {
  const { promise, resolvePromise } = genPromise<ExecError | ExecResult>();

  const timeout = setTimeout(() => {
    console.error(
      `[${projectName}] Command call is hanging. The command that is hanging is: \`${cmd}\`.`
    );
    process.exit();
  }, 10 * 1000);

  if (log) {
    console.log(
      `[${projectName}] ${cmd}${
        !cwd ? "" : ` (${relative(process.cwd(), cwd)})`
      }`
    );
  }
  exec(cmd, { cwd }, (err, stdout, stderr) => {
    if (err) {
      const execError: ExecError = {
        ...err,
        isError: true,
        stdout,
        stderr,
      };
      clearTimeout(timeout);
      resolvePromise(execError);
      return;
    }
    assert(stdout.constructor === String);
    clearTimeout(timeout);
    resolvePromise({ stdout });
    return;
  });

  return promise;
}

function genPromise<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (value: T) => void;
  const promise: Promise<T> = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolvePromise, rejectPromise };
}
