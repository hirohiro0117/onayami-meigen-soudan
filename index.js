import express from "express";
import axios from "axios";
import line from "@line/bot-sdk";

const app = express();
app.use(express.json());

// LINEの設定（環境変数でアクセストークンを指定）
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// POSTリクエストを受け付ける webhook エンドポイント
app.post("/webhook", async (req, res) => {
  try {
    // LINEからのイベントを取得（複数イベントが送信される可能性もありますが、ここでは最初の一件のみ対象）
    const event = req.body.events?.[0];
    if (!event) return res.sendStatus(200);

    // ユーザーからのメッセージと返信用トークンの取得
    const userMessage = event.message?.text;
    const replyToken = event.replyToken;
    if (!userMessage || !replyToken) return res.sendStatus(200);

    // Dify API に対してリクエスト（必須の "user" パラメータを含む）
    const response = await axios.post(
      "https://api.dify.ai/v1/chat-messages",
      {
        inputs: {},
        query: userMessage,
        user: "anonymous"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`
        }
      }
    );

    // Dify からの応答が存在する場合はその内容を、ない場合はフォールバックのメッセージを使用
    const replyMessage = response.data?.answer || "すみません、今はお答えできません…";

    // LINE に対して返信メッセージを送信
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

// 簡易ヘルスチェック用のエンドポイント
app.get("/", (req, res) => {
  res.send("LINE × Dify Webhook is running!");
});

// ポート番号は環境変数 PORT があればそちらを使用、なければ3000番ポートを使用
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`起動中: http://localhost:${port}`);
});
