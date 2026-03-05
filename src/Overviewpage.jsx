/* eslint-disable no-unused-vars */
import {
  Wind, Droplets, Gauge, Eye, Sun, CloudRain, Leaf, Zap,
  AlertTriangle, Factory, TrendingUp, Activity, DollarSign,
  Bell, X, Clock, Trash2,Banknote, 
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, ComposedChart,
  CartesianGrid, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// ─── Semi-circular Gauge with colored zones + needle ─────────────────────────
const SemiGauge = ({ value = 50, min = 0, max = 100, invert = false, theme }) => {
  const dk = theme === 'dark';
  let pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (invert) pct = 1 - pct;

  // SVG layout
  const W = 108, H = 62;
  const cx = W / 2, cy = H - 10, r = 44;

  // Convert 0→1 to x/y on the arc (arc spans from left to right through top)
  const pt = (p) => {
    const rad = Math.PI * (1 - p);
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };

  // Build SVG arc path from pct p0 to p1 (sweep=1 → goes through top)
  const arcPath = (p0, p1) => {
    const [x0, y0] = pt(p0);
    const [x1, y1] = pt(p1);
    const large = (p1 - p0) > 0.5 ? 1 : 0;
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };

  // Needle tip
  const [nx, ny] = pt(pct);

  // Zone colors: LOW (red) → MEDIUM (amber) → HIGH (green)
  const zones = [
    { p0: 0,     p1: 0.333, color: '#ef4444' },
    { p0: 0.333, p1: 0.666, color: '#f59e0b' },
    { p0: 0.666, p1: 1,     color: '#22c55e' },
  ];

  // Tick marks (minor ticks every 10%)
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      {/* ── Background track ── */}
      <path d={arcPath(0, 1)}
        fill="none"
        stroke={dk ? '#1e293b' : '#e2e8f0'}
        strokeWidth="11"
        strokeLinecap="butt"
      />

      {/* ── Colored zone arcs ── */}
      {zones.map((z) => (
        <path
          key={z.color}
          d={arcPath(z.p0, z.p1)}
          fill="none"
          stroke={z.color}
          strokeWidth="11"
          strokeLinecap="butt"
          opacity="0.9"
        />
      ))}

      {/* ── Tick marks ── */}
      {ticks.map((p) => {
        const [tx0, ty0] = pt(p);
        const inner = 0.85;
        const [tx1, ty1] = [
          cx + (r * inner) * Math.cos(Math.PI * (1 - p)),
          cy - (r * inner) * Math.sin(Math.PI * (1 - p)),
        ];
        return (
          <line
            key={p}
            x1={tx0.toFixed(1)} y1={ty0.toFixed(1)}
            x2={tx1.toFixed(1)} y2={ty1.toFixed(1)}
            stroke={dk ? '#0f172a' : '#ffffff'}
            strokeWidth={p % 0.5 === 0 ? 2 : 1}
            opacity="0.7"
          />
        );
      })}

      {/* ── Needle shadow ── */}
      <line
        x1={cx} y1={cy}
        x2={(nx + 1).toFixed(1)} y2={(ny + 1).toFixed(1)}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ── Needle ── */}
      <line
        x1={cx} y1={cy}
        x2={nx.toFixed(1)} y2={ny.toFixed(1)}
        stroke={dk ? '#f1f5f9' : '#1e293b'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ── Pivot circle ── */}
      <circle cx={cx} cy={cy} r="5.5" fill={dk ? '#334155' : '#94a3b8'} />
      <circle cx={cx} cy={cy} r="3"   fill={dk ? '#f1f5f9' : '#ffffff'} />

      {/* ── Zone labels ── */}
      <text x="5"        y={H - 1} fontSize="6" fill="#ef4444" fontWeight="700" fontFamily="sans-serif">LOW</text>
      <text x={cx - 8}  y="10"    fontSize="6" fill="#f59e0b" fontWeight="700" fontFamily="sans-serif">MED</text>
      <text x={W - 24}  y={H - 1} fontSize="6" fill="#22c55e" fontWeight="700" fontFamily="sans-serif">HIGH</text>
    </svg>
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

const revenueForcastDataSets = {
  daily: Array.from({ length: 24 }, (_, h) => {
    const base = h >= 6 && h <= 18 ? Math.round(500 * Math.sin(((h - 6) / 12) * Math.PI)) : 0;
    return {
      label: `${String(h).padStart(2, '0')}:00`,
      actual:   h <= 14 ? Math.round(base + (Math.random() - 0.5) * 40) : 0,
      forecast: Math.round(base * 1.05),
      upper:    Math.round(base * 1.2),
      lower:    Math.round(base * 0.85),
    };
  }),
  weekly: [
    { label: 'Mon', actual: 4250,  forecast: 4300,  upper: 4800,  lower: 3800 },
    { label: 'Tue', actual: 4600,  forecast: 4500,  upper: 5000,  lower: 4000 },
    { label: 'Wed', actual: 4100,  forecast: 4200,  upper: 4700,  lower: 3700 },
    { label: 'Thu', actual: 4850,  forecast: 4800,  upper: 5300,  lower: 4300 },
    { label: 'Fri', actual: 5100,  forecast: 5000,  upper: 5600,  lower: 4500 },
    { label: 'Sat', actual: 3800,  forecast: 3900,  upper: 4400,  lower: 3400 },
    { label: 'Sun', actual: 0,     forecast: 3600,  upper: 4100,  lower: 3100 },
  ],
  monthly: [
    { label: 'Jan', actual: 125000, forecast: 122000, upper: 138000, lower: 108000 },
    { label: 'Feb', actual: 132000, forecast: 130000, upper: 147000, lower: 115000 },
    { label: 'Mar', actual: 148000, forecast: 145000, upper: 163000, lower: 129000 },
    { label: 'Apr', actual: 162000, forecast: 158000, upper: 178000, lower: 140000 },
    { label: 'May', actual: 171000, forecast: 175000, upper: 197000, lower: 155000 },
    { label: 'Jun', actual: 155000, forecast: 160000, upper: 180000, lower: 142000 },
    { label: 'Jul', actual: 0,      forecast: 168000, upper: 190000, lower: 148000 },
    { label: 'Aug', actual: 0,      forecast: 180000, upper: 203000, lower: 159000 },
    { label: 'Sep', actual: 0,      forecast: 172000, upper: 194000, lower: 152000 },
    { label: 'Oct', actual: 0,      forecast: 185000, upper: 209000, lower: 163000 },
    { label: 'Nov', actual: 0,      forecast: 178000, upper: 201000, lower: 157000 },
    { label: 'Dec', actual: 0,      forecast: 192000, upper: 217000, lower: 169000 },
  ],
  yearly: [
    { label: '2021', actual: 1420000, forecast: 1380000, upper: 1560000, lower: 1220000 },
    { label: '2022', actual: 1680000, forecast: 1650000, upper: 1860000, lower: 1460000 },
    { label: '2023', actual: 1920000, forecast: 1950000, upper: 2200000, lower: 1720000 },
    { label: '2024', actual: 2150000, forecast: 2100000, upper: 2370000, lower: 1860000 },
    { label: '2025', actual: 0,       forecast: 2450000, upper: 2770000, lower: 2170000 },
  ],
};

const fmtRevenue = (v) => {
  if (!v) return '฿0';
  if (v >= 1000000) return `฿${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `฿${(v / 1000).toFixed(0)}k`;
  return `฿${v}`;
};

const raData  = [
  { label: 'Mon', ra: 5.2 }, { label: 'Tue', ra: 4.8 }, { label: 'Wed', ra: 5.5 },
  { label: 'Thu', ra: 6.1 }, { label: 'Fri', ra: 5.8 }, { label: 'Sat', ra: 4.3 }, { label: 'Sun', ra: 3.9 },
];
const yieldData = [
  { label: 'Mon', yield: 312 },
  { label: 'Tue', yield: 289 },
  { label: 'Wed', yield: 330 },
  { label: 'Thu', yield: 367 },
  { label: 'Fri', yield: 348 },
  { label: 'Sat', yield: 258 },
  { label: 'Sun', yield: 234 },
];
const yieldMax = Math.max(...yieldData.map(d => d.yield));
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

  // ── KPI cards — now include gauge config ──────────────────────────────────
  const kpis = [
    {
      title: 'Yield (Today)',
      value: '1,842 kWh', target: '2,000 kWh',
      badge: '+3.2%', up: true,
      icon: Zap, col: 'text-yellow-500',
      bg: dk ? 'bg-yellow-900/30' : 'bg-yellow-50',
      bdr: dk ? 'border-yellow-700/30' : 'border-yellow-200',
      gv: 1842, gmin: 0, gmax: 2000, invert: false,
    },
    {
      title: 'Total Revenue',
      value: '฿ 12,450k', target: '฿ 58,000k',
      badge: '+5.8%', up: true,
      icon: Banknote, col: 'text-green-500',
      bg: dk ? 'bg-green-900/30' : 'bg-green-50',
      bdr: dk ? 'border-green-700/30' : 'border-green-200',
      gv: 12450, gmin: 0, gmax: 58000, invert: false,
    },
    {
      title: 'PR (Performance Ratio)',
      value: '66%', target: '100%',
      badge: '+2.3%', up: true,
      icon: TrendingUp, col: 'text-blue-500',
      bg: dk ? 'bg-blue-900/30' : 'bg-blue-50',
      bdr: dk ? 'border-blue-700/30' : 'border-blue-200',
      gv: 66, gmin: 0, gmax: 100, invert: false,
    },
    {
      title: 'Critical Alerts',
      value: '3', target: null,
      badge: '2 new today', up: false,
      icon: AlertTriangle, col: 'text-red-500',
      bg: dk ? 'bg-red-900/30' : 'bg-red-50',
      bdr: dk ? 'border-red-700/30' : 'border-red-200',
      gv: null,
    },
  ];

  return (
    <div className="w-full space-y-2">

      {/* ── ROW 1: KPI Cards with Gauges ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {kpis.map((k, i) => (
          <div key={i} className={`${card} p-4 border ${k.bdr} overflow-hidden`}>

            {/* Top row: icon + badge */}
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-xl ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.col}`} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full leading-none
                ${k.up
                  ? (dk ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')
                  : (dk ? 'bg-red-900/40   text-red-400'   : 'bg-red-100   text-red-700')}`}>
                {k.badge}
              </span>
            </div>

            {/* Value row + gauge side by side */}
            <div className="flex items-end justify-between gap-1">
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${tx} leading-none`}>{k.value}</p>
                {k.target && <p className={`text-[12px] font-semibold mt-0.5 ${k.col}`}>/ {k.target}</p>}
                <p className={`text-xs font-medium mt-1 ${sub}`}>{k.title}</p>
              </div>

              {/* Gauge — only when gv is defined */}
              {k.gv != null && (
                <div className="flex-shrink-0 -mb-1">
                  <SemiGauge
                    value={k.gv}
                    min={k.gmin}
                    max={k.gmax}
                    invert={k.invert}
                    theme={theme}
                  />
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* ── ROW 4: Project Cash Flow + RA / Mhs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Cash Flow */}
        <div className={`${card} p-4 lg:col-span-2`}>
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
          <ResponsiveContainer width="100%" height={323}>
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

        {/* RA + Weekly Energy Yield*/}
        <div className="flex flex-col gap-2">
          <div className={`${card} p-4 flex-1`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-bold ${tx}`}>RA – Weekly Irradiation</h3>
                <p className={`text-[10px] ${sub}`}>kWh/m² per day</p>
              </div>
              <span className="text-xl font-bold text-yellow-500">5.4 kWh/m²</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
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
                <h3 className={`text-sm font-bold ${tx}`}>Weekly Energy Yield</h3>
                <p className={`text-[10px] ${sub}`}>kWh produced per day</p>
              </div>
              <span className="text-xl font-bold text-emerald-400">1,842 kWh</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={yieldData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={grid} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: dk ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 420]} />
                <Tooltip contentStyle={tip} formatter={(v) => [`${v} kWh`, 'Yield']} />
                <Bar dataKey="yield" name="Yield" radius={[4,4,0,0]} fill="#22c55e"
                  shape={(props) => {
                    const { x, y, width, height, value } = props;
                    return <rect x={x} y={y} width={width} height={height} rx={4} ry={4}
                      fill={value === yieldMax ? '#22c55e' : (dk ? '#3b82f680' : '#93c5fd')} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className={`flex items-center gap-2 mt-1.5 text-[9px] ${sub}`}>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block"/>Highest day</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 5: Production Efficiency + Revenue Forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Production Efficiency */}
        <div className={`${card} p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className={`text-sm font-bold ${tx}`}>{currentLang.weeklyProduction || 'Production Efficiency'}</h3>
              <p className={`text-xs ${sub}`}>OEE over time</p>
            </div>
            <PeriodToggle value={productionPeriod} onChange={setProductionPeriod} options={periods} active="bg-blue-600" isDark={dk} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
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
              <h3 className={`text-sm font-bold ${tx}`}>Revenue Forecast</h3>
              <p className={`text-xs ${sub}`}>Actual vs. predicted revenue with confidence band</p>
            </div>
            <PeriodToggle value={demandPeriod} onChange={setDemandPeriod} options={periods} active="bg-purple-600" isDark={dk} />
          </div>
                
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Actual (YTD)',   value: fmtRevenue(revenueForcastDataSets.monthly.filter(d => d.actual > 0).reduce((s, d) => s + d.actual, 0)), color: 'text-cyan-400' },
              { label: 'Forecast (Full Year)', value: fmtRevenue(revenueForcastDataSets.monthly.reduce((s, d) => s + d.forecast, 0)), color: 'text-violet-400' },
              { label: 'Accuracy',       value: '94.2%', color: 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className={`p-3 rounded-xl ${dk ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <p className={`text-[10px] font-medium ${sub} mb-0.5`}>{s.label}</p>
                <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={revenueForcastDataSets[demandPeriod]} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: dk ? '#94a3b8' : '#64748b' }} tickFormatter={fmtRevenue} width={52} />
              <Tooltip contentStyle={tip} formatter={(value, name) => [fmtRevenue(value), name]} />
              <Area type="monotone" dataKey="upper"    stroke="transparent"            fill="url(#confGrad)" name="Upper bound" />
              <Area type="monotone" dataKey="lower"    stroke="transparent"            fill={dk ? '#0f172a' : '#ffffff'} name="Lower bound" />
              <Line type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={2}   dot={false} strokeDasharray="5 3" name="Forecast" />
              <Line type="monotone" dataKey="actual"   stroke="#22d3ee" strokeWidth={2.5} dot={false} name="Actual"   connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className={`flex items-center gap-4 mt-2 text-xs ${sub}`}>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-cyan-400   rounded inline-block" />Actual</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-400 rounded inline-block" />Forecast</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-3 bg-violet-400/20 rounded inline-block" />Confidence band</span>
          </div>
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