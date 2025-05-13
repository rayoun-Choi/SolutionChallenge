const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(require("/Users/choirayoun/Downloads/solution-challenge-59c2d-firebase-adminsdk-fbsvc-8be467d925.json"))
});

const db = admin.firestore();

async function retrieveSimilarQnA(userMessage, topK = 5) {
  const snapshot = await db.collection("skin_qna").get();
  const allQnA = snapshot.docs.map(doc => doc.data());

  const lowerMsg = userMessage.toLowerCase();

  const matches = allQnA.filter(item =>
    lowerMsg.includes(item.condition?.toLowerCase() || '') ||
    (item.symptoms || []).some(sym => lowerMsg.includes(sym.toLowerCase())) ||
    item.question?.toLowerCase().includes(lowerMsg)
  );

  return matches.slice(0, topK);
}

module.exports = { retrieveSimilarQnA };