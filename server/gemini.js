const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });



async function generateTopics(existingTopics = []) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let excludePrompt = "";
      if (existingTopics && existingTopics.length > 0) {
        excludePrompt = `\n[제외 조건] 다음 주제들은 이미 추천되었으므로 제외하고, 겹치지 않는 새로운 주제를 추천해줘: ${existingTopics.join(', ')}`;
      }

      const prompt = `라이어 게임에서 사용할 '주제(카테고리)' 5개를 한국어로 추천해줘.
      출력 형식: 콤마(,)로 구분된 텍스트. 예: "음식, 동물, 음악, 영화, 책"
      ${excludePrompt}
      예시에 있는 것을 사용해도 좋으며, 최대한 다양하게 추천해줘.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // 텍스트 정제
      const topics = text.split(',').map(t => t.trim()).filter(t => t.length > 0);
      return topics.slice(0, 5);
    } catch (error) {
      console.error(`Gemini API Error (Topics) - Attempt ${attempt}:`, error.message);
      if (attempt < MAX_RETRIES) await new Promise(res => setTimeout(res, 1000));
    }
  }
  return ["편의점", "학교", "여행지", "직업", "가전제품"]; // Fallback after retries
}

async function generateGameWords(topic) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt = `라이어 게임을 위한 단어 생성 작업이야.

주제(카테고리): "${topic}"

[중요 규칙]
이 주제에 속하는 **구체적인 사례, 이름, 항목**을 골라야 해.
- 주제가 "영화"라면 → 구체적인 **영화 제목** (예: "어벤져스", "기생충") ✅
  ❌ 배우, 감독, 장르 등은 안 됨!
- 주제가 "음식"이라면 → 구체적인 **음식 이름** (예: "짜장면", "짬뽕") ✅
  ❌ 요리사, 식당, 조리법 등은 안 됨!
- 주제가 "동물"이라면 → 구체적인 **동물 이름** (예: "강아지", "고양이") ✅
  ❌ 사육사, 동물원 등은 안 됨!

[필수 조건]
1. 시민 단어와 라이어 단어는 **같은 카테고리 내에서 비슷하지만 명확히 구분되는** 두 가지 구체적 사례
2. 한국인이라면 누구나 알 법한 대중적인 것
3. 너무 쉽지도 너무 어렵지도 않게 (애매하게 설명하면 시민들끼리도 헷갈릴 정도)

출력 형식 JSON:
{
  "civilian": "시민 단어",
  "liar": "라이어 단어"
}
`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const response = await result.response;
      let text = response.text();
      // Remove markdown code blocks if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const json = JSON.parse(text);
      return json;
    } catch (error) {
      console.error(`Gemini API Error (Words) - Attempt ${attempt}:`, error.message);
      if (attempt < MAX_RETRIES) await new Promise(res => setTimeout(res, 1500));
    }
  }

  // Fallback after all retries failed
  console.error("All retry attempts failed. Using fallback.");
  const fallbackWords = [
    { civilian: "강아지", liar: "고양이" },
    { civilian: "짜장면", liar: "짬뽕" },
    { civilian: "사과", liar: "배" },
    { civilian: "버스", liar: "택시" },
    { civilian: "여름", liar: "겨울" },
    { civilian: "사랑", liar: "우정" },
    { civilian: "노트북", liar: "태블릿" }
  ];

  return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
}

module.exports = { generateTopics, generateGameWords, MODEL_NAME };
