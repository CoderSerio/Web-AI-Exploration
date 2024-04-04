import * as http from "http";
import { Server, Socket } from "socket.io";

// 创建HTTP服务器
const httpServer = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    // 设置响应头部
    res.writeHead(200, { "Content-Type": "text/plain" });
    // 发送简单响应
    res.end("Hello from the native HTTP server!\n");
  }
);

httpServer.listen(8830, () => {
  console.log(`HTTP server is running on http://localhost:${8830}`);
});

const io = new Server(httpServer);

io.on("connection", (socket: Socket) => {
  console.log("A client connected!");

  socket.on("nodejs-server-message", (msg: string) => {
    console.log(`Received message: ${msg}`);
    // 可以在这里向所有连接的客户端广播消息
    // io.emit("message", `Echo from server: ${msg}`);
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});
