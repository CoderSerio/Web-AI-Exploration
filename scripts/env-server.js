/*
  这个文件的目的是启动了一个服务器，把 env-configs.json的配置分发到不同的项目里。
  为什么不是直接导入本地文件？
  这主要是会影响到 JS 语言的项目，其打包构建工具会因为引入这个 JSON 的缘故，
  在依赖分析的过程中将会把最外层的这个 JSON 也导入进来，这时候问题就来了，
  这个 JSON 已经超出了子项目的文件范围，所以子项目的打包产物的入口文件层级就出错了，
  这时候启动子项目就会导致找不到入口文件，便抛出异常启动失败了。
  
  综上所述，最后决定还是写一个小巧的服务器，完成配置项目的分发工作..
  出于一些便捷性考虑
*/
const env = require("../env-configs.json");
const http = require("http");

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // 允许任意来源
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", 60 * 60 * 24); // 24小时

  res.end(JSON.stringify(env));
});

server.listen(env.ports["env-server"], () => {
  console.log(
    `跨语言常量配置服务器已在${env.ip}:${env.ports["env-server"]}上启动`
  );
});
