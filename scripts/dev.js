const { spawn } = require("child_process");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const commands = [
  { name: "frontend", args: ["--prefix", "frontend", "run", "dev"] },
  { name: "backend", args: ["--prefix", "backend", "run", "dev"] },
];

const children = commands.map(({ name, args }) => {
  const child = spawn(npm, args, {
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${name}] stopped (${signal})`);
    } else if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);
