import http from "http";

const options: http.RequestOptions = {
  hostname: "127.0.0.1",
  port: 11434, // 注意这里是数字类型，无需引号
  path: "/api/chat",
  method: "GET",
};

// 创建HTTP服务器并监听指定端口
const server = http.createServer((req, res) => {
  if (req.url == "/") {
    console.log(1);
    const llmReq = http.request(
      options,
      (llmRes) => {
        llmRes.setEncoding("utf8");
        llmRes.on("data", (chunk) => {
          res.write(chunk);
        });
        llmRes.on("end", () => {
          res.end();
        });
      },
      (llmErr) => {
        console.error("An error occurred:", llmErr);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    );
    llmReq.write(JSON.stringify({ name: 1 })); // 这是
    llmReq.end();
  }
});

server.listen(8840, () => {
  console.log(`Server is running at http://localhost:8840`);
});
