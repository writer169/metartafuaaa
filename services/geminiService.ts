import { MetarData, TafData, AIAnalysisResult } from "../types";

export const analyzeWeather = async (metar: MetarData | null, taf: TafData | null): Promise<AIAnalysisResult | null> => {
  if (!metar && !taf) return null;

  try {
    const response = await fetch('/api/analyze-weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metar,
        taf
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Weather analysis failed:', errorData);
      return null;
    }

    const result = await response.json();
    return result as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
};
