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

const sendMessage = (base64) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "llava",
      messages: [
        {
          role: "user",
          content: `
              ## 输入内容
              输入的内容为 $[input]，一个人脸表情图片的base64字符串。
              ## 问题
              这是一道选择题，你只需要给出你认为的正确选项，判断 $[input] 最可能是哪一种表情？选项有：
                0.生气(非常凶、咬牙切齿、上下牙齿咬合)，
                1.平静(嘴巴闭合，像是一条线)，
                2.厌恶(脸部下意识地侧偏、眼神充满鄙夷、面部肌肉不对称)，
                3.害怕(嘴巴张大呈椭圆形、瞳孔放大、眉毛和眼睛分离较远)，
                4.开心(咧嘴笑、微笑、看上去非常高兴)，
                5.伤心（非常忧郁、看上去很想哭，嘴唇两侧向下弯），
                6.惊讶(嘴张大呈椭圆形、瞳孔放大，眼睛的白色部分比较多、眉毛抬升比较多跟眼睛的距离变远)           
              ## 输出格式要求
              直接给以选项的编号数字作为输出，此外不要做任何多余的解释，只需要告诉我编号就好
              ## 参考案例
              比如我传递了一张看上去表情是【生气】的人脸图片，你只需要回答：0
              比如我传递了一张看上去表情是【开心】的人脸图片，你只需要回答：4`,
          images: [(base64 ?? testBase64.data).split(",")[1]],
        },
      ],
    });
    try {
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

            resolve(llmResMessageContent);
          });
        }
      );
      llmReq.write(postData);
      llmReq.end();
    } catch (err) {
      throw err;
    }
  });
};

io.on("connection", (socket: Socket) => {
  let isBlocking = false;
  socket.on("llm-server-message", async (data) => {
    if (!isBlocking) {
      isBlocking = true;
      const res = await sendMessage(data.content);
      isBlocking = false;
      console.log("大模型的预测结果", res);
      socket.emit("backend-for-frontend-message", {
        type: "server",
        id: "llm-server",
        content: [res],
      });
    }
  });
});

server.listen(8840, () => {
  console.log(`Server is running at http://localhost:8840`);
});
