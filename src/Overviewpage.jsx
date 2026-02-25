/* eslint-disable no-unused-vars */
import React from 'react';
import {
  Wind, Droplets, Gauge, Eye, Sun, CloudRain, Leaf, Zap,
  AlertTriangle, Factory, TrendingUp, Activity, DollarSign,
  Bell, X, Clock, Trash2
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, ComposedChart,
  CartesianGrid, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// ─── Mini Inline Gauge ────────────────────────────────────────────────────────
const SemiGauge = ({ value = 7, max = 30, theme }) => {
  const isPositive = value >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const absVal = Math.abs(value);

  const toXY = (pct) => {
    const rad = Math.PI * (1 - pct);
    return { x: 28 + 20 * Math.cos(rad), y: 24 - 20 * Math.sin(rad) };
  };
  const fg    = toXY(Math.min(absVal / max, 1));
  const large = absVal / max > 0.5 ? 1 : 0;

  return (
    <div className="flex items-center gap-2 mt-2">
      <svg width="54" height="28" viewBox="0 0 54 28">
        <path d="M 8 24 A 20 20 0 0 1 48 24" fill="none"
          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} strokeWidth="5" strokeLinecap="round" />
        <path d={`M 8 24 A 20 20 0 ${large} 1 ${fg.x} ${fg.y}`} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
      <span className="text-xs font-bold" style={{ color }}>
        {isPositive ? '+' : ''}{value}% this month
      </span>
    </div>
  );
};

// ─── Static mock data ─────────────────────────────────────────────────────────
const generateEnvData = () =>
  Array.from({ length: 24 }, (_, h) => ({
    label: `${String(h).padStart(2, '00')}:00`,
    irradiation: h >= 6 && h <= 18
      ? Math.max(0, Math.round(1000 * Math.sin(((h - 6) / 12) * Math.PI) + (Math.random() - 0.5) * 80))
      : 0,
    temperature: Math.round(28 + 6 * Math.sin(((h - 6) / 12) * Math.PI) + (Math.random() - 0.5) * 2),
  }));

const cashFlowData = [
  { month: 'Jan', revenue: 1850, cost: 620, net: 1230 },
  { month: 'Feb', revenue: 1920, cost: 580, net: 1340 },
  { month: 'Mar', revenue: 2100, cost: 610, net: 1490 },
  { month: 'Apr', revenue: 2250, cost: 640, net: 1610 },
  { month: 'May', revenue: 2380, cost: 690, net: 1690 },
  { month: 'Jun', revenue: 2150, cost: 720, net: 1430 },
  { month: 'Jul', revenue: 1980, cost: 580, net: 1400 },
  { month: 'Aug', revenue: 2050, cost: 600, net: 1450 },
  { month: 'Sep', revenue: 2200, cost: 630, net: 1570 },
  { month: 'Oct', revenue: 2350, cost: 660, net: 1690 },
  { month: 'Nov', revenue: 2100, cost: 590, net: 1510 },
  { month: 'Dec', revenue: 2450, cost: 720, net: 1730 },
];
const raData  = [
  { label: 'Mon', ra: 5.2 }, { label: 'Tue', ra: 4.8 }, { label: 'Wed', ra: 5.5 },
  { label: 'Thu', ra: 6.1 }, { label: 'Fri', ra: 5.8 }, { label: 'Sat', ra: 4.3 }, { label: 'Sun', ra: 3.9 },
];
const mhsData = [
  { label: 'Mon', mhs: 1 }, { label: 'Tue', mhs: 0 }, { label: 'Wed', mhs: 2 },
  { label: 'Thu', mhs: 1 }, { label: 'Fri', mhs: 3 }, { label: 'Sat', mhs: 0 }, { label: 'Sun', mhs: 1 },
];
const envData = generateEnvData();

// ─── Severity icon ─────────────────────────────────────────────────────────────
const SevIcon = ({ s }) => {
  if (s === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (s === 'high')     return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  if (s === 'medium')   return <Clock className="w-4 h-4 text-yellow-500" />;
  return <Bell className="w-4 h-4 text-blue-500" />;
};

// ─── Period toggle ─────────────────────────────────────────────────────────────
const PeriodToggle = ({ value, onChange, options, active = 'bg-blue-600', isDark }) => (
  <div className={`flex rounded-lg overflow-hidden border text-[10px] font-semibold ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
    {options.map((p) => (
      <button key={p} onClick={() => onChange(p)}
        className={`px-2.5 py-1 capitalize transition-all
          ${value === p ? `${active} text-white` : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}>
        {p.slice(0, 3)}
      </button>
    ))}
  </div>
);

// ─── Main ────────────────────────────────────────────────────────────────────
const Overview = ({
  theme, currentLang, weatherData,
  productionDataSets, productionPeriod, setProductionPeriod,
  demandDataSets,     demandPeriod,     setDemandPeriod,
  alerts, unreadCount, markAsRead, markAllAsRead, deleteAlert,
  showAllAlerts, setShowAllAlerts,
  alertSearch, setAlertSearch, alertFilter, setAlertFilter, filteredAlerts,
}) => {
  const dk  = theme === 'dark';
  const card = `rounded-2xl shadow-sm ${dk ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`;
  const tx   = dk ? 'text-white'      : 'text-slate-800';
  const sub  = dk ? 'text-slate-400'  : 'text-slate-500';
  const grid = dk ? '#334155'         : '#f1f5f9';
  const tip  = { background: dk ? '#1e293b' : '#fff', border: `1px solid ${dk ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 11 };
  const periods = ['daily', 'weekly', 'monthly', 'yearly'];

  const envMetrics = [
    { label: 'Wind',     value: `${weatherData.windSpeed} km/h`, icon: Wind,     col: 'text-blue-400' },
    { label: 'Humidity', value: `${weatherData.humidity}%`,      icon: Droplets, col: 'text-cyan-400' },
    { label: 'Pressure', value: `${weatherData.pressure} hPa`,   icon: Gauge,    col: 'text-purple-400' },
    { label: 'Light',    value: '92 klx',                        icon: Sun,      col: 'text-yellow-400' },
    { label: 'PM2.5',    value: '12 µg/m³',                      icon: Eye,      col: 'text-orange-400' },
    { label: 'AQI',      value: '48 · Good',                     icon: Leaf,     col: 'text-green-400' },
  ];

  const machineStats = [
    { label: 'Active Machines',       value: '5 / 6',  icon: Factory,   col: 'text-blue-500',    bg: dk ? 'bg-blue-900/30'    : 'bg-blue-50' },
    { label: 'อัตราการผลิต',           value: '87.3%',  icon: Activity,  col: 'text-green-500',   bg: dk ? 'bg-green-900/30'   : 'bg-green-50' },
    { label: 'Standard Coal Saved',   value: '4.82 t', icon: Zap,       col: 'text-yellow-500',  bg: dk ? 'bg-yellow-900/30'  : 'bg-yellow-50' },
    { label: 'CO₂ Avoided',           value: '11.6 t', icon: CloudRain, col: 'text-teal-500',    bg: dk ? 'bg-teal-900/30'    : 'bg-teal-50' },
    { label: 'Equivalent Trees',      value: '632',    icon: Leaf,      col: 'text-emerald-500', bg: dk ? 'bg-emerald-900/30' : 'bg-emerald-50' },
    { label: 'Inverter Rated Power',  value: '250 kW', icon: Zap,       col: 'text-violet-500',  bg: dk ? 'bg-violet-900/30'  : 'bg-violet-50' },
  ];

  const kpis = [
    { title: 'Yield (Today)',          value: '1,842 kWh', badge: '+3.2%',       up: true,  icon: Zap,           col: 'text-yellow-500', bg: dk ? 'bg-yellow-900/30' : 'bg-yellow-50', bdr: dk ? 'border-yellow-700/30' : 'border-yellow-200' },
    { title: 'Total Revenue',          value: '฿ 12,450',  badge: '+5.8%',       up: true,  icon: DollarSign,    col: 'text-green-500',  bg: dk ? 'bg-green-900/30'  : 'bg-green-50',  bdr: dk ? 'border-green-700/30'  : 'border-green-200' },
    { title: 'PR (Performance Ratio)', value: '20.2%',     badge: '+2.3%',       up: true,  icon: TrendingUp,    col: 'text-blue-500',   bg: dk ? 'bg-blue-900/30'   : 'bg-blue-50',   bdr: dk ? 'border-blue-700/30'   : 'border-blue-200',  gauge: true, gv: 2.3 },
    { title: 'Critical Alerts',        value: '3',          badge: '2 new today', up: false, icon: AlertTriangle, col: 'text-red-500',    bg: dk ? 'bg-red-900/30'    : 'bg-red-50',    bdr: dk ? 'border-red-700/30'    : 'border-red-200' },
  ];

  return (
    <div className="w-full space-y-5">

      {/* ── ROW 1: Weather + Irradiation/Temp Chart ── */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-col lg:flex-row">
          {/* Left — weather summary */}
          <div className={`lg:w-72 flex-shrink-0 p-5 border-b lg:border-b-0 lg:border-r
            ${dk ? 'border-slate-700 bg-gradient-to-br from-slate-700/50 to-slate-800'
                 : 'border-slate-200 bg-gradient-to-br from-sky-50 to-blue-50'}`}>
            <div className={`flex items-center gap-2 mb-4 text-xs font-semibold ${sub}`}>
              <Sun className="w-4 h-4 text-yellow-400" /> Live Environmental
            </div>
            <div className="flex items-end gap-3 mb-5">
              <span className={`text-6xl font-bold tracking-tighter ${tx}`}>{weatherData.temp}°</span>
              <div className="pb-1">
                <p className={`text-sm font-semibold ${tx}`}>{weatherData.condition}</p>
                <p className={`text-xs ${sub}`}>Khlong Luang, TH</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {envMetrics.map((m) => (
                <div key={m.label} className={`flex items-center gap-2 p-2 rounded-xl ${dk ? 'bg-slate-700/60' : 'bg-white/80'}`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.col} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className={`text-[9px] uppercase tracking-wide font-medium ${sub}`}>{m.label}</p>
                    <p className={`text-[11px] font-bold ${tx} truncate`}>{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dual-line chart */}
          <div className="flex-1 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className={`text-sm font-bold ${tx}`}>Irradiation & Temperature — 24 h</h3>
                <p className={`text-xs ${sub}`}>Real-time sensor data from site</p>
              </div>
              <div className={`flex items-center gap-4 text-xs ${sub}`}>
                <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-green-400 inline-block" />Irradiation (W/m²)</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-red-400  inline-block" />Temperature (°C)</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={envData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: dk ? '#94a3b8' : '#64748b' }} interval={3} />
                <YAxis yAxisId="irr" tick={{ fontSize: 9, fill: dk ? '#94a3b8' : '#64748b' }} domain={[0, 1100]} />
                <YAxis yAxisId="tmp" orientation="right" tick={{ fontSize: 9, fill: dk ? '#94a3b8' : '#64748b' }} domain={[20, 44]} />
                <Tooltip contentStyle={tip} />
                <Area yAxisId="irr" type="monotone" dataKey="irradiation" name="Irradiation" stroke="#4ade80" fill="#4ade8020" strokeWidth={2} dot={false} />
                <Line  yAxisId="tmp" type="monotone" dataKey="temperature"  name="Temperature"  stroke="#f87171" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── ROW 2: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={`${card} p-5 border ${k.bdr}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${k.bg}`}>
                <k.icon className={`w-5 h-5 ${k.col}`} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                ${k.up ? (dk ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')
                       : (dk ? 'bg-red-900/40   text-red-400'   : 'bg-red-100   text-red-700')}`}>
                {k.badge}
              </span>
            </div>
            <p className={`text-2xl font-bold ${tx} leading-none mb-1`}>{k.value}</p>
            <p className={`text-xs font-medium ${sub}`}>{k.title}</p>
            {k.gauge && <SemiGauge value={k.gv} max={30} theme={theme} />}
          </div>
        ))}
      </div>


      {/* ── ROW 4: Project Cash Flow + RA / Mhs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow */}
        <div className={`${card} p-5 lg:col-span-2`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className={`text-sm font-bold ${tx}`}>Project Cash Flow</h3>
              <p className={`text-xs ${sub}`}>Monthly revenue, cost & net profit (฿ thousands)</p>
            </div>
            <div className={`flex items-center gap-4 text-xs ${sub}`}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400  inline-block" />Cost</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-400 inline-block" />Net</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={cashFlowData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.85} />
              <Bar dataKey="cost"    name="Cost"    fill="#f87171" radius={[4,4,0,0]} opacity={0.85} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#4ade80" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RA + Mhs */}
        <div className="flex flex-col gap-4">
          <div className={`${card} p-4 flex-1`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-bold ${tx}`}>RA – Daily Radiation</h3>
                <p className={`text-[10px] ${sub}`}>kWh/m² per day</p>
              </div>
              <span className="text-xl font-bold text-yellow-500">5.4</span>
            </div>
            <ResponsiveContainer width="100%" height={88}>
              <AreaChart data={raData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: dk ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 8]} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="ra" name="Radiation" stroke="#facc15" fill="#facc1525" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={`${card} p-4 flex-1`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-bold ${tx}`}>Mhs – Maint. Hours</h3>
                <p className={`text-[10px] ${sub}`}>Downtime hours per day</p>
              </div>
              <span className="text-xl font-bold text-orange-500">8 h</span>
            </div>
            <ResponsiveContainer width="100%" height={88}>
              <BarChart data={mhsData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: dk ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 5]} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="mhs" name="Hours" fill="#f97316" radius={[4,4,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── ROW 5: Production Efficiency + Revenue Forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Production Efficiency */}
        <div className={`${card} p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className={`text-sm font-bold ${tx}`}>{currentLang.weeklyProduction || 'Production Efficiency'}</h3>
              <p className={`text-xs ${sub}`}>OEE over time</p>
            </div>
            <PeriodToggle value={productionPeriod} onChange={setProductionPeriod} options={periods} active="bg-blue-600" isDark={dk} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={productionDataSets[productionPeriod]} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={tip} formatter={(v) => [`${v}%`, 'OEE']} />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5}
                label={{ value: 'Target 80%', fontSize: 9, fill: '#f59e0b', position: 'insideTopRight' }} />
              <Area type="monotone" dataKey="oee" name="OEE" stroke="#3b82f6" fill="url(#oeeGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Forecast */}
        <div className={`${card} p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className={`text-sm font-bold ${tx}`}>{currentLang.demandTrend || 'Revenue Forecast'}</h3>
              <p className={`text-xs ${sub}`}>Actual vs. predicted with confidence band</p>
            </div>
            <PeriodToggle value={demandPeriod} onChange={setDemandPeriod} options={periods} active="bg-purple-600" isDark={dk} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={demandDataSets[demandPeriod]} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} />
              <Tooltip contentStyle={tip} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#confGrad)" />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill={dk ? '#0f172a' : '#ffffff'} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#a78bfa" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="actual"   name="Actual"   stroke="#22d3ee" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className={`flex items-center gap-4 mt-2 text-xs ${sub}`}>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-cyan-400  rounded inline-block" />Actual</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-400 rounded inline-block" />Forecast</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-3 bg-violet-400/20 rounded inline-block" />Confidence band</span>
          </div>
        </div>
      </div>

      {/* ── ROW 3: All Machines Stats ── */}
      <div className={`${card} p-4`}>
        <div className={`flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest ${sub}`}>
          <Factory className="w-4 h-4" /> All Machines — System Overview
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {machineStats.map((s) => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.col} flex-shrink-0`} />
              <div className="min-w-0">
                <p className={`text-[9px] font-medium uppercase leading-tight ${sub} truncate`}>{s.label}</p>
                <p className={`text-sm font-bold ${tx} mt-0.5`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Alerts ── */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${sub}`} />
            <h3 className={`text-sm font-bold ${tx}`}>{currentLang.recentAlerts || 'Recent Alerts'}</h3>
            {unreadCount > 0 && <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">{unreadCount}</span>}
          </div>
          <button onClick={() => setShowAllAlerts(true)} className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition">
            {currentLang.viewAll || 'View All'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {alerts.slice(0, 6).map((a) => (
            <div key={a.id} onClick={() => markAsRead(a.id)}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border
                ${!a.read
                  ? (dk ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-100')
                  : (dk ? 'hover:bg-slate-700/50 border-transparent' : 'hover:bg-slate-50 border-transparent')}`}>
              <div className="mt-0.5 flex-shrink-0"><SevIcon s={a.severity} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className={`text-xs font-bold truncate ${tx}`}>{a.machine}</p>
                  {!a.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                <p className={`text-[10px] ${sub} leading-snug`}>{a.message}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Alerts Modal ── */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ${dk ? 'bg-slate-800' : 'bg-white'}`} style={{ maxHeight: '85vh' }}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${dk ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-base ${tx}`}>{currentLang.allAlerts || 'All Alerts'}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${dk ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{alerts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-600 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition">
                  {currentLang.markAllRead || 'Mark all read'}
                </button>
                <button onClick={() => setShowAllAlerts(false)} className={`p-1.5 rounded-full transition ${dk ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Search + filter */}
            <div className={`px-4 py-3 flex flex-wrap gap-2 border-b flex-shrink-0 ${dk ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50'}`}>
              <div className={`flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-lg border ${dk ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
                <svg className={`w-3.5 h-3.5 ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input value={alertSearch} onChange={(e) => setAlertSearch(e.target.value)} placeholder={currentLang.searchAlerts || 'Search alerts...'} className={`flex-1 text-xs bg-transparent outline-none ${tx}`} />
              </div>
              {['all', 'unread', 'critical', 'high', 'medium'].map((f) => (
                <button key={f} onClick={() => setAlertFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold capitalize transition
                    ${alertFilter === f ? 'bg-blue-600 text-white shadow-sm' : dk ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                  {f}
                </button>
              ))}
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Bell className={`w-10 h-10 ${sub} opacity-30 mb-3`} />
                  <p className={`text-sm ${sub}`}>{currentLang.noAlertsFound || 'No alerts found'}</p>
                </div>
              ) : filteredAlerts.map((a) => (
                <div key={a.id} onClick={() => markAsRead(a.id)}
                  className={`flex items-start gap-4 px-6 py-4 border-b last:border-0 cursor-pointer transition
                    ${!a.read ? (dk ? 'bg-blue-900/10' : 'bg-blue-50/60') : (dk ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50')}
                    ${dk ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className="mt-0.5 flex-shrink-0"><SevIcon s={a.severity} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-bold ${tx}`}>{a.machine}</p>
                      <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase
                        ${a.severity === 'critical' ? 'bg-red-100 text-red-700'       :
                          a.severity === 'high'     ? 'bg-orange-100 text-orange-700' :
                          a.severity === 'medium'   ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {a.severity}
                      </span>
                      {!a.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                    </div>
                    <p className={`text-xs ${sub}`}>{a.message}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{a.time}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteAlert(a.id); }}
                      className={`p-1.5 rounded-lg opacity-50 hover:opacity-100 transition ${dk ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Overview;