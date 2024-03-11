// spawn 用来创建一个进程（childProcess对象）
const { spawn } = require("child_process");
const path = require("path");

// 抹平 windows 和 类posix 系统的差异
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

class ProjectLaucher {
  constructor(name, relativePath, command) {
    this.name = name;
    this.relativePath = relativePath;
    this.command = command;
    this.process = null;
  }

  log(msg, type) {
    console.log(`[${this.name}] ${type}:\n ${msg}`);
  }

  start() {
    this.process = spawn(npmCmd, this.command.split(" "), {
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

const feLaucher = new ProjectLaucher("前端", "../packages/frontend", "run dev");
const bffLaucher = new ProjectLaucher(
  "BFF层",
  "../packages/backend/bff",
  "run start"
);

feLaucher.start();
bffLaucher.start();
