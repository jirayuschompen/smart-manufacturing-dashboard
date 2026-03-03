import React, { useState, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Upload, FileText, X, Cpu, AlertCircle, CheckCircle, Loader } from 'lucide-react';

// ─── Firebase helpers ──────────────────────────────────────────────────────────
// ใช้ firebase instance จาก window (โหลดใน LoginMockup แล้ว)
const getIdToken = async () => {
  try {
    const auth = window.firebase?.auth();
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : null;
  } catch {
    return null;
  }
};

// Cloud Function URL – เปลี่ยนเป็น URL จริงหลัง deploy
const PREDICT_URL =
  'https://us-central1-smart-manufacturing-dashboard.cloudfunctions.net/predictDemand';

// ─── Available models (ดึงจาก Firebase ML) ────────────────────────────────────
const FIREBASE_MODELS = [
  { id: 'lstm_model',            label: 'LSTM Model',                  desc: 'Long Short-Term Memory – univariate' },
  { id: 'cnn_lstm_model',        label: 'CNN-LSTM Model',              desc: 'CNN feature extractor + LSTM' },
  { id: 'tft_model',             label: 'TFT Model',                   desc: 'Temporal Fusion Transformer – univariate' },
  { id: 'tft_model_multivariate',label: 'TFT Multivariate',            desc: 'TFT รองรับหลาย feature' },
];

// ─── Parse CSV helper ─────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i]?.trim(); });
    return row;
  });
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Forecast = ({
  theme,
  language,
  currentLang,
  demandDataSets,
  demandPeriod,
  setDemandPeriod,
  setShowForecastModal,
}) => {
  const [selectedModel, setSelectedModel] = useState('lstm_model');
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [chartData, setChartData] = useState(demandDataSets?.[demandPeriod] ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | parsing | predicting | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [metrics, setMetrics] = useState({ mape: '8.5%', confidence: '92%', inferenceMs: '—' });
  const fileInputRef = useRef(null);

  const colors = {
    actual:     '#26df9b',
    forecast:   theme === 'dark' ? '#ffe70e' : '#ff9f0e',
    upper:      theme === 'dark' ? '#38e1ff' : '#1fbfff',
    lower:      theme === 'dark' ? '#1fbfff' : '#4580ff',
    grid:       theme === 'dark' ? '#334155' : '#e2e8f0',
    text:       theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg:  theme === 'dark' ? '#1e293b' : '#fff',
    tooltipText:theme === 'dark' ? '#fff' : '#0f172a',
  };

  // ── Handle file ────────────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a .csv file');
      setStatus('error');
      return;
    }
    setCsvFile(file);
    setStatus('parsing');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        if (rows.length === 0) throw new Error('CSV ว่างเปล่า');
        setCsvData(rows);
        setStatus('idle');
      } catch (err) {
        setErrorMsg(err.message);
        setStatus('error');
      }
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const removeFile = () => {
    setCsvFile(null);
    setCsvData(null);
    setStatus('idle');
    setErrorMsg('');
    setChartData(demandDataSets?.[demandPeriod] ?? []);
  };

  // ── Run prediction via Cloud Function ────────────────────────────────────
  const runPrediction = async () => {
    if (!csvData) { setErrorMsg('กรุณาอัปโหลดไฟล์ CSV ก่อน'); setStatus('error'); return; }

    setStatus('predicting');
    setErrorMsg('');

    try {
      const token = await getIdToken();
      const t0 = performance.now();

      const response = await fetch(PREDICT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ model: selectedModel, data: csvData }),
      });

      const elapsed = Math.round(performance.now() - t0);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      /*
        คาดว่า Cloud Function ส่งกลับมาแบบ:
        {
          predictions: [ { label, actual, forecast, upper, lower }, ... ],
          mape: "7.2%",
          confidence: "94%"
        }
      */
      setChartData(result.predictions);
      setMetrics({
        mape:        result.mape        ?? metrics.mape,
        confidence:  result.confidence  ?? metrics.confidence,
        inferenceMs: `${elapsed}ms`,
      });
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const cardBase = theme === 'dark'
    ? 'bg-slate-800 border-slate-700'
    : 'bg-white border-slate-200';

  return (
    <div className="space-y-6">
      <div className={`${cardBase} rounded-xl shadow-sm border p-6`}>

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {currentLang?.demandForecasting ?? 'Demand Forecasting'}
            </h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              {language === 'th' ? 'อัปโหลด CSV แล้วเลือกโมเดล Firebase ML' : 'Upload CSV & select Firebase ML model'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
              {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                <button key={p} onClick={() => setDemandPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    demandPeriod === p
                      ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200')
                      : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                  }`}>
                  {p === 'daily' ? 'Day' : p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>

            <button onClick={() => setShowForecastModal?.(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              {currentLang?.generateForecast ?? 'Generate Forecast'}
            </button>
          </div>
        </div>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard theme={theme}
            label={language === 'th' ? 'ความแม่นยำ (MAPE)' : 'Forecast Accuracy (MAPE)'}
            value={metrics.mape}
            labelColor={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}
            valueColor={theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}
            bgColor={theme === 'dark' ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'} />
          <MetricCard theme={theme}
            label={language === 'th' ? 'ความเชื่อมั่นของโมเดล' : 'Model Confidence'}
            value={metrics.confidence}
            labelColor={theme === 'dark' ? 'text-green-300' : 'text-green-600'}
            valueColor={theme === 'dark' ? 'text-green-400' : 'text-green-700'}
            bgColor={theme === 'dark' ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'} />
          <MetricCard theme={theme}
            label={language === 'th' ? 'Inference Time' : 'Inference Time'}
            value={metrics.inferenceMs}
            labelColor={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}
            valueColor={theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}
            bgColor={theme === 'dark' ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50'} />
        </div>

        {/* ── Upload + Model Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* CSV Upload */}
          <div>
            <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'th' ? '① อัปโหลดข้อมูล CSV' : '① Upload CSV Data'}
            </p>

            {!csvFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : theme === 'dark'
                      ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-700'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}>
                <Upload className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                <p className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {language === 'th' ? 'ลากวางหรือคลิกเพื่อเลือกไฟล์' : 'Drag & drop or click to select'}
                </p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  CSV format: date, demand (และ feature อื่นๆ สำหรับ multivariate)
                </p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className={`rounded-xl p-4 border ${
                status === 'error'
                  ? 'border-red-400 bg-red-500 bg-opacity-10'
                  : theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className={`w-8 h-8 ${status === 'error' ? 'text-red-400' : 'text-blue-400'}`} />
                    <div>
                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{csvFile.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {csvData ? `${csvData.length} rows` : status === 'parsing' ? 'Parsing...' : ''}
                        {status === 'error' && <span className="text-red-400 ml-1">{errorMsg}</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={removeFile} className={`p-1 rounded-lg hover:bg-slate-600 transition ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {csvData && (
                  <div className={`mt-3 p-2 rounded-lg text-xs font-mono overflow-x-auto ${theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    <p className="text-slate-500 mb-1">Preview (3 rows):</p>
                    {csvData.slice(0, 3).map((row, i) => (
                      <p key={i}>{Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CSV Format Guide */}
            <div className={`mt-2 p-3 rounded-lg text-xs ${theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
              <p className="font-semibold mb-1">📋 CSV Format:</p>
              <p className="font-mono">date,demand,temp,promo  ← TFT Multivariate</p>
              <p className="font-mono">date,demand             ← LSTM / CNN-LSTM / TFT</p>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <p className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'th' ? '② เลือกโมเดล Firebase ML' : '② Select Firebase ML Model'}
            </p>

            <div className="space-y-2">
              {FIREBASE_MODELS.map((m) => (
                <button key={m.id} onClick={() => setSelectedModel(m.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedModel === m.id
                      ? (theme === 'dark'
                          ? 'border-blue-500 bg-blue-900 bg-opacity-40'
                          : 'border-blue-500 bg-blue-50')
                      : (theme === 'dark'
                          ? 'border-slate-600 bg-slate-700 hover:border-slate-500'
                          : 'border-slate-200 hover:border-slate-300')
                  }`}>
                  <div className="flex items-center gap-3">
                    <Cpu className={`w-5 h-5 flex-shrink-0 ${selectedModel === m.id ? 'text-blue-400' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${selectedModel === m.id ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-700') : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>
                        {m.label}
                      </p>
                      <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{m.desc}</p>
                    </div>
                    {selectedModel === m.id && (
                      <span className="text-xs font-medium text-blue-400 bg-blue-900 bg-opacity-40 px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={runPrediction}
              disabled={!csvData || status === 'predicting'}
              className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                !csvData || status === 'predicting'
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-900'
              }`}>
              {status === 'predicting' ? (
                <><Loader className="w-4 h-4 animate-spin" /> {language === 'th' ? 'กำลังพยากรณ์...' : 'Running prediction...'}</>
              ) : status === 'done' ? (
                <><CheckCircle className="w-4 h-4" /> {language === 'th' ? 'พยากรณ์ใหม่อีกครั้ง' : 'Re-run Forecast'}</>
              ) : (
                <><Cpu className="w-4 h-4" /> {language === 'th' ? 'เริ่มพยากรณ์' : 'Run Forecast'}</>
              )}
            </button>

            {status === 'error' && errorMsg && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{errorMsg}</p>
              </div>
            )}

            {status === 'done' && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-400">
                  {language === 'th' ? `พยากรณ์สำเร็จด้วย ${FIREBASE_MODELS.find(m => m.id === selectedModel)?.label}` : `Forecast complete with ${FIREBASE_MODELS.find(m => m.id === selectedModel)?.label}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.actual} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.actual} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.forecast} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.forecast} stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="label" stroke={colors.text} tick={{ fill: colors.text }} />
              <YAxis stroke={colors.text} tick={{ fill: colors.text }} />
              <Tooltip contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.grid}`, borderRadius: '8px', color: colors.tooltipText }} />
              <Legend />

              <Area type="monotone" dataKey="upper"    stroke={colors.upper}    fill={colors.upper}    fillOpacity={0.1} strokeDasharray="5 5" name="Upper Bound" />
              <Area type="monotone" dataKey="forecast" stroke={colors.forecast} strokeWidth={2} fill="url(#gradForecast)" name="Forecast" />
              <Area type="monotone" dataKey="lower"    stroke={colors.lower}    fill={colors.lower}    fillOpacity={0.1} strokeDasharray="5 5" name="Lower Bound" />
              <Area type="monotone" dataKey="actual"   stroke={colors.actual}   strokeWidth={2} fill="url(#gradActual)" name="Actual" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Footer Info ── */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} rounded-lg p-4`}>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'} mb-2`}>
              {language === 'th' ? 'โมเดลที่ใช้งาน' : 'Active Model'}
            </h4>
            <div className="space-y-2 text-sm">
              <CleanInfoRow theme={theme} label={language === 'th' ? 'ชื่อโมเดล' : 'Model'} value={FIREBASE_MODELS.find(m => m.id === selectedModel)?.label ?? '—'} />
              <CleanInfoRow theme={theme} label="Model ID" value={selectedModel} />
              <CleanInfoRow theme={theme} label={language === 'th' ? 'แหล่งที่มา' : 'Source'} value="Firebase ML (Custom)" />
              <CleanInfoRow theme={theme} label={language === 'th' ? 'ข้อมูล' : 'Input'} value={csvData ? `${csvData.length} rows` : '—'} />
            </div>
          </div>

          <div className={`border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} rounded-lg p-4`}>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'} mb-2`}>
              {language === 'th' ? 'ตัวชี้วัดประสิทธิภาพ' : 'Performance Metrics'}
            </h4>
            <div className="space-y-2 text-sm">
              <CleanInfoRow theme={theme} label="MAPE"           value={metrics.mape}        valueColor="text-green-500" boldValue />
              <CleanInfoRow theme={theme} label="Confidence"     value={metrics.confidence}  valueColor="text-green-500" boldValue />
              <CleanInfoRow theme={theme} label="Inference Time" value={metrics.inferenceMs} />
              <CleanInfoRow theme={theme} label="Backend"        value="Cloud Functions (Gen2)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helper Components ──────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const MetricCard = ({ theme, label, value, labelColor, valueColor, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-4`}>
    <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
    <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
  </div>
);

const CleanInfoRow = ({ theme, label, value, valueColor, boldValue }) => (
  <div className="flex justify-between">
    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{label}:</span>
    <span className={`${boldValue ? 'font-bold' : 'font-medium'} ${valueColor ?? (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>{value}</span>
  </div>
);

export default Forecast;