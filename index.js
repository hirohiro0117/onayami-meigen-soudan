const express = require("express");
const axios = require("axios");
const line = require("@line/bot-sdk");

const app = express();
app.use(express.json());

// LINE設定（トークンはRender の環境変数に設定）
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events?.[0];
    if (!event) return res.sendStatus(200);

    const userMessage = event.message?.text;
    const replyToken = event.replyToken;
    if (!userMessage || !replyToken) return res.sendStatus(200);

    // Difyへのリクエストに "user" パラメータを追加
    const response = await axios.post(
      "https://api.dify.ai/v1/chat-messages",
      {
        inputs: {},
        query: userMessage,
        user: "anonymous"   // ここで必須の "user" パラメータを渡します
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`
        }
      }
    );

    // Difyの応答（応答がない場合のフォールバックメッセージも）
    const replyMessage = response.data?.answer || "すみません、今はお答えできません…";

    // LINEに返信
    await client.replyMessage(replyToken, {
      type: "text",
      text: replyMessage
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("エラー発生:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("LINE × Dify Webhook is running!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`起動中: http://localhost:${port}`);
});
