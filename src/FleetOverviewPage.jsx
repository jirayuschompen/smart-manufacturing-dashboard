// FleetOverviewPage.jsx — Leaflet map via srcdoc iframe (markers locked to map)
import React, { useState, useEffect, useRef } from 'react';
import { Zap, TrendingUp, Sun, BarChart2, ChevronRight, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// Capacity in kWp | Power in kW | Yield in kWh | Revenue = yield × ฿3/kWh
// ── Semi-circular Gauge ──────────────────────────────────────
const SemiGauge = ({ value = 50, min = 0, max = 100, theme }) => {
  const dk = theme === 'dark';
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const W = 90, H = 52;
  const cx = W / 2, cy = H - 8, r = 36;
  const pt = (p) => {
    const rad = Math.PI * (1 - p);
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const arcPath = (p0, p1) => {
    const [x0, y0] = pt(p0);
    const [x1, y1] = pt(p1);
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${(p1-p0)>0.5?1:0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const [nx, ny] = pt(pct);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      <path d={arcPath(0,1)} fill="none" stroke={dk?'#1e293b':'#e2e8f0'} strokeWidth="9" strokeLinecap="butt"/>
      {[
        {p0:0,    p1:0.333,color:'#ef4444'},
        {p0:0.333,p1:0.666,color:'#f59e0b'},
        {p0:0.666,p1:1,    color:'#22c55e'},
      ].map(z => (
        <path key={z.color} d={arcPath(z.p0,z.p1)} fill="none" stroke={z.color} strokeWidth="9" strokeLinecap="butt" opacity="0.9"/>
      ))}
      <line x1={cx} y1={cy} x2={(nx+0.8).toFixed(1)} y2={(ny+0.8).toFixed(1)} stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1={cx} y1={cy} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke={dk?'#f1f5f9':'#1e293b'} strokeWidth="2" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="4.5" fill={dk?'#334155':'#94a3b8'}/>
      <circle cx={cx} cy={cy} r="2.5" fill={dk?'#f1f5f9':'#ffffff'}/>
      <text x="3"      y={H-1} fontSize="5" fill="#ef4444" fontWeight="700" fontFamily="sans-serif">LOW</text>
      <text x={cx-6}  y="8"   fontSize="5" fill="#f59e0b" fontWeight="700" fontFamily="sans-serif">MED</text>
      <text x={W-19}  y={H-1} fontSize="5" fill="#22c55e" fontWeight="700" fontFamily="sans-serif">HIGH</text>
    </svg>
  );
};

const RATE_PER_KWH = 5.66;

// ── Seeded random (deterministic per plant+day, no re-roll on re-render) ──────
const seededRand = (seed) => {
  let x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x); // 0..1
};

// Daily max yields (kWp × peak sun hours × efficiency)
const DAILY_MAX = { PV1: 5000, PV2: 5000, PV3: 1470, PV4: 5000 };

// Sine-based hourly weights — guarantee hourly sum = dailyYield exactly
const SIN_HOURS = Array.from({ length: 13 }, (_, i) => // h=6..18
  Math.sin((i / 12) * Math.PI)
);
const SIN_SUM = SIN_HOURS.reduce((s, v) => s + v, 0); // ≈ 7.596

// Get daily yield for a plant on a given date (84–100% of max, seeded by date+plant)
const getDailyYield = (plantId, date) => {
  const seed =
    date.getFullYear() * 10000 +
    (date.getMonth() + 1) * 100 +
    date.getDate() +
    plantId.charCodeAt(0) * 999; // ทำให้แต่ละ PV ต่างกันชัด

  const rand = seededRand(seed);

  const pct = 0.84 + rand * 0.16; // 84–100%
  return Math.round(DAILY_MAX[plantId] * pct);
};

// Get kWh produced by hour h (0–23) for a given daily total
const getHourlyKwh = (dailyYield, h) => {
  if (h < 6 || h > 18) return 0;
  return Math.round(dailyYield * (SIN_HOURS[h - 6] / SIN_SUM));
};

// Get accumulated kWh up to (not including) current fractional hour
const getYieldToNow = (dailyYield, curFrac) => {
  let acc = 0;
  for (let h = 6; h < 19; h++) {
    if (h > curFrac) break;
    const frac = Math.min(1, curFrac - h); // partial current hour
    acc += Math.round(dailyYield * (SIN_HOURS[h - 6] / SIN_SUM) * frac);
  }
  return acc;
};

const PLANTS = [
  { id: 'PV1', name: 'ETEM-PV1', lat: 12.312631, lng: 102.598152,
    capacity: 120, power: 97.51, pr: 78.4, irradiation: 5.8, status: 'online' },
  { id: 'PV2', name: 'ETE-PV2', lat: 13.821041, lng: 102.298019,
    capacity: 100, power: 45.20, pr: 81.2, irradiation: 5.6, status: 'online' },
  { id: 'PV3', name: 'ETE-PV3', lat: 13.648165, lng: 102.461136,
    capacity: 45,  power: 62.80, pr: 72.1, irradiation: 5.4, status: 'warning' },
  { id: 'PV4', name: 'ETE-PV4', lat: 11.090021, lng: 99.442207,
    capacity: 100, power: 28.40, pr: 82.8, irradiation: 6.1, status: 'online' },
];

const fmt = (v, d = 1) => Number(v).toFixed(d);
const statusColor = (s) =>
  s === 'online' ? '#22c55e' : s === 'warning' ? '#f59e0b' : '#ef4444';

const totalCapacity = PLANTS.reduce((s, p) => s + p.capacity, 0);

// powerData computed inside component (time-reactive)

const Panel = ({ children, className = '', theme }) => (
  <div className={`rounded-xl border ${
    theme === 'dark'
      ? 'bg-slate-800/80 border-slate-700'
      : 'bg-white border-slate-200 shadow-sm'
  } ${className}`}>
    {children}
  </div>
);

// ── Build the full Leaflet HTML for srcdoc ─────────────────────
const buildMapHTML = (isDark) => {
  const plantsJson = JSON.stringify(PLANTS.map(p => ({
    id: p.id, name: p.name, lat: p.lat, lng: p.lng,
    status: p.status, power: p.power, pr: p.pr, yieldToday: p.yieldToday,
  })));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; }
  .plant-marker {
    display:flex; align-items:center; justify-content:center;
    border-radius:50%; border:2.5px solid; cursor:pointer;
    box-shadow:0 0 10px rgba(0,0,0,0.4);
    transition: transform 0.15s;
  }
  .plant-marker:hover { transform: scale(1.2); }
  .plant-label {
    background: transparent;
    color:${isDark?'#ffffff':'#1e293b'};
    font-size:11px; font-weight:800;
    white-space:nowrap; pointer-events:none;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,1);
    letter-spacing:0.3px;
  }
  .leaflet-control-attribution { font-size:8px !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
const plants = ${plantsJson};
const isDark = ${isDark};

const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: true,
});

// Auto-fit to show all plants with padding
const bounds = L.latLngBounds(plants.map(p => [p.lat, p.lng]));
map.fitBounds(bounds, { padding: [60, 60] });

L.tileLayer(
  isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: isDark
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }
).addTo(map);

const statusColor = (s) =>
  s === 'online' ? '#22c55e' : s === 'warning' ? '#f59e0b' : '#ef4444';

const markerMap = {};

plants.forEach(p => {
  const col = statusColor(p.status);

  const svgIcon = L.divIcon({
    className: '',
    html: \`
      <div style="position:relative;width:36px;height:36px;">
        \${p.status==='online'?
          \`<div style="position:absolute;top:0;left:0;width:36px;height:36px;border-radius:50%;
            background:\${col};opacity:0.2;animation:ping 1.5s infinite;"></div>\`:''}
        <div class="plant-marker" style="
          width:36px;height:36px;
          background:radial-gradient(circle at 35% 35%, \${col}ee, \${col}66);
          border-color:\${col};">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle cx="12" cy="12" r="4" fill="white"/>
            \${[0,45,90,135,180,225,270,315].map(deg=>{
              const r=Math.PI*deg/180;
              return \`<line x1="\${12+6*Math.cos(r)}" y1="\${12+6*Math.sin(r)}"
                x2="\${12+9*Math.cos(r)}" y2="\${12+9*Math.sin(r)}"
                stroke="white" stroke-width="1.5"/>\`;
            }).join('')}
          </svg>
        </div>
      </div>
    \`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });

  const labelIcon = L.divIcon({
    className: '',
    html: \`<div class="plant-label">\${p.name}</div>\`,
    iconAnchor: [-26, 8],
  });

  const marker = L.marker([p.lat, p.lng], { icon: svgIcon }).addTo(map);
  markerMap[p.id] = marker;
  L.marker([p.lat, p.lng], { icon: labelIcon, interactive: false }).addTo(map);

  marker.on('click', () => {
    window.parent.postMessage({ type:'plant-click', id: p.id }, '*');
  });
});

// ping animation + selected scale
const style = document.createElement('style');
style.textContent = \`
  @keyframes ping {
    0%   { transform:scale(1);   opacity:0.25; }
    70%  { transform:scale(1.8); opacity:0;    }
    100% { transform:scale(1.8); opacity:0;    }
  }
  .plant-marker.selected {
    box-shadow: 0 0 0 4px rgba(255,255,255,0.9), 0 0 0 7px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.5) !important;
    border-width: 3px !important;
  }
\`;
document.head.appendChild(style);

// Listen for messages from React
window.addEventListener('message', (e) => {
  if (!e.data) return;

  if (e.data.type === 'zoom-plant') {
    map.flyTo([e.data.lat, e.data.lng], 10, { duration: 1.5 });
  }

  if (e.data.type === 'zoom-reset') {
    const bounds = L.latLngBounds(plants.map(p => [p.lat, p.lng]));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
  }

  if (e.data.type === 'highlight') {
    // Update all marker DOM elements
    Object.entries(markerMap).forEach(([id, m]) => {
      if (!m) return;
      const el = m.getElement()?.querySelector('.plant-marker');
      if (!el) return;
      if (id === e.data.id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }
});
</script>
</body>
</html>`;
};

// ════════════════════════════════════════════════════════════
const FleetOverviewPage = ({ theme, onEnterDashboard }) => {
  const dk  = theme === 'dark';
  const tx  = dk ? 'text-white'     : 'text-slate-800';
  const sub = dk ? 'text-slate-400' : 'text-slate-500';
  const tip = {
    background: dk ? '#1e293b' : '#fff',
    border: `1px solid ${dk ? '#334155' : '#e2e8f0'}`,
    borderRadius: 8, fontSize: 10,
  };

  // ── Reactive clock — updates every minute ──────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const curHour    = now.getHours();
  const curMin     = now.getMinutes();
  const curFrac    = curHour + curMin / 60;           // fractional hour e.g. 14.5
  const DAY_TODAY  = now.getDate();                   // day of month 1-based
  const DAYS_TOTAL = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

  const getCurrentPower = (dailyYield, curFrac) => {
  const h = Math.floor(curFrac);
  const m = curFrac - h;

  if (h < 6 || h > 18) return 0;

  return Math.round(getHourlyKwh(dailyYield, h) * (m || 1));
  };

  // ── Per-plant daily yield for today (seeded, stable) ────────────────────────
  const plantData = PLANTS.map(p => {
    const dayYield   = getDailyYield(p.id, now);           // full-day yield kWh
    const toNow      = getYieldToNow(dayYield, curFrac);   // kWh up to now
    const powerNow = getCurrentPower(dayYield, curFrac);
    const revenue    = Math.round(toNow * RATE_PER_KWH);
    // Monthly chart: past days = seeded actual, today = toNow, future = forecast
    const monthly = Array.from({ length: DAYS_TOTAL }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      if (i + 1 < DAY_TODAY) return getDailyYield(p.id, d);     // past days
      if (i + 1 === DAY_TODAY) return toNow;                      // today so far
      return null;                                                  // future
    });
    const monthForecast = Array.from({ length: DAYS_TOTAL }, (_, i) =>
      i + 1 > DAY_TODAY ? getDailyYield(p.id, new Date(now.getFullYear(), now.getMonth(), i+1)) : null
    );
    // Hourly power data for today (null = future)
    const powerHourly = Array.from({ length: 24 }, (_, h) => ({
      h,
      kw: h <= curHour && h >= 6 && h <= 18
        ? (h === curHour
            ? Math.round(getHourlyKwh(dayYield, h) * (curMin / 60))
            : getHourlyKwh(dayYield, h))
        : null,
    }));
    return { ...p, power: powerNow, dayYield, toNow, revenue, monthly, monthForecast, powerHourly };
  });

  // ✅ FIX: Calculate totalPower from plantData (real-time), not PLANTS (static)
  const totalPower   = plantData.reduce((s, p) => s + p.power, 0);
  const totalYield   = plantData.reduce((s, p) => s + p.toNow,   0);
  const totalRevenue = plantData.reduce((s, p) => s + p.revenue,  0);

  const [selected, setSelected] = useState(null);
  const [showPRFormula, setShowPRFormula] = useState(false);
  const activePlant = plantData.find(p => p.id === selected) ?? null;
  const mapRef = useRef(null);

  // helper: select + zoom (uses functional update to avoid stale closure)
  const selectPlant = (id) => {
    setSelected(prev => {
      const newId = prev === id ? null : id;
      // setTimeout ensures iframe is not in mid-render
      setTimeout(() => {
        const win = mapRef.current?.contentWindow;
        if (!win) return;
        if (newId) {
          const plant = PLANTS.find(p => p.id === newId);
          if (plant) win.postMessage({ type: 'zoom-plant', lat: plant.lat, lng: plant.lng, id: newId }, '*');
        } else {
          win.postMessage({ type: 'zoom-reset' }, '*');
        }
        win.postMessage({ type: 'highlight', id: newId }, '*');
      }, 50);
      return newId;
    });
  };

  // Listen for postMessage from the Leaflet iframe (marker click)
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'plant-click') {
        selectPlant(e.data.id);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapHTML = buildMapHTML(dk);

  const yieldBarData = Array.from({ length: DAYS_TOTAL }, (_, i) => {
    const src = activePlant ? [activePlant] : plantData;
    return {
      m: String(i + 1),
      yield:    src[0].monthly[i] != null ? src.reduce((s,p) => s + (p.monthly[i] ?? 0), 0) : null,
      forecast: src[0].monthForecast[i] != null ? src.reduce((s,p) => s + (p.monthForecast[i] ?? 0), 0) : null,
    };
  });

  

  return (
    <>
    <div className={`flex flex-col h-full ${dk ? 'bg-slate-900' : 'bg-slate-50'}`}>

      {/* ── KPI strip ─────────────────────────────────────── */}

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT ───────────────────────────────────────────── */}
        <div className={`w-80 flex-shrink-0 flex flex-col gap-2 p-3 overflow-y-auto border-r ${
          dk ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <Panel theme={theme} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <p className={`text-sm font-bold ${tx}`}>Real-Time Power</p>
              <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {fmt(activePlant ? activePlant.power: totalPower)} kW
            </p>
            <p className={`text-[9px] ${sub} -mt-1 mb-1`}>
              Yield to now: {(activePlant ? activePlant.toNow : totalYield).toLocaleString()} kWh
            </p>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={activePlant ? activePlant.powerHourly : plantData.reduce((acc, p) => acc.map((d,i) => ({ h: d.h, kw: (d.kw??0) + (p.powerHourly[i].kw ?? 0) })), plantData[0].powerHourly.map(d=>({...d})))} margin={{ top:2, right:2, left:-28, bottom:0 }}>
                <defs>
                  <linearGradient id="pwG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{ fontSize:8, fill:dk?'#64748b':'#94a3b8' }} interval={5} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip contentStyle={tip} formatter={(v) => [`${v} kW`]} />
                <Area type="monotone" dataKey="kw" stroke="#3b82f6" fill="url(#pwG)" strokeWidth={1.5} dot={false} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── KPI cards: Yield / Revenue / PR — reactive to selected plant ─── */}
          {(() => {
            const p = activePlant;
            const yieldVal   = p ? p.toNow       : totalYield;
            const revVal     = p ? p.revenue   : totalRevenue;
            const revMax     = p ? p.capacity * 4 * 3 : totalCapacity * 4 * 3;
            const prVal      = p ? p.pr                : PLANTS.reduce((s,x)=>s+x.pr,0)/PLANTS.length;
            const capLabel   = p ? `${p.capacity} kWp` : `${totalCapacity} kWp`;
            return [
              {
                label: 'Yield Today',   col: 'text-yellow-400',
                bdr: dk ? 'border-yellow-700/30' : 'border-yellow-200',
                value: `${yieldVal.toLocaleString()} kWh`,
                sub2: p ? capLabel : `${PLANTS.length} sites combined`,
                // gv: yieldVal, gmin: 0, gmax: p ? p.dailyAvg  : PLANTS.reduce((s,x)=>s+x.dailyAvg,0)
              },
              {
                label: 'Revenue Today', col: 'text-green-400',
                bdr: dk ? 'border-green-700/30' : 'border-green-200',
                value: `฿${revVal.toLocaleString()}`,
                sub2: `฿${RATE_PER_KWH} / kWh`,
                gv: revVal, gmin: 0, gmax: revMax,
              },
              {
                label: 'Performance Ratio', col: 'text-blue-400',
                bdr: dk ? 'border-blue-700/30' : 'border-blue-200',
                value: `${prVal.toFixed(1)}%`,
                target: '/ 100%',
                sub2: p ? p.name : 'Fleet avg',
                gv: prVal, gmin: 0, gmax: 100,
                isPR: true,
              },
            ].map((k) => (
              <div key={k.label}
                onClick={k.isPR ? () => setShowPRFormula(true) : undefined}
                className={`rounded-xl border p-3 overflow-hidden transition-all duration-300 ${
                  dk ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                } border-l-2 ${k.bdr} ${k.isPR ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/40' : ''}`}>
                <div className="flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    <p className={`text-lg font-bold ${k.col} leading-tight`}>{k.value}</p>
                    <p className={`text-[10px] font-semibold ${k.col} opacity-70`}>{k.target}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className={`text-xs font-medium ${sub}`}>{k.label}</p>
                      {k.isPR && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          dk ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>ƒ(x)</span>
                      )}
                    </div>
                    <p className={`text-[9px] mt-0.5 ${sub} opacity-60`}>{k.sub2}</p>
                  </div>
                  <SemiGauge value={k.gv} min={k.gmin} max={k.gmax} theme={theme} />
                </div>
              </div>
            ));
          })()}

          <Panel theme={theme} className="p-3">
            <p className={`text-sm font-bold mb-2 ${tx}`}>Environmental Benefits</p>
            <div className="flex justify-around mb-2">
              {[{icon:'🚂',label:'Coal saved'},{icon:'🏭',label:'CO₂ avoided'},{icon:'🌲',label:'Trees equiv.'}]
                .map((e,i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-xl">{e.icon}</span>
                    <p className={`text-[9px] text-center ${sub}`}>{e.label}</p>
                  </div>
                ))}
            </div>
            <div className={`rounded-lg overflow-hidden border text-[9px] ${dk?'border-slate-700':'border-slate-100'}`}>
              <div className={`grid grid-cols-4 font-bold px-2 py-1 ${dk?'bg-slate-700 text-slate-300':'bg-slate-100 text-slate-600'}`}>
                <span/><span className="text-right">Coal</span>
                <span className="text-right">CO₂</span><span className="text-right">Trees</span>
              </div>
              {[
                {label:'Annual',coal:'11.75K',co2:'13.95K',trees:'19.45K'},
                {label:'Total', coal:'122.3K',co2:'145.2K',trees:'198.9K'},
              ].map(r => (
                <div key={r.label} className={`grid grid-cols-4 px-2 py-1 border-t ${dk?'border-slate-700 text-slate-400':'border-slate-100 text-slate-600'}`}>
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-right text-green-400">{r.coal}</span>
                  <span className="text-right text-blue-400">{r.co2}</span>
                  <span className="text-right text-emerald-400">{r.trees}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel theme={theme} className="p-3">
            <p className={`text-sm font-bold mb-2 ${tx}`}>O&M Statistics</p>
            <div className="flex items-center gap-3">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke={dk?'#334155':'#e2e8f0'} strokeWidth="9"/>
                <text x="24" y="28" textAnchor="middle" fontSize="8"
                  fill={dk?'#94a3b8':'#64748b'} fontWeight="bold">O&M</text>
              </svg>
              <div className="space-y-1 text-[9px]">
                {[
                  {col:'bg-green-400', label:'To be approved',  val:0},
                  {col:'bg-orange-400',label:'To be dispatched',val:0},
                  {col:'bg-blue-400',  label:'Discarded',       val:0},
                  {col:'bg-purple-400',label:'Ongoing',         val:0},
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.col}`}/>
                    <span className={sub}>{r.label}</span>
                    <span className={`ml-auto font-bold ${tx}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* CENTER: Leaflet iframe ─────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <iframe
            ref={mapRef}
            key={dk ? 'dark' : 'light'}
            title="Fleet Map"
            srcDoc={mapHTML}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />

          {/* Plant detail popup */}
          {activePlant && (
            <div className={`absolute top-3 right-3 w-56 rounded-2xl shadow-2xl border p-4 z-10 ${
              dk ? 'bg-slate-800/96 border-slate-600' : 'bg-white/96 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-bold ${tx}`}>{activePlant.name}</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: statusColor(activePlant.status)+'25', color: statusColor(activePlant.status) }}>
                  {activePlant.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] mb-3">
                {[
                  { label:'Power',       value:`${fmt(activePlant.power)} kW`,          col:'text-blue-400'   },
                  { label:'Capacity',    value:`${fmt(activePlant.capacity)} kWp`,      col:'text-orange-400' },
                  { label:'Yield',       value:`${activePlant.toNow.toLocaleString()} kWh`,col:'text-yellow-400' },
                  { label:'Revenue',     value:`฿${activePlant.revenue.toLocaleString()}`, col:'text-green-400' },
                  { label:'PR',          value:`${fmt(activePlant.pr)}%`,               col:'text-cyan-400'   },
                  { label:'Irradiation', value:`${fmt(activePlant.irradiation)} kWh/m²`,col: sub              },
                ].map((r) => (
                  <div key={r.label}>
                    <p className={sub}>{r.label}</p>
                    <p className={`font-bold ${r.col}`}>{r.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(null)}
                  className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border transition ${
                    dk ? 'border-slate-600 text-slate-400 hover:bg-slate-700'
                       : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>Close</button>
                {onEnterDashboard && (
                  <button onClick={onEnterDashboard}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition">
                    Detail <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!activePlant && (
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full text-[10px] font-medium border pointer-events-none ${
              dk ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                 : 'bg-white/80 border-slate-200 text-slate-500'
            }`}>
              Click a marker to view plant details
            </div>
          )}
        </div>

        {/* RIGHT ──────────────────────────────────────────── */}
        <div className={`w-80 flex-shrink-0 flex flex-col gap-2 p-3 overflow-y-auto border-l ${
          dk ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <Panel theme={theme} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <p className={`text-sm font-bold ${tx}`}>Yield This Month</p>
              <span className="text-base font-bold text-green-400">
                {(activePlant
                  ? activePlant.monthly.reduce((s,v)=>s+(v??0),0)
                  : plantData.reduce((s,p) => s + p.monthly.reduce((a,v)=>a+(v??0),0), 0)
                ).toLocaleString()} kWh
              </span>
            </div>
            <p className={`text-[10px] ${sub} mb-2`}>{activePlant?.name ?? 'All plants'}</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={yieldBarData} margin={{ top:4, right:4, left:-28, bottom:4 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={dk?'#334155':'#f1f5f9'} />
                <XAxis dataKey="m" tick={{ fontSize:8, fill:dk?'#64748b':'#94a3b8' }} />
                <YAxis tick={{ fontSize:8 }} />
                <Tooltip contentStyle={tip} formatter={(v,n) => v ? [`${Number(v).toLocaleString()} kWh`, n] : ['-']} />
                <Bar dataKey="yield"    name="Actual"   fill="#22c55e" radius={[3,3,0,0]} opacity={0.9} barSize={16} />
                <Bar dataKey="forecast" name="Forecast" fill={dk?'#334155':'#e2e8f0'} radius={[3,3,0,0]} opacity={0.7} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel theme={theme} className="p-3">
            <p className={`text-sm font-bold mb-1 ${tx}`}>Energy Yield Ranking</p>
            <p className={`text-xs ${sub} mb-2`}>Yield today (kWh)</p>
            {[...plantData]
              .sort((a,b) => b.toNow - a.toNow)
              .map((p, i) => {
                const max = Math.max(...plantData.map(x => x.toNow));
                return (
                  <div key={p.id} className="mb-2 cursor-pointer"
                    onClick={() => selectPlant(p.id)}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className={`font-semibold ${selected===p.id?'text-blue-400':sub}`}>{p.name}</span>
                      <span className={`font-bold ${tx}`}>
                        {p.toNow.toLocaleString()} kWh
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${dk?'bg-slate-700':'bg-slate-100'}`}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${(p.toNow/max)*100}%`, background:i===0?'#22c55e':'#3b82f6' }} />
                    </div>
                  </div>
                );
              })}
          </Panel>

          <Panel theme={theme} className="p-3">
            <p className={`text-sm font-bold mb-2 ${tx}`}>Plant Status</p>
            <div className="space-y-1.5">
              {plantData.map((p) => (
                <div key={p.id}
                  onClick={() => selectPlant(p.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition border ${
                    selected === p.id
                      ? dk ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
                      : dk ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-slate-50 border-slate-100'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: statusColor(p.status) }} />
                    <div>
                      <p className={`text-sm font-semibold ${tx}`}>{p.name}</p>
                      <p className={`text-xs ${sub}`}>{fmt(p.power)} kW · {p.toNow.toLocaleString()} kWh today</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${sub}`} />
                </div>
              ))}
            </div>
          </Panel>

          {/* ── Active Alarms — reactive to plant statuses ── */}
          {(() => {
            const src = activePlant ? [activePlant] : plantData;
            const alarmCounts = {
              Critical: src.filter(p => p.status === 'offline').length,
              Major:    0,
              Minor:    0,
              Warning:  src.filter(p => p.status === 'warning').length,
            };
            const total = Object.values(alarmCounts).reduce((s,v) => s+v, 0);
            const alarmColors = { Critical:'#ef4444', Major:'#f59e0b', Minor:'#3b82f6', Warning:'#f59e0b' };
            // arc for donut
            const R = 26, STROKE = 12, CIRC = 2 * Math.PI * R;
            const warningPct = total > 0 ? alarmCounts.Warning / total : 0;
            const critPct    = total > 0 ? alarmCounts.Critical / total : 0;
            return (
              <Panel theme={theme} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-bold ${tx}`}>Active Alarms</p>
                  <span className={`text-[10px] font-semibold ${total > 0 ? 'text-yellow-400' : sub}`}>
                    Total: {total}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={R} fill="none" stroke={dk?'#334155':'#e2e8f0'} strokeWidth={STROKE}/>
                    {/* Warning arc */}
                    {alarmCounts.Warning > 0 && (
                      <circle cx="36" cy="36" r={R} fill="none" stroke="#f59e0b" strokeWidth={STROKE}
                        strokeDasharray={`${warningPct * CIRC} ${CIRC}`}
                        strokeDashoffset={CIRC * 0.25}
                        strokeLinecap="round" transform="rotate(-90 36 36)"/>
                    )}
                    {/* Critical arc */}
                    {alarmCounts.Critical > 0 && (
                      <circle cx="36" cy="36" r={R} fill="none" stroke="#ef4444" strokeWidth={STROKE}
                        strokeDasharray={`${critPct * CIRC} ${CIRC}`}
                        strokeDashoffset={CIRC * (0.25 - warningPct)}
                        strokeLinecap="round" transform="rotate(-90 36 36)"/>
                    )}
                    <text x="36" y="41" textAnchor="middle" fontSize="18" fontWeight="bold"
                      fill={total > 0 ? '#f59e0b' : (dk?'#f1f5f9':'#1e293b')}>{total}</text>
                  </svg>
                  <div className="space-y-1 text-xs flex-1">
                    {Object.entries(alarmCounts).map(([label, val]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: alarmColors[label] }} />
                        <span className={sub}>{label}:</span>
                        <span className={`ml-auto font-bold ${val > 0 ? 'text-yellow-400' : tx}`}>{val}</span>
                      </div>
                    ))}
                    {activePlant && alarmCounts.Warning > 0 && (
                      <p className="text-[9px] text-yellow-400 mt-1 pt-1 border-t border-yellow-700/30">
                        ⚠ {activePlant.name} requires attention
                      </p>
                    )}
                    {!activePlant && alarmCounts.Warning > 0 && (
                      <p className="text-[9px] text-yellow-400 mt-1 pt-1 border-t border-yellow-700/30">
                        ⚠ {plantData.filter(p=>p.status==='warning').map(p=>p.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })()}
        </div>
      </div>
    </div>

      {/* ── PR Formula Modal ──────────────────────────────── */}
      {showPRFormula && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPRFormula(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 ${
              dk ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={`text-base font-bold ${tx}`}>Performance Ratio Formula</h3>
                <p className={`text-xs mt-0.5 ${sub}`}>PR actual calculation method</p>
              </div>
              <button
                onClick={() => setShowPRFormula(false)}
                className={`p-1.5 rounded-lg transition ${dk ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Formula box */}
            <div className={`rounded-xl p-5 mb-5 border ${dk ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              {/* PR = fraction */}
              <div className="flex flex-col items-center gap-1 mb-4">
                <p className={`text-sm font-bold italic ${dk ? 'text-blue-300' : 'text-blue-700'}`}>
                  PR<sub>actual</sub>
                  <span className={`mx-2 not-italic font-bold text-lg ${tx}`}>=</span>
                </p>
                {/* Big fraction */}
                <div className="flex flex-col items-center gap-0.5 mt-1">
                  {/* Numerator */}
                  <p className={`text-sm font-semibold italic text-center ${dk ? 'text-slate-200' : 'text-slate-700'}`}>
                    E<sub>produced system energy</sub>
                  </p>
                  {/* Divider */}
                  <div className={`w-full h-px my-1 ${dk ? 'bg-slate-500' : 'bg-slate-400'}`} />
                  {/* Denominator */}
                  <p className={`text-xs font-semibold italic text-center leading-relaxed ${dk ? 'text-slate-300' : 'text-slate-600'}`}>
                    GTI &nbsp;×&nbsp; A<sub>total module area</sub> &nbsp;×&nbsp; η<sub>STC module</sub> &nbsp;×&nbsp; α<sub>temperature correction</sub>
                  </p>
                </div>
              </div>

              {/* GTI note */}
              <div className={`flex items-start gap-2 pt-3 border-t ${dk ? 'border-slate-700' : 'border-slate-200'}`}>
                <span className={`text-[10px] font-bold mt-0.5 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>GTI =</span>
                <p className={`text-[10px] leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                  Global Horizontal Irradiance &nbsp;<span className="font-bold text-red-400">×</span>&nbsp; Inclined Adjustment Factor
                  <span className={`ml-1 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>(From PV sys report)</span>
                </p>
              </div>
            </div>

            {/* Variable table */}
            <div className={`rounded-xl overflow-hidden border text-xs ${dk ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className={`grid grid-cols-2 px-3 py-2 font-bold text-[10px] uppercase tracking-wide ${
                dk ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                <span>Symbol</span><span>Description</span>
              </div>
              {[
                { sym: 'E',   desc: 'Energy produced by the system (kWh)' },
                { sym: 'GTI', desc: 'Global Tilted Irradiance (kWh/m²)' },
                { sym: 'A',   desc: 'Total PV module area (m²)' },
                { sym: 'η',   desc: 'Module efficiency at STC (%)' },
                { sym: 'α',   desc: 'Temperature correction factor' },
              ].map((r, i) => (
                <div key={r.sym} className={`grid grid-cols-2 px-3 py-2 border-t ${
                  dk ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-700'
                } ${i % 2 === 0 ? (dk ? 'bg-slate-800/40' : 'bg-white') : (dk ? 'bg-slate-800/80' : 'bg-slate-50/60')}`}>
                  <span className="font-bold italic text-blue-400">{r.sym}</span>
                  <span className={sub}>{r.desc}</span>
                </div>
              ))}
            </div>

            {/* Current value */}
            <div className={`mt-4 flex items-center justify-between px-4 py-3 rounded-xl ${
              dk ? 'bg-blue-900/20 border border-blue-800/40' : 'bg-blue-50 border border-blue-100'
            }`}>
              <p className={`text-xs font-semibold ${dk ? 'text-blue-300' : 'text-blue-700'}`}>
                Current PR {activePlant ? `— ${activePlant.name}` : '— Fleet Avg'}
              </p>
              <p className={`text-xl font-bold text-blue-400`}>
                {activePlant
                  ? `${activePlant.pr.toFixed(1)}%`
                  : `${(PLANTS.reduce((s,p)=>s+p.pr,0)/PLANTS.length).toFixed(1)}%`}
              </p>
            </div>

            <button
              onClick={() => setShowPRFormula(false)}
              className="mt-4 w-full py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FleetOverviewPage;