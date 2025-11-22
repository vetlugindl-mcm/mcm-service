export async function recognizeImage(base64Data: string, mimeType: string) {
  try {
    // Используем OpenRouter, так как прямой Google выдает 404.
    // Используем прямой fetch, чтобы библиотека OpenAI не ругалась на PDF.
    
    // Модель: Стабильная платная Flash 1.5 (т.к. у тебя есть баланс)
    // Если не сработает, можно поменять на "google/gemini-2.0-flash-exp:free"
    const MODEL = "google/gemini-flash-1.5";
    
    console.log(`📡 RAW FETCH к OpenRouter (${MODEL}). Тип: ${mimeType}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MSM Service",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert document parser. Analyze this ENTIRE document (all pages).
                       EXTRACT these fields into a strict JSON structure:
                       - surname, name, patronymic
                       - birth_date (DD.MM.YYYY)
                       
                       IF PASSPORT:
                       - series, number
                       - issue_date
                       - issuer
                       - code
                       
                       IF SNILS:
                       - snils_number
                       
                       IF DIPLOMA:
                       - number, date, university, qualification, specialty
                       
                       Return ONLY valid JSON. No markdown.`
              },
              {
                type: "image_url",
                image_url: {
                  // Хитрость: передаем PDF прямо в поле url. 
                  // OpenRouter прокинет это в Google, а Google это поймет.
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter Error: ${response.status} - ${errorText}`);
      return {};
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    console.log("✅ Ответ получен. Длина:", text?.length);

    if (!text) return {};

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error("❌ AI Service Error:", error);
    return {};
  }
}
