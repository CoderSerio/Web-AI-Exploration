import * as http from "http";
import { Server, Socket } from "socket.io";
import express from "express";
import testBase64 from "./test-base64";

interface ChatMessage {
  model: string;
  created_at: string;
  message: {
    role: "assistant";
    content: string;
  };
  done: boolean;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket: Socket) => {
  socket.on("llm-server-message", (data) => {
    const postData = JSON.stringify({
      model: "llava:7b",
      messages: [
        {
          role: "user",
          content: `
              ## 输入内容
              输入的内容为 $[input]，一个人脸表情图片的base64字符串。
              ## 问题
              这是一道选择题，你只需要给出选择题的正确选项，判断 $[input] 是哪一种表情？选项有：1.sad、2.happy、3.others
              ## 输出格式要求
              1. 直接给以选项的编号数字作为输出，此外不要做任何多余的解释，只需要告诉我编号就好
              ## 参考案例
              比如我传递了一张看上去表情是伤心（sad）的人脸图片，你只需要回答：1`,
          images: [data.content.split(",")[1]],
        },
      ],
    });

    const llmReq = http.request(
      {
        hostname: "localhost",
        port: "11434",
        path: "/api/chat",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (llmRes) => {
        const dataFragments = [];

        llmRes.on("data", (chunk) => {
          dataFragments.push(JSON.parse(chunk));
        });

        let llmResMessageContent: string | number = "";
        llmRes.on("end", () => {
          dataFragments.forEach((dataFragment) => {
            llmResMessageContent += dataFragment.message?.content;
          });
          llmResMessageContent = parseInt(llmResMessageContent as string);
          console.log("大模型的预测结果是", llmResMessageContent);

          socket.emit("backend-for-frontend-message", {
            type: "server",
            id: "llm-server",
            content: [llmResMessageContent],
          });
        });
      }
    );
    llmReq.write(postData);
    llmReq.end();
  });
});

server.listen(8840, () => {
  console.log(`Server is running at http://localhost:8840`);
});
