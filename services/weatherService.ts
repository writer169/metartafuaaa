import { MetarData, TafData, StationInfo } from '../types';

const BASE_URL = 'https://aviationweather.gov/api/data';
// Используем corsproxy.io для обхода ограничений CORS в браузере
const PROXY_URL = 'https://corsproxy.io/?';

export const fetchMetar = async (icao: string): Promise<MetarData | null> => {
  try {
    const targetUrl = `${BASE_URL}/metar?ids=${icao}&format=json`;
    // Кодируем целевой URL, чтобы параметры запроса корректно передались через прокси
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
    
    if (!response.ok) {
        console.warn(`METAR fetch failed: ${response.status}`);
        throw new Error('Failed to fetch METAR data');
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) return null;
    
    try {
      const data = JSON.parse(text);
      return data && data.length > 0 ? data[0] : null;
    } catch (e) {
      console.warn("METAR JSON parse error, response was:", text);
      return null;
    }
  } catch (error) {
    console.error("METAR fetch error:", error);
    throw error;
  }
};

export const fetchTaf = async (icao: string): Promise<TafData | null> => {
  try {
    const targetUrl = `${BASE_URL}/taf?ids=${icao}&format=json`;
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
    
    if (!response.ok) {
        console.warn(`TAF fetch failed: ${response.status}`);
        throw new Error('Failed to fetch TAF data');
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) return null;

    try {
      const data = JSON.parse(text);
      return data && data.length > 0 ? data[0] : null;
    } catch (e) {
      console.warn("TAF JSON parse error", e);
      return null;
    }
  } catch (error) {
    console.error("TAF fetch error:", error);
    // TAF может отсутствовать для некоторых станций, возвращаем null
    return null;
  }
};

export const fetchStationInfo = async (icao: string): Promise<StationInfo | null> => {
  try {
    const targetUrl = `${BASE_URL}/station?ids=${icao}&format=json`;
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
    
    if (!response.ok) return null;

    const text = await response.text();
    if (!text || text.trim().length === 0) return null;

    try {
        const data = JSON.parse(text);
        return data && data.length > 0 ? data[0] : null;
    } catch (e) {
        return null;
    }
  } catch (error) {
    console.error("Station fetch error:", error);
    return null;
  }
};