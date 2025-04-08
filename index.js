const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const userMessage = req.body.events?.[0]?.message?.text;
  if (!userMessage) return res.sendStatus(200);

  // DifyのAPI呼び出し（重要）
  const response = await axios.post(
    "https://api.dify.ai/v1/chat-messages",
    {
      inputs: {},
      query: userMessage,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
      },
    }
  );

  const replyMessage = response.data.answer;
  console.log("Difyから返答：", replyMessage);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("LINE × Webhook × Dify 接続サーバー動作中！");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`起動中: http://localhost:${port}`);
});
