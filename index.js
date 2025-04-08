const express = require("express");
const axios = require("axios");
const line = require("@line/bot-sdk"); // LINE Bot SDKを追加！

const app = express();
app.use(express.json());

// LINE設定（トークンは環境変数に保存）
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

app.post("/webhook", async (req, res) => {
  const userMessage = req.body.events?.[0]?.message?.text;
  const replyToken = req.body.events?.[0]?.replyToken;
  if (!userMessage || !replyToken) return res.sendStatus(200);

  // Difyへのリクエスト
  const response = await axios.post(
    "https://api.dify.ai/v1/chat-messages",
    {
      inputs: {},
      query: userMessage
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`
      }
    }
  );

  const replyMessage = response.data.answer;

  // LINEに返信
  await client.replyMessage(replyToken, {
    type: "text",
    text: replyMessage
  });

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("LINE × Webhook × Dify 接続サーバー起動中！");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`起動中: http://localhost:${port}`);
});
