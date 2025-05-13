// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { getChatbotResponse } = require("./rag_chat");

const app = express();
app.use(bodyParser.json());

app.post("/chat/rag", async (req, res) => {
    const { history } = req.body;
    const response = await getChatbotResponse(history);
    res.json({ response });
  });
  
app.listen(3000, () => {
  console.log("🌐 RAG 챗봇 서버 실행 중: http://localhost:3000");
});
