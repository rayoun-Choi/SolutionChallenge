// rag_chat.js
const { retrieveSimilarQnA } = require("./firestore_retriever");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI('');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//  언어 감지 (한글 포함 여부로 판단)
function detectLanguage(text) {
    const korean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
    return korean.test(text) ? 'ko' : 'en';
  }
  
  //  한글 → 영어 번역 (QnA 검색용)
  async function translateToEnglish(text) {
    const prompt = `Translate this Korean sentence into natural English:\n"${text}"`;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return result.response.text().trim();
  }
  
  // 전체 응답 생성
  async function getChatbotResponse(history) {
    const latestUserMessage = history[history.length - 1].content;
    const language = detectLanguage(latestUserMessage);
  
    // 🔍 QnA 검색용 메시지 (영어)
    const searchText = language === 'ko'
      ? await translateToEnglish(latestUserMessage)
      : latestUserMessage;
  
    const contextQnA = await retrieveSimilarQnA(searchText);
  
    const contextBlock = contextQnA.map((item, i) => {
      return `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer}`;
    }).join("\n\n");
  
    const chatHistoryFormatted = history.map(h => {
      const prefix = h.role === "user" ? "User" : "Assistant";
      return `${prefix}: ${h.content}`;
    }).join("\n");
  
    // 언어별 프롬프트 설정
    const responseLanguagePrompt = language === 'ko'
  ? `
답변은 따뜻하고 쉬운 한국어로 작성해주세요.  
전문용어는 피하고, 다음의 3가지 구성을 따라주세요:

🧾 **Possible Cause**  
🧴 **What To Do**  
🏥 **When To See a Doctor**
`
  : `
Respond in clear, simple English with a warm and helpful tone.  
Use this format:

🧾 **Possible Cause**  
🧴 **What To Do**  
🏥 **When To See a Doctor**
`;

    const systemInstruction = `
    You are a dermatology assistant chatbot for outdoor workers, many of whom are elderly. 
    However, do not assume their gender or age in the message.
    They are often exposed to sun, sweat, bugs, and plants while working outside.

    Your job is to:
    1. Explain the likely cause of the symptoms. (🧾)
    2. Suggest a practical prevention tip based on outdoor work. (🧴)
    3. Recommend a simple action. (🧼)
    4. Say when they should visit a doctor, if needed. (🏥)

    Style:
    - Use simple and friendly tone, like talking to a 10-year-old.
    - Avoid medical terms unless explained simply.
    - Do **not** say “I’m an AI.”
    - Keep it short, kind, and helpful.

    Use the following QnA context to support your response:
    ${contextBlock}
    `;


  
    const prompt = `
  ${systemInstruction}
  
  User's chat history:
  ${chatHistoryFormatted}
  
  ${responseLanguagePrompt}
  `;
  
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
  
    return result.response.text().trim();
  }
  
  module.exports = { getChatbotResponse };