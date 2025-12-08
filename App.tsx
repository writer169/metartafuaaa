import React, { useState, useEffect, useCallback } from 'react';
import { fetchMetar, fetchTaf, fetchStationInfo } from './services/weatherService';
import { analyzeWeather } from './services/geminiService';
import { WeatherState } from './types';
import { InfoCard } from './components/InfoCard';
import { RawDataDisplay } from './components/RawDataDisplay';
import { 
  Wind, 
  Thermometer, 
  Eye, 
  Cloud, 
  Plane, 
  Search, 
  AlertCircle,
  Clock,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Loader2
} from 'lucide-react';

const INITIAL_ICAO = 'UAAA';

const App: React.FC = () => {
  const [icao, setIcao] = useState(INITIAL_ICAO);
  const [inputVal, setInputVal] = useState(INITIAL_ICAO);
  const [state, setState] = useState<WeatherState>({
    metar: null,
    taf: null,
    station: null,
    loading: false,
    error: null,
    aiAnalysis: null,
    analyzing: false,
  });

  const loadData = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, aiAnalysis: null, analyzing: false }));
    
    try {
      const [metarData, tafData, stationData] = await Promise.all([
        fetchMetar(code),
        fetchTaf(code),
        fetchStationInfo(code)
      ]);

      if (!metarData && !tafData) {
        setState(prev => ({ ...prev, loading: false, error: 'Аэропорт не найден или нет данных.' }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        metar: metarData, 
        taf: tafData,
        station: stationData,
        loading: false,
        analyzing: true
      }));

      try {
        const analysis = await analyzeWeather(metarData, tafData);
        setState(prev => ({ ...prev, aiAnalysis: analysis, analyzing: false }));
      } catch (aiError) {
        console.error("AI Auto-analyze failed", aiError);
        setState(prev => ({ ...prev, analyzing: false }));
      }

    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: 'Ошибка при загрузке данных.' }));
    }
  }, []);

  useEffect(() => {
    loadData(INITIAL_ICAO);
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.length >= 3) {
      const code = inputVal.toUpperCase();
      setIcao(code);
      loadData(code);
    }
  };

  const knotsToMs = (knots: number | undefined) => {
    if (knots === undefined) return undefined;
    return (knots * 0.514444).toFixed(1);
  };

  const feetToMeters = (feet: number | undefined) => {
    if (feet === undefined) return null;
    return Math.round(feet * 0.3048);
  };

  const getWindDir = (dir: number | "VRB" | undefined) => {
    if (dir === undefined) return 'н/д';
    if (dir === 'VRB') return 'Переменный';
    return `${dir}°`;
  };

  const getCloudDescription = (code: string) => {
    const map: Record<string, string> = {
      'FEW': 'Малооблачно',
      'SCT': 'Разбросанная',
      'BKN': 'Значительная',
      'OVC': 'Сплошная',
      'VV': 'Верт. видимость',
      'NSC': 'Без сущ. облаков',
      'CAVOK': 'Ясно и видимо',
      'SKC': 'Ясно'
    };
    return map[code] || code;
  };

  const getClouds = () => {
    if (!state.metar?.clouds || state.metar.clouds.length === 0) return 'Небо чистое';
    
    return state.metar.clouds.map(c => {
      const desc = getCloudDescription(c.cover);
      const heightMeters = feetToMeters(c.base);
      const type = c.type ? ` (${c.type})` : '';
      return heightMeters 
        ? `${desc} на ${heightMeters}м${type}`
        : `${desc}${type}`;
    }).join(', ');
  };

  const getVisibilityStatus = (vis: string | number | undefined): { text: string, color: string } => {
    if (vis === undefined) return { text: '--', color: 'text-slate-400' };
    
    let val = typeof vis === 'string' ? parseInt(vis) : vis;
    if (vis === '10SM') val = 16000;
    if (typeof vis === 'string' && vis.includes('SM')) {
       val = parseFloat(vis) * 1609;
    }

    if (val >= 9999 || val >= 10000) return { text: 'Отличная', color: 'text-emerald-400' };
    if (val >= 5000) return { text: 'Хорошая', color: 'text-emerald-300' };
    if (val >= 2000) return { text: 'Удовлетворит.', color: 'text-yellow-400' };
    return { text: 'Плохая', color: 'text-red-400' };
  };

  const getVisibValue = (vis: string | number | undefined) => {
     if (vis === undefined) return '--';
     if (vis === 9999 || vis === '9999') return '≥ 10 км';
     if (typeof vis === 'number') return `${vis} м`;
     if (typeof vis === 'string' && vis.endsWith('SM')) return `${vis.replace('SM', '')} миль`;
     return vis;
  };

  const formatObsTime = (isoTime: any) => {
    if (isoTime === undefined || isoTime === null) return { utc: '--', relative: '' };
    
    let date: Date;
    const strVal = String(isoTime).trim();
    if (!strVal) return { utc: '--', relative: '' };

    const isNumeric = !isNaN(Number(strVal)) && !strVal.includes(':') && !strVal.includes('-');
    
    if (typeof isoTime === 'number' || isNumeric) {
       let timestamp = Number(strVal);
       if (timestamp < 10000000000) {
          timestamp *= 1000;
       }
       date = new Date(timestamp);
    } else {
       let safeIsoTime = strVal.replace(' ', 'T');
       if (!safeIsoTime.endsWith('Z') && !safeIsoTime.includes('+') && !safeIsoTime.includes('-')) {
          safeIsoTime += 'Z';
       }
       date = new Date(safeIsoTime);
    }
    
    if (isNaN(date.getTime())) return { utc: strVal, relative: '' };

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    const utcString = `${day}.${month} ${hours}:${minutes} UTC`;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    let relative = '';
    if (diffMins < 0 && diffMins > -60) {
        relative = 'Только что';
    } else if (diffMins < 0) {
        relative = ''; 
    } else if (diffMins < 60) {
      relative = `${diffMins} мин назад`;
    } else if (diffMins < 1440) {
      const hoursRel = Math.floor(diffMins / 60);
      relative = `${hoursRel} ч назад`;
    } else {
      const days = Math.floor(diffMins / 1440);
      relative = `${days} дн назад`;
    }

    return { utc: utcString, relative };
  };

  const cleanStationName = (name: string) => {
    if (!name) return "";
    return name
      .replace(/(International)?\s?Airport/i, '')
      .replace(/Intl/i, '')
      .replace(/Air Base/i, '')
      .trim();
  };

  const parseLocalTimeString = (timeStr: string) => {
     const parts = timeStr.split(' ');
     if (parts.length !== 2) return { time: timeStr, date: '' };

     const [datePart, timePart] = parts;
     const [day, month] = datePart.split('.');
     
     const months = [
       'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
     ];
     
     const monthIndex = parseInt(month) - 1;
     const monthName = months[monthIndex] || month;

     return {
        time: timePart,
        date: `${parseInt(day)} ${monthName}`
     };
  };

  const visStatus = getVisibilityStatus(state.metar?.visib);
  const metarTime = state.metar ? formatObsTime(state.metar.obsTime) : { utc: '--', relative: '' };
  
  let displayTime = metarTime.utc.split(' ')[1] || '--:--';
  let displayDate = metarTime.utc.split(' ')[0] || '--.--';
  let subTimeLabel = metarTime.relative;
  let isLocalTime = false;

  if (state.aiAnalysis?.local_time && !state.aiAnalysis.local_time.includes('XX')) {
      const parsed = parseLocalTimeString(state.aiAnalysis.local_time);
      displayTime = parsed.time;
      displayDate = parsed.date;
      subTimeLabel = "Местное время";
      isLocalTime = true;
  }
  
  const displayCityName = state.aiAnalysis?.airport_name_ru || cleanStationName(state.station?.name || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 pb-12 font-sans flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-sky-500/20 p-2 rounded-lg">
              <Plane className="w-6 h-6 text-sky-400" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
              AeroWeather
            </h1>
          </div>

          <form onSubmit={handleSearch} className="relative w-full max-w-xs ml-4">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Код ICAO (напр. UAAA)"
              className="w-full bg-slate-800 border border-slate-600 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-500 uppercase font-mono tracking-wide"
            />
            <button 
              type="submit" 
              className="absolute right-1 top-1 p-1.5 bg-sky-600 hover:bg-sky-500 rounded-full text-white transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 flex-grow w-full">
        
        {state.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center space-x-3 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{state.error}</span>
          </div>
        )}

        {state.loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mb-4"></div>
            <p className="text-slate-400 animate-pulse">Загрузка данных...</p>
          </div>
        )}

        {!state.loading && state.metar && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-col">
                        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                          {displayCityName || state.metar.icaoId}
                        </h2>
                        <div className="flex items-center space-x-3 mt-2">
                           <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono font-bold text-lg">
                             {state.metar.icaoId}
                           </span>
                           {state.station && displayCityName !== cleanStationName(state.station.name) && (
                             <span className="text-slate-400 font-light truncate hidden sm:inline-block">
                               {cleanStationName(state.station.name)}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 min-w-[160px] justify-center text-right transition-all duration-500">
                       <Clock className={`w-6 h-6 ${isLocalTime ? 'text-emerald-400' : 'text-sky-400'}`} />
                       <div className="flex flex-col items-end leading-none">
                          <span className="text-white font-mono font-bold text-3xl tracking-wide">
                            {displayTime}
                          </span>
                          <span className="text-sm text-slate-300 font-medium mt-1">
                             {displayDate}
                          </span>
                          <div className="flex flex-col items-end mt-1">
                              <span className="text-xs text-slate-500">
                                {subTimeLabel}
                              </span>
                              {isLocalTime && (
                                  <span className="text-[10px] text-slate-600 font-mono">
                                      {metarTime.utc}
                                  </span>
                              )}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard 
                    label="Температура" 
                    value={state.metar.temp} 
                    unit="°C" 
                    icon={<Thermometer className="w-6 h-6 text-white" />} 
                    colorClass="bg-orange-500/20 text-orange-400"
                    subValue={`Точка росы: ${state.metar.dewp}°C`}
                  />
                  
                  <InfoCard 
                    label="Ветер" 
                    value={knotsToMs(state.metar.wspd)} 
                    unit="м/с" 
                    icon={<Wind className="w-6 h-6 text-white" />} 
                    colorClass="bg-blue-500/20 text-blue-400"
                    subValue={`Направление: ${getWindDir(state.metar.wdir)} ${state.metar.wgst ? `(Порывы ${knotsToMs(state.metar.wgst)})` : ''}`}
                  />
                  
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 flex items-center space-x-4 hover:bg-slate-800/70 transition-colors">
                    <div className={`p-3 rounded-lg bg-slate-700/50 bg-purple-500/20 text-purple-400`}>
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Видимость</p>
                      <div className="flex flex-col">
                        <span className={`text-lg font-bold ${visStatus.color}`}>
                          {visStatus.text}
                        </span>
                        <span className="text-sm text-slate-400 font-medium">{getVisibValue(state.metar.visib)}</span>
                      </div>
                    </div>
                  </div>

                  <InfoCard 
                    label="Давление (QNH)" 
                    value={state.metar.altim} 
                    unit="гПа" 
                    icon={<Navigation className="w-6 h-6 text-white" />} 
                    colorClass="bg-emerald-500/20 text-emerald-400"
                  />
                </div>

                 <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <Cloud className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Облачность</p>
                      <p className="text-lg font-medium text-white leading-relaxed">{getClouds()}</p>
                      <p className="text-xs text-slate-500 mt-2">Высота указана над уровнем аэродрома</p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="lg:col-span-1 space-y-4">
                
                {state.analyzing && (
                  <div className="space-y-4 animate-pulse">
                    <div className="bg-slate-800/50 border border-indigo-500/20 rounded-2xl p-6 h-64 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                      <div className="space-y-2 text-center">
                        <div className="h-4 bg-indigo-500/20 rounded w-32 mx-auto"></div>
                        <p className="text-indigo-300 text-sm">Анализируем условия...</p>
                      </div>
                    </div>
                    <div className="h-32 bg-slate-800/50 rounded-xl"></div>
                  </div>
                )}

                {!state.analyzing && state.aiAnalysis && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    <div className="bg-slate-800/80 border-l-4 border-indigo-500 rounded-r-xl p-4 shadow-lg">
                      <h4 className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">Сводка</h4>
                      <p className="text-white text-sm leading-relaxed">{state.aiAnalysis.summary}</p>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 flex items-center justify-between border border-slate-700">
                      <span className="text-slate-400 text-sm">Условия:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                        state.aiAnalysis.conditions_rating.includes('Хорош') 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : state.aiAnalysis.conditions_rating.includes('Нелет') || state.aiAnalysis.conditions_rating.includes('Опас')
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {state.aiAnalysis.conditions_rating}
                      </span>
                    </div>

                    {state.aiAnalysis.hazards.length > 0 ? (
                      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <h4 className="text-red-400 font-bold text-sm">Опасные явления</h4>
                        </div>
                        <ul className="space-y-2">
                          {state.aiAnalysis.hazards.map((hazard, idx) => (
                            <li key={idx} className="text-red-200 text-sm flex items-start">
                              <span className="mr-2">•</span> {hazard}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                         <span className="text-emerald-200 text-sm">Опасных явлений нет</span>
                      </div>
                    )}

                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-3 text-sky-400">
                        <CalendarDays className="w-4 h-4" />
                        <h4 className="font-bold text-sm uppercase">Прогноз</h4>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-700/50 pt-3">
                        {state.aiAnalysis.forecast_summary}
                      </p>
                    </div>
                    
                    <div className="text-center text-xs text-slate-600">
                      AI Gemini 2.5 Flash
                    </div>
                  </div>
                )}
                
                {!state.analyzing && !state.aiAnalysis && state.metar && (
                   <button 
                     onClick={() => loadData(icao)}
                     className="w-full text-xs text-slate-500 hover:text-slate-300 mt-4"
                   >
                     Повторить анализ
                   </button>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800">
              <RawDataDisplay 
                title="RAW METAR" 
                data={state.metar.rawOb} 
                timestamp={String(state.metar.obsTime)} 
              />
            </div>
          </div>
        )}

        {!state.loading && !state.metar && !state.error && (
           <div className="text-center py-20 opacity-50">
             <Plane className="w-16 h-16 mx-auto mb-4 text-slate-600" />
             <p>Введите код аэропорта (ICAO), чтобы получить сводку.</p>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;