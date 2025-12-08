
export interface MetarData {
  metar_id?: number;
  icaoId: string;
  receiptTime: string | number;
  obsTime: string | number;
  reportTime: string | number;
  temp?: number;
  dewp?: number;
  wdir?: number | "VRB";
  wspd?: number;
  wgst?: number;
  visib?: string | number;
  altim?: number;
  slp?: number;
  qcField?: number;
  rawOb: string;
  clouds?: CloudLayer[];
}

export interface CloudLayer {
  cover: string;
  base?: number;
  type?: string;
}

export interface TafData {
  taf_id?: number;
  icaoId: string;
  receiptTime: string | number;
  bulletinTime: string | number;
  issueTime: string | number;
  validTimeFrom: string | number;
  validTimeTo: string | number;
  rawTAF: string;
  forecast?: TafForecast[];
}

export interface TafForecast {
  fcst_time_from: string;
  fcst_time_to: string;
  change_indicator?: string;
  visib?: string | number;
  wx_string?: string;
  not_decoded?: string;
}

export interface StationInfo {
  icaoId: string;
  name: string;
  lat: number;
  lon: number;
  elev: number;
  country: string;
}

export interface AIAnalysisResult {
  summary: string;
  conditions_rating: string;
  hazards: string[];
  forecast_summary: string;
  airport_name_ru: string;
  local_time: string;
}

export interface WeatherState {
  metar: MetarData | null;
  taf: TafData | null;
  station: StationInfo | null;
  loading: boolean;
  error: string | null;
  aiAnalysis: AIAnalysisResult | null;
  analyzing: boolean;
}
