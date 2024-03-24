// spawn 用来创建一个进程（childProcess对象）
const { spawn } = require("child_process");
const path = require("path");

class ProjectLauncher {
  constructor(name, relativePath, cmdType, command) {
    this.name = name;
    this.relativePath = relativePath;
    this.cmdType = cmdType;
    this.command = command;
    this.process = null;
  }

  log(msg, type) {
    console.log(`[${this.name}] ${type}:\n ${msg}`);
  }

  start() {
    // 抹平 windows 和 类posix 系统的差异
    let type;
    if (this.cmdType === "npm") {
      this.cmdType = process.platform === "win32" ? "npm.cmd" : "npm";
    } else if (this.cmdType === "node") {
      this.cmdType = "node";
    }

    this.process = spawn(this.cmdType, this.command.split(" "), {
      cwd: path.resolve(__dirname, this.relativePath),
      shell: true, // windows上需要开启这个选项 npm 等脚本命令才可以正确解析，其他平台暂时不确定是否如此
    });

    this.process.stdout.on("data", (data) => {
      this.log(data, "log");
    });

    this.process.stderr.on("data", (data) => {
      this.log(data, "error");
    });

    this.process.on("close", (code) => {
      this.log(code, "exit");
    });
  }
}

const envServerLauncher = new ProjectLauncher(
  "环境服务",
  ".",
  "node",
  "env-server.js"
);
const feLauncher = new ProjectLauncher(
  "前端",
  "../packages/frontend",
  "npm",
  "run dev"
);
const bffLauncher = new ProjectLauncher(
  "BFF层",
  "../packages/bff",
  "npm",
  "run start"
);

const pythonServerLauncher = new ProjectLauncher(
  "Python Server",
  "../packages/solutions/python-server",
  "python",
  "server.py"
);

envServerLauncher.start();
feLauncher.start();
bffLauncher.start();
pythonServerLauncher.start();
