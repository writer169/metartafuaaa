import { GoogleGenAI, Type } from "@google/genai";
import { MetarData, TafData, AIAnalysisResult } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
    console.warn("API_KEY environment variable is not set! AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key_to_prevent_crash' });

export const analyzeWeather = async (metar: MetarData | null, taf: TafData | null): Promise<AIAnalysisResult | null> => {
  if (!apiKey) {
    console.error("Cannot analyze weather: API_KEY is missing");
    return null;
  }
  
  if (!metar && !taf) return null;

  const metarText = metar ? metar.rawOb : "Данные отсутствуют";
  const tafText = taf ? taf.rawTAF : "Данные отсутствуют";
  const airport = metar?.icaoId || taf?.icaoId || "Unknown";
  
  // Prepare observation time context to help AI determine month/year
  let obsTimeContext = "Unknown";
  if (metar?.obsTime) {
      const val = metar.obsTime;
      if (typeof val === 'number') {
          let ts = val;
          // Heuristic for seconds vs ms (if < 10 billion, likely seconds)
          if (ts < 10000000000) ts *= 1000;
          obsTimeContext = new Date(ts).toISOString();
      } else {
          obsTimeContext = String(val);
      }
  }

  const prompt = `
    Ты - авиационный метеоролог. Проанализируй данные для аэропорта ${airport}.
    
    ВАЖНО: Казахстан (аэропорты UAAA, UACC, UAST, UATE и другие) перешел на единый часовой пояс UTC+5. Учитывай это при расчете местного времени, не используй старые данные о UTC+6.
    
    Дата/Время наблюдения (UTC): ${obsTimeContext}
    RAW METAR: ${metarText}
    RAW TAF: ${tafText}
    
    Верни JSON с полями:
    1. summary: Краткое описание текущей погоды одним предложением на русском.
    2. conditions_rating: Оценка условий для полетов (Хорошие / Сложные / Опасные / Нелетные).
    3. hazards: Массив строк с опасными явлениями (например: "Гроза", "Туман", "Сильный боковой ветер", "Сдвиг ветра"). Если опасностей нет, верни пустой массив.
    4. forecast_summary: Краткий прогноз на ближайшие часы на русском языке (2-3 предложения).
    5. airport_name_ru: Только название города на русском языке (например, "Алматы" вместо "Международный аэропорт Алматы").
    6. local_time: Местное время формирования METAR (рассчитай на основе UTC времени наблюдения и часового пояса аэропорта) в формате "DD.MM HH:MM" (например "24.05 14:30"). Убедись, что месяц и число соответствуют переданной Дате/Времени наблюдения.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            conditions_rating: { type: Type.STRING },
            hazards: { type: Type.ARRAY, items: { type: Type.STRING } },
            forecast_summary: { type: Type.STRING },
            airport_name_ru: { type: Type.STRING },
            local_time: { type: Type.STRING }
          },
          required: ["summary", "conditions_rating", "hazards", "forecast_summary", "airport_name_ru", "local_time"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
};