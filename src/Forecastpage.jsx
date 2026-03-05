import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Upload, FileText, X, Cpu, CheckCircle, Loader,
  Sun, Zap, Thermometer, FlaskConical, RefreshCw
} from 'lucide-react';

// ─── ข้อมูล Default: SANKO_Clean_Year_4_2023.csv (aggregate รายเดือน) ────────
const DEFAULT_MONTHLY = [
  { label:'Jan', demand:16985, glob_avg:371.8, t_amb:28.6, energy:16984 },
  { label:'Feb', demand:17636, glob_avg:387.0, t_amb:30.1, energy:17636 },
  { label:'Mar', demand:19315, glob_avg:429.2, t_amb:31.4, energy:19314 },
  { label:'Apr', demand:20763, glob_avg:461.4, t_amb:31.9, energy:20762 },
  { label:'May', demand:18789, glob_avg:417.3, t_amb:31.7, energy:18788 },
  { label:'Jun', demand:18459, glob_avg:406.6, t_amb:30.8, energy:18458 },
  { label:'Jul', demand:16022, glob_avg:352.6, t_amb:30.6, energy:16021 },
  { label:'Aug', demand:17343, glob_avg:382.6, t_amb:30.6, energy:17342 },
  { label:'Sep', demand:15468, glob_avg:340.7, t_amb:29.9, energy:15467 },
  { label:'Oct', demand:15596, glob_avg:341.6, t_amb:30.1, energy:15595 },
  { label:'Nov', demand:15453, glob_avg:338.1, t_amb:29.5, energy:15453 },
  { label:'Dec', demand:16932, glob_avg:369.6, t_amb:28.7, energy:16931 },
];

const FIREBASE_MODELS = [
  { id:'lstm_model',             label:'LSTM',             desc:'Univariate (P_Grid / demand)',   nf:0.030 },
  { id:'cnn_lstm_model',         label:'CNN-LSTM',         desc:'CNN feature extractor + LSTM',   nf:0.025 },
  { id:'tft_model',              label:'TFT',              desc:'Temporal Fusion Transformer',    nf:0.020 },
  { id:'tft_model_multivariate', label:'TFT Multivariate', desc:'TFT + GlobHor + T_Amb features', nf:0.015 },
];

// ─── CSV Parser ───────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g,'_'));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i]?.trim(); });
    return row;
  });
};

// ─── Auto-detect & aggregate CSV ──────────────────────────────────────────────
const processUploadedCSV = (rows) => {
  const keys = Object.keys(rows[0]).map(k => k.toLowerCase());

  // detect demand column
  const demandCol = ['p_grid','demand','value','energy','power','pgrid','p_grid.1']
    .find(k => keys.includes(k)) ?? keys.find(k => k.includes('grid') || k.includes('demand') || k.includes('power'));
  const globCol   = keys.find(k => k.includes('glob') || k.includes('irr') || k.includes('solar'));
  const tempCol   = keys.find(k => k.includes('t_amb') || k.includes('temp'));
  const dateCol   = keys.find(k => k.includes('date') || k.includes('time') || k.includes('month'));

  if (!demandCol) throw new Error(`ไม่พบคอลัมน์ demand/p_grid/power ใน CSV (พบ: ${keys.slice(0,6).join(', ')})`);

  // If many rows → aggregate every 12 (half-hour readings per day) or by month
  if (rows.length > 100) {
    // group every 12 rows as 1 "day" then group 30 days as 1 "month"
    const RPPD = 12;
    const days = [];
    for (let d = 0; d < rows.length; d += RPPD) {
      const chunk = rows.slice(d, d + RPPD);
      const demandSum = chunk.reduce((s, r) => s + (parseFloat(r[demandCol]) || 0), 0);
      const globAvg   = globCol ? chunk.reduce((s, r) => s + (parseFloat(r[globCol])  || 0), 0) / chunk.length : null;
      const tempAvg   = tempCol ? chunk.reduce((s, r) => s + (parseFloat(r[tempCol])  || 0), 0) / chunk.length : null;
      days.push({ demand: demandSum, glob_avg: globAvg, t_amb: tempAvg });
    }

    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DPM = 30;
    return days.reduce((acc, day, i) => {
      const mi = Math.floor(i / DPM);
      if (mi >= 12) return acc;
      if (!acc[mi]) acc[mi] = { label: monthLabels[mi], demand: 0, glob_avg: 0, t_amb: 0, _n: 0 };
      acc[mi].demand   += day.demand;
      acc[mi].glob_avg += day.glob_avg ?? 0;
      acc[mi].t_amb    += day.t_amb    ?? 0;
      acc[mi]._n++;
      return acc;
    }, []).filter(Boolean).map(m => ({
      label:    m.label,
      demand:   Math.round(m.demand),
      glob_avg: m._n ? parseFloat((m.glob_avg / m._n).toFixed(1)) : null,
      t_amb:    m._n ? parseFloat((m.t_amb    / m._n).toFixed(1)) : null,
    }));
  }

  // Small CSV: use as-is
  return rows.map((r, i) => ({
    label:    dateCol ? (r[dateCol] ?? `R${i+1}`) : `R${i+1}`,
    demand:   parseFloat(r[demandCol]) || 0,
    glob_avg: globCol ? parseFloat(r[globCol]) || null : null,
    t_amb:    tempCol ? parseFloat(r[tempCol]) || null : null,
  }));
};

// ─── Mock Prediction Engine ───────────────────────────────────────────────────
const mockPredict = (data, modelId) => {
  const model   = FIREBASE_MODELS.find(m => m.id === modelId) ?? FIREBASE_MODELS[0];
  const demands = data.map(d => d.demand);
  const n       = demands.length;
  const W       = Math.min(n, 6);
  const wts     = Array.from({ length: W }, (_, i) => i + 1);
  const wsum    = wts.reduce((a, b) => a + b, 0);
  const wma     = demands.slice(-W).reduce((s, v, i) => s + v * wts[i], 0) / wsum;
  const xm = (n - 1) / 2, ym = demands.reduce((a, b) => a + b, 0) / n;
  const slope   = demands.reduce((s, y, x) => s + (x - xm) * (y - ym), 0) /
                  (demands.reduce((s, _, x) => s + (x - xm) ** 2, 0) || 1);
  const useGlob = modelId === 'tft_model_multivariate' && data[0]?.glob_avg;
  const avgGlob = useGlob ? data.reduce((s, d) => s + (d.glob_avg || 0), 0) / n : 1;

  const STEPS   = 6;
  const history = data.map(d => ({ label: d.label, actual: d.demand, forecast: null, upper: null, lower: null }));
  const forecasts = Array.from({ length: STEPS }, (_, i) => {
    let base = wma + slope * (i + 1) * 0.3;
    if (useGlob) {
      const futureGlob = data[Math.max(0, n - STEPS + i)]?.glob_avg ?? avgGlob;
      base *= (0.6 + (futureGlob / avgGlob) * 0.4);
    }
    const noise = (Math.random() - 0.5) * 2 * base * model.nf;
    const val   = Math.round(Math.max(0, base + noise));
    const ci    = Math.round(Math.abs(val) * (0.05 + model.nf));
    return { label: `F+${i+1}`, actual: null, forecast: val, upper: val + ci, lower: Math.max(0, val - ci) };
  });

  const mape = (model.nf * 100 * (0.85 + Math.random() * 0.3)).toFixed(1);
  const conf = Math.min(98, Math.round(96 - model.nf * 200 + Math.random() * 2));
  return { result: [...history, ...forecasts], mape: `${mape}%`, confidence: `${conf}%` };
};

// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const Forecast = ({ theme, language, currentLang, setShowForecastModal }) => {
  const [selectedModel, setSelectedModel] = useState('tft_model_multivariate');
  const [activeData,  setActiveData]  = useState(DEFAULT_MONTHLY);   // ข้อมูลที่ใช้จริง
  const [csvFile,     setCsvFile]     = useState(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [parseStatus, setParseStatus] = useState('idle'); // idle|parsing|error
  const [parseError,  setParseError]  = useState('');
  const [chartData,   setChartData]   = useState(null);
  const [status,      setStatus]      = useState('idle');
  const [metrics,     setMetrics]     = useState({ mape:'—', confidence:'—', inferenceMs:'—' });
  const fileInputRef = useRef(null);

  const dark  = theme === 'dark';
  const model = FIREBASE_MODELS.find(m => m.id === selectedModel);
  const isDefault = !csvFile;

  const colors = {
    actual:   '#26df9b', forecast: dark?'#ffe70e':'#ff9f0e',
    upper:    dark?'#38e1ff':'#1fbfff', lower:'#4580ff',
    grid:     dark?'#334155':'#e2e8f0', text: dark?'#94a3b8':'#64748b',
    ttBg:     dark?'#1e293b':'#fff',    ttText:dark?'#fff':'#0f172a',
    bar:      dark?'#38bdf8':'#3b82f6',
  };

  // KPI stats
  const stats = useMemo(() => {
    const d    = activeData;
    const total = d.reduce((s, r) => s + r.demand, 0);
    const peak  = d.reduce((a, b) => b.demand > a.demand ? b : a, d[0]);
    const gAvg  = d[0]?.glob_avg != null ? (d.reduce((s, r) => s + (r.glob_avg||0), 0) / d.length).toFixed(1) : '—';
    const tAvg  = d[0]?.t_amb    != null ? (d.reduce((s, r) => s + (r.t_amb   ||0), 0) / d.length).toFixed(1) : '—';
    return { total: Math.round(total).toLocaleString(), peak: peak?.label ?? '—', gAvg, tAvg };
  }, [activeData]);

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file?.name.endsWith('.csv')) {
      setParseError('กรุณาเลือกไฟล์ .csv เท่านั้น'); setParseStatus('error'); return;
    }
    setCsvFile(file); setParseStatus('parsing'); setParseError('');
    setChartData(null); setStatus('idle'); setMetrics({ mape:'—', confidence:'—', inferenceMs:'—' });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows      = parseCSV(e.target.result);
        if (!rows.length) throw new Error('CSV ว่างเปล่า');
        const processed = processUploadedCSV(rows);
        if (!processed.length) throw new Error('ไม่สามารถอ่านข้อมูลได้');
        setActiveData(processed);
        setParseStatus('ready');
      } catch (err) {
        setParseError(err.message); setParseStatus('error');
        setActiveData(DEFAULT_MONTHLY);
      }
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const removeFile = () => {
    setCsvFile(null); setParseStatus('idle'); setParseError('');
    setActiveData(DEFAULT_MONTHLY);
    setChartData(null); setStatus('idle');
    setMetrics({ mape:'—', confidence:'—', inferenceMs:'—' });
  };

  // ── Run forecast ───────────────────────────────────────────────────────────
  const runForecast = async () => {
    setStatus('running');
    await new Promise(r => setTimeout(r, 650));
    const t0 = performance.now();
    const { result, mape, confidence } = mockPredict(activeData, selectedModel);
    setChartData(result);
    setMetrics({ mape, confidence, inferenceMs: `${Math.round(performance.now() - t0)}ms` });
    setStatus('done');
  };

  const resetForecast = () => {
    setChartData(null); setStatus('idle');
    setMetrics({ mape:'—', confidence:'—', inferenceMs:'—' });
  };

  const displayData  = chartData ?? activeData.map(d => ({ ...d, forecast:null, upper:null, lower:null }));
  const hasGlob      = activeData[0]?.glob_avg != null;
  const hasTemp      = activeData[0]?.t_amb    != null;
  const card         = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const card2        = dark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      <div className={`${card} rounded-xl shadow-sm border p-6`}>

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${dark?'text-white':'text-slate-800'}`}>
              {currentLang?.demandForecasting ?? 'Solar Energy Forecasting'}
            </h2>
            <p className={`mt-1 text-sm ${dark?'text-slate-400':'text-slate-500'}`}>
              {isDefault ? 'SANKO Solar PV · ข้อมูลจริงปี 2024 - 2025 · 8,760 readings'
                         : `📂 ${csvFile?.name} · ${activeData.length} periods`}
            </p>
          </div>
          <button onClick={() => setShowForecastModal?.(true)}
            className="self-start bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            {currentLang?.generateForecast ?? 'Generate Forecast'}
          </button>
        </div>

        {/* ── Upload Zone ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-semibold ${dark?'text-slate-300':'text-slate-700'}`}>
              อัปโหลดข้อมูล CSV
            </p>
            {!isDefault && (
              <button onClick={removeFile}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition ${dark?'text-slate-400 hover:text-white hover:bg-slate-700':'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                <RefreshCw className="w-3 h-3" /> ใช้ข้อมูล SANKO Default
              </button>
            )}
          </div>

          {isDefault ? (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-6 py-5 flex items-center gap-4 cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : dark ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-700' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}>
              <Upload className={`w-8 h-8 flex-shrink-0 ${dark?'text-slate-500':'text-slate-400'}`} />
              <div>
                <p className={`font-medium text-sm ${dark?'text-slate-300':'text-slate-600'}`}>
                  ลากวางหรือคลิกเพื่ออัปโหลด CSV ใหม่
                </p>
                <p className={`text-xs mt-0.5 ${dark?'text-slate-500':'text-slate-400'}`}>
                  รองรับ: date/demand/p_grid/value/glob/t_amb · ตรวจจับคอลัมน์อัตโนมัติ
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            /* File info card */
            <div className={`rounded-xl border p-4 ${
              parseStatus === 'error'
                ? 'border-red-400 bg-red-500 bg-opacity-10'
                : parseStatus === 'ready'
                ? (dark?'border-green-600 bg-green-900 bg-opacity-20':'border-green-300 bg-green-50')
                : (dark?'border-slate-600 bg-slate-700':'border-slate-200 bg-slate-50')}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className={`w-8 h-8 flex-shrink-0 ${parseStatus==='error'?'text-red-400':parseStatus==='ready'?'text-green-400':'text-blue-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${dark?'text-white':'text-slate-800'}`}>{csvFile?.name}</p>
                    <p className={`text-xs mt-0.5 ${dark?'text-slate-400':'text-slate-500'}`}>
                      {parseStatus === 'parsing' && '⏳ กำลังอ่านไฟล์...'}
                      {parseStatus === 'ready'   && `✅ ${activeData.length} periods · คอลัมน์: ${Object.keys({demand:1,...(hasGlob?{glob_avg:1}:{}),...(hasTemp?{t_amb:1}:{})}).join(', ')}`}
                      {parseStatus === 'error'   && <span className="text-red-400">❌ {parseError}</span>}
                    </p>
                  </div>
                </div>
                <button onClick={removeFile}
                  className={`p-1.5 rounded-lg transition ${dark?'hover:bg-slate-600 text-slate-400':'hover:bg-slate-200 text-slate-500'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              {parseStatus === 'ready' && (
                <div className={`mt-3 p-2 rounded-lg text-xs font-mono overflow-x-auto ${dark?'bg-slate-900 text-slate-300':'bg-white text-slate-600 border border-slate-200'}`}>
                  <span className={dark?'text-slate-500':'text-slate-400'}>Preview: </span>
                  {activeData.slice(0,3).map((r,i) => (
                    <span key={i} className="mr-3">
                      {r.label}: {r.demand.toLocaleString()} kW
                      {r.glob_avg != null ? ` | ☀️${r.glob_avg}` : ''}
                      {r.t_amb    != null ? ` | 🌡️${r.t_amb}°C` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Re-upload button */}
              <button onClick={() => fileInputRef.current?.click()}
                className={`mt-2 text-xs flex items-center gap-1 ${dark?'text-blue-400 hover:text-blue-300':'text-blue-600 hover:text-blue-700'}`}>
                <Upload className="w-3 h-3" /> เปลี่ยนไฟล์
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Format hint */}
          <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${dark?'bg-slate-900 text-slate-400':'bg-slate-50 text-slate-500 border border-slate-200'}`}>
            <span className="font-semibold">รูปแบบที่รองรับ:</span>
            {' '}date,demand{' '}·{' '}date,p_grid,GlobHor,T_Amb{' '}·{' '}date,value{' '}·{' '}SANKO format (18 คอลัมน์)
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon:<Zap className="w-4 h-4"/>, label: isDefault?'Total Energy 2023':'Total Demand', value:`${stats.total} kW`, c:'blue'   },
            { icon:<Sun className="w-4 h-4"/>, label:'Peak Period',    value:stats.peak,              c:'yellow' },
            { icon:<Sun className="w-4 h-4"/>, label:'Avg Irradiance', value:hasGlob?`${stats.gAvg} W/m²`:'—', c:'orange' },
            { icon:<Thermometer className="w-4 h-4"/>, label:'Avg Temp', value:hasTemp?`${stats.tAvg} °C`:'—', c:'red' },
          ].map(({ icon, label, value, c }) => (
            <div key={label} className={`rounded-lg p-3 border ${
              c==='blue'  ?(dark?'bg-blue-900/30 border-blue-700'  :'bg-blue-50 border-blue-200')
              :c==='yellow'?(dark?'bg-yellow-900/30 border-yellow-700':'bg-yellow-50 border-yellow-200')
              :c==='orange'?(dark?'bg-orange-900/30 border-orange-700':'bg-orange-50 border-orange-200')
              :             (dark?'bg-red-900/30 border-red-700'   :'bg-red-50 border-red-200')}`}>
              <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${
                c==='blue'?'text-blue-400':c==='yellow'?'text-yellow-400':c==='orange'?'text-orange-400':'text-red-400'}`}>
                {icon}{label}
              </div>
              <p className={`text-lg font-bold ${dark?'text-white':'text-slate-800'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Model + Metrics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <p className={`text-sm font-semibold mb-2 ${dark?'text-slate-300':'text-slate-700'}`}>
              เลือกโมเดล Firebase ML
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FIREBASE_MODELS.map(m => (
                <button key={m.id} onClick={() => { setSelectedModel(m.id); resetForecast(); }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedModel===m.id
                      ?(dark?'border-blue-500 bg-blue-900/40':'border-blue-500 bg-blue-50')
                      :(dark?'border-slate-600 bg-slate-700 hover:border-slate-500':'border-slate-200 hover:border-slate-300')}`}>
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 flex-shrink-0 ${selectedModel===m.id?'text-blue-400':(dark?'text-slate-500':'text-slate-400')}`} />
                    <div className="min-w-0">
                      <p className={`font-semibold text-xs truncate ${selectedModel===m.id?(dark?'text-blue-300':'text-blue-700'):(dark?'text-white':'text-slate-800')}`}>{m.label}</p>
                      <p className={`text-xs truncate ${dark?'text-slate-400':'text-slate-500'}`}>{m.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={runForecast}
              disabled={status==='running' || parseStatus==='parsing' || parseStatus==='error'}
              className={`mt-3 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                status==='running'||parseStatus==='parsing'||parseStatus==='error'
                  ?'bg-slate-600 text-slate-400 cursor-not-allowed opacity-60'
                  :'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}>
              {status==='running'
                ?<><Loader className="w-4 h-4 animate-spin"/>กำลังพยากรณ์ด้วย {model?.label}...</>
                :status==='done'
                ?<><CheckCircle className="w-4 h-4"/>รันโมเดลใหม่</>
                :<><Cpu className="w-4 h-4"/>Run {model?.label} Forecast</>}
            </button>
          </div>

          {/* Metrics panel */}
          <div className={`${card2} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <p className={`text-sm font-semibold ${dark?'text-slate-300':'text-slate-700'}`}>Forecast Metrics</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label:'MAPE',       value:metrics.mape,        vc:status==='done'?'text-green-400':'' },
                { label:'Confidence', value:metrics.confidence,  vc:status==='done'?'text-green-400':'' },
                { label:'Time',       value:metrics.inferenceMs, vc:'' },
                { label:'Model',      value:model?.label??'—',   vc:dark?'text-blue-300':'text-blue-600' },
                { label:'Data',       value:isDefault?'SANKO 2023':csvFile?.name?.replace('.csv','')??'—', vc:'' },
                { label:'Periods',    value:`${activeData.length}`, vc:'' },
              ].map(({ label, value, vc }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className={dark?'text-slate-400':'text-slate-500'}>{label}:</span>
                  <span className={`font-semibold truncate max-w-[120px] ${vc||(dark?'text-white':'text-slate-800')}`} title={value}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Chart ── */}
        <div className="h-[380px] w-full">
          <p className={`text-xs font-semibold mb-2 ${dark?'text-slate-400':'text-slate-500'}`}>
            Demand (kW) + AI Forecast 6 Periods
            {status==='done'}
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top:5, right:10, bottom:5, left:10 }}>
              <defs>
                <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={colors.actual}   stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={colors.actual}   stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gFor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={colors.forecast} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={colors.forecast} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="label" stroke={colors.text} tick={{ fill:colors.text, fontSize:11 }} />
              <YAxis stroke={colors.text} tick={{ fill:colors.text, fontSize:11 }}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ backgroundColor:colors.ttBg, border:`1px solid ${colors.grid}`, borderRadius:'8px', color:colors.ttText }}
                formatter={(v, name) => [v != null ? `${v.toLocaleString()} kW` : '—', name]} />
              <Legend />
              {status==='done' && (
                <ReferenceLine x={activeData[activeData.length-1].label}
                  stroke={dark?'#64748b':'#94a3b8'} strokeDasharray="4 4"
                  label={{ value:'▶ Forecast', fill:dark?'#94a3b8':'#64748b', fontSize:10 }} />
              )}
              <Area type="monotone" dataKey="upper"    name="Upper Bound" stroke={colors.upper}    fill={colors.upper}    fillOpacity={0.08} strokeDasharray="5 5" strokeWidth={1} />
              <Area type="monotone" dataKey="forecast" name="Forecast"    stroke={colors.forecast} fill="url(#gFor)"     strokeWidth={2.5} />
              <Area type="monotone" dataKey="lower"    name="Lower Bound" stroke={colors.lower}    fill={colors.lower}    fillOpacity={0.08} strokeDasharray="5 5" strokeWidth={1} />
              <Area type="monotone" dataKey="actual"   name="Actual"      stroke={colors.actual}   fill="url(#gAct)"     strokeWidth={2.5} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Bar breakdown (เฉพาะเมื่อมี multi-feature) ── */}
        {hasGlob && (
          <div className="mt-6">
            <p className={`text-xs font-semibold mb-2 ${dark?'text-slate-400':'text-slate-500'}`}>
              Feature Breakdown: Demand vs Irradiance vs Temperature
            </p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="label" stroke={colors.text} tick={{ fill:colors.text, fontSize:10 }} />
                  <YAxis yAxisId="l" stroke={colors.text} tick={{ fill:colors.text, fontSize:10 }}
                    tickFormatter={v => v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                  <YAxis yAxisId="r" orientation="right" stroke={colors.text} tick={{ fill:colors.text, fontSize:10 }} />
                  <Tooltip contentStyle={{ backgroundColor:colors.ttBg, border:`1px solid ${colors.grid}`, borderRadius:'8px', color:colors.ttText }} />
                  <Legend />
                  <Bar yAxisId="l" dataKey="demand"   name="Demand (kW)"   fill={colors.bar} radius={[3,3,0,0]} />
                  {hasGlob && <Bar yAxisId="r" dataKey="glob_avg" name="GlobHor (W/m²)" fill="#f59e0b" radius={[3,3,0,0]} fillOpacity={0.8} />}
                  {hasTemp && <Bar yAxisId="r" dataKey="t_amb"    name="T_Amb (°C)"     fill="#f87171" radius={[3,3,0,0]} fillOpacity={0.7} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Forecast;