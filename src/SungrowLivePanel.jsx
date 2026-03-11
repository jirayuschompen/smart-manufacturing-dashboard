// SungrowLivePanel.jsx — Auto Login Flow (no OAuth popup)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Sun, Activity, RefreshCw, TrendingUp,
  Gauge, Wifi, WifiOff, ChevronDown, AlertCircle, LogIn,
} from 'lucide-react';
import {
  login, authorizeApp, getStoredToken, clearStoredToken,
  getPlantList, getDeviceList,
  getDeviceRealTimeData, parseDevicePoints,
  LIVE_DATA_POINTS, DEVICE_TYPE,
} from './sungrowAPI';

// ── Credentials (hardcoded — keep server-side in production) ──
const CREDENTIALS = {
  username: 'surachn@gmail.com',
  password: 'Porsch83#',
};

// ── Demo data shown while loading ─────────────────────────────
const DEMO_DATA = {
  activePower:      8.47,
  feedInPower:      3.13,
  loadPower:        5.34,
  totalPvYield:     18420,
  totalPurchased:   2310,
  totalFeedIn:      6840,
  batteryLevel:     73,
  batteryCharge:    1.20,
  batteryDischarge: 0,
  gridFrequency:    50.02,
  powerFactor:      0.98,
  phaseVoltage:     229.4,
  phaseCurrent:     3.68,
  timestamp:        new Date(),
};

const POINT_MAP = {
  [LIVE_DATA_POINTS.ACTIVE_POWER]:              'activePower',
  [LIVE_DATA_POINTS.FEED_IN_POWER]:             'feedInPower',
  [LIVE_DATA_POINTS.LOAD_POWER]:                'loadPower',
  [LIVE_DATA_POINTS.TOTAL_PV_YIELD]:            'totalPvYield',
  [LIVE_DATA_POINTS.TOTAL_PURCHASED_ENERGY]:    'totalPurchased',
  [LIVE_DATA_POINTS.TOTAL_FEED_IN_ENERGY]:      'totalFeedIn',
  [LIVE_DATA_POINTS.BATTERY_LEVEL]:             'batteryLevel',
  [LIVE_DATA_POINTS.BATTERY_CHARGING_POWER]:    'batteryCharge',
  [LIVE_DATA_POINTS.BATTERY_DISCHARGING_POWER]: 'batteryDischarge',
  [LIVE_DATA_POINTS.GRID_FREQUENCY]:            'gridFrequency',
  [LIVE_DATA_POINTS.TOTAL_POWER_FACTOR]:        'powerFactor',
  [LIVE_DATA_POINTS.PHASE_A_VOLTAGE]:           'phaseVoltage',
  [LIVE_DATA_POINTS.PHASE_A_CURRENT]:           'phaseCurrent',
};
const ALL_POINT_IDS = Object.keys(POINT_MAP).map(Number);

const AUTH_STEP = {
  IDLE:       'idle',
  LOGGING_IN: 'logging_in',
  FETCHING:   'fetching',
  DONE:       'done',
  ERROR:      'error',
};

// ─── Sub-components ───────────────────────────────────────────

const MetricCard = ({ icon, label, value, unit, sub, color, theme }) => {
  const palette = {
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400'   },
    teal:   { bg: 'bg-teal-500/10',   text: 'text-teal-400'   },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    green:  { bg: 'bg-green-500/10',  text: 'text-green-400'  },
  };
  const c = palette[color] || palette.blue;
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
      isDark ? 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
             : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
    }`}>
      <div className={`inline-flex p-2 rounded-lg ${c.bg} mb-3`}>
        {icon && React.createElement(icon, { className: `w-4 h-4 ${c.text}` })}
      </div>
      <p className={`text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {typeof value === 'number'
            ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : value}
        </span>
        {unit && <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{unit}</span>}
      </div>
      {sub && <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>}
    </div>
  );
};

const BatteryRing = ({ level, theme }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const color = level > 60 ? '#22c55e' : level > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none"
          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${(level / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <span className={`absolute text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        {level}%
      </span>
    </div>
  );
};

const Dot = ({ color }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} animate-pulse`} />
);

const PowerFlow = ({ activePower, feedIn, load, theme }) => {
  const isDark = theme === 'dark';
  const nodes = [
    { icon: Sun,      label: 'PV',   val: `${activePower.toFixed(2)} kW`,
      bg: 'bg-yellow-500/10', ic: 'text-yellow-400', dot: 'bg-yellow-400' },
    { icon: Zap,      label: 'Grid', val: `${feedIn >= 0 ? '+' : ''}${feedIn.toFixed(2)} kW`,
      bg: 'bg-blue-500/10', ic: feedIn >= 0 ? 'text-green-400' : 'text-red-400', dot: 'bg-blue-400' },
    { icon: Activity, label: 'Load', val: `${load.toFixed(2)} kW`,
      bg: 'bg-teal-500/10', ic: 'text-teal-400', dot: 'bg-teal-400' },
  ];
  return (
    <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <p className={`text-xs font-semibold mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Power Flow</p>
      <div className="flex items-center justify-between gap-2">
        {nodes.map((n, i) => (
          <React.Fragment key={n.label}>
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div className={`p-2 rounded-lg ${n.bg}`}>
                {React.createElement(n.icon, { className: `w-5 h-5 ${n.ic}` })}
              </div>
              <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{n.label}</span>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{n.val}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex-1 flex items-center gap-1">
                <Dot color={n.dot} />
                <div className={`flex-1 h-0.5 ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                <Dot color={nodes[i + 1].dot} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const AuthProgress = ({ step, theme }) => {
  const isDark = theme === 'dark';
  const steps = [
    { key: AUTH_STEP.LOGGING_IN, label: 'Logging in…'    },
    { key: AUTH_STEP.FETCHING,   label: 'Fetching data…' },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);
  if (currentIdx === -1) return null;

  return (
    <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center gap-3">
        {steps.map((s, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-2 ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done   ? 'bg-green-500 text-white' :
                  active ? 'bg-yellow-400 text-slate-900 animate-pulse' :
                           isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px ${done ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────

const SungrowLivePanel = ({ theme }) => {
  const isDark    = theme === 'dark';
  const pollerRef = useRef(null);

  const [token,      setToken]      = useState(getStoredToken);
  const [psKeyList,  setPsKeyList]  = useState([]);
  const [deviceType, setDeviceType] = useState(DEVICE_TYPE.ENERGY_STORAGE_SYSTEM);
  const [liveData,   setLiveData]   = useState(DEMO_DATA);
  const [isDemo,     setIsDemo]     = useState(true);
  const [authStep,   setAuthStep]   = useState(AUTH_STEP.IDLE);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connected,  setConnected]  = useState(false);
  const [expanded,   setExpanded]   = useState(true);
  const [error,      setError]      = useState(null);

  // ─── Fetch real-time data ───────────────────────────────────
  const fetchData = useCallback(async (tok, psKeys, devType) => {
    if (!tok || !psKeys.length) return;
    try {
      const result = await getDeviceRealTimeData(tok, psKeys, ALL_POINT_IDS, devType);
      const parsed = parseDevicePoints(result, POINT_MAP);

      if (parsed && Object.keys(parsed).length > 1) {
        setLiveData(prev => ({ ...prev, ...parsed }));
        setIsDemo(false);
        setConnected(true);
        setError(null);
      } else if (devType !== DEVICE_TYPE.INVERTER) {
        // Fallback: try inverter device type
        const r2 = await getDeviceRealTimeData(tok, psKeys, ALL_POINT_IDS, DEVICE_TYPE.INVERTER);
        const p2 = parseDevicePoints(r2, POINT_MAP);
        if (p2 && Object.keys(p2).length > 1) {
          setDeviceType(DEVICE_TYPE.INVERTER);
          setLiveData(prev => ({ ...prev, ...p2 }));
          setIsDemo(false);
          setConnected(true);
          setError(null);
        } else {
          setError('Device offline or no real-time data');
        }
      }
      setLastUpdate(new Date());
      setAuthStep(AUTH_STEP.DONE);
    } catch (err) {
      console.error('[Sungrow] fetchData error:', err.message);
      // Token expired? Force re-login next time
      if (/token|auth|expire|E000|session/i.test(err.message)) {
        clearStoredToken();
        setToken(null);
        setAuthStep(AUTH_STEP.IDLE);
      } else {
        setAuthStep(AUTH_STEP.ERROR);
      }
      setConnected(false);
      setError(err.message);
    }
  }, []);

  // ─── Discover plants → devices → fetch ─────────────────────
  const discoverAndFetch = useCallback(async (tok) => {
    setAuthStep(AUTH_STEP.FETCHING);
    setError(null);
    try {
      const plantData = await getPlantList(tok);
      const plantList = plantData.pageList ?? plantData.page_list ?? plantData.list ?? [];
      if (!plantList.length) throw new Error('No plants found for this account');

      const psId = plantList[0].ps_id ?? plantList[0].id ?? plantList[0].plant_code;

      const devData = await getDeviceList(tok, psId);
      const devList = devData.pageList ?? devData.list ?? devData.device_list ?? [];
      if (!devList.length) throw new Error('No devices found for plant: ' + psId);

      // Prefer ESS (type 14), fall back to all devices
      const essList = devList.filter(d => {
        const t = parseInt(d.ps_key?.split('_')[1]);
        return t === 14 || d.device_type === 14;
      });
      const targets  = essList.length ? essList : devList;
      const detType  = parseInt(targets[0]?.ps_key?.split('_')[1]) || DEVICE_TYPE.ENERGY_STORAGE_SYSTEM;
      const psKeys   = targets.slice(0, 10).map(d => d.ps_key).filter(Boolean);

      if (!psKeys.length) throw new Error('No ps_key values found in device list');

      console.log('[Sungrow] Plant:', psId, '| Devices:', psKeys, '| Type:', detType);
      setDeviceType(detType);
      setPsKeyList(psKeys);

      await fetchData(tok, psKeys, detType);
    } catch (err) {
      console.error('[Sungrow] discoverAndFetch error:', err.message);
      setError(err.message);
      setConnected(false);
      setAuthStep(AUTH_STEP.ERROR);
    }
  }, [fetchData]);

  // ─── Full login + connect ───────────────────────────────────
  const connect = useCallback(async () => {
    setError(null);
    setConnected(false);

    try {
      // Step 1: Login
      setAuthStep(AUTH_STEP.LOGGING_IN);
      const loginData = await login(CREDENTIALS.username, CREDENTIALS.password);
      const tok = loginData.token ?? loginData.access_token;
      if (!tok) throw new Error('No token returned from login');

      // authorizeApp is a pass-through for direct login flow
      const authorizedTok = await authorizeApp(tok);
      setToken(authorizedTok);

      // Step 2: Discover & fetch
      await discoverAndFetch(authorizedTok);

    } catch (err) {
      console.error('[Sungrow] connect error:', err.message);
      setError(err.message);
      setAuthStep(AUTH_STEP.ERROR);
      clearStoredToken();
      setToken(null);
    }
  }, [discoverAndFetch]);

  // ─── On mount: use stored token or do fresh login ───────────
  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      // Attempt with stored token first; if it fails, connect() will re-login
      discoverAndFetch(stored).catch(() => connect());
    } else {
      connect();
    }
    return () => clearInterval(pollerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Poll every 5 minutes ───────────────────────────────────
  useEffect(() => {
    if (!token || !psKeyList.length) return;
    clearInterval(pollerRef.current);
    pollerRef.current = setInterval(
      () => fetchData(token, psKeyList, deviceType),
      5 * 60_000
    );
    return () => clearInterval(pollerRef.current);
  }, [token, psKeyList, deviceType, fetchData]);

  const loading = [AUTH_STEP.LOGGING_IN, AUTH_STEP.FETCHING].includes(authStep);

  const {
    activePower, feedInPower, loadPower, totalPvYield,
    totalPurchased, totalFeedIn, batteryLevel, batteryCharge,
    batteryDischarge, gridFrequency, powerFactor, phaseVoltage,
  } = liveData;

  const selfConsumptionPct = ((1 - totalPurchased / (totalPvYield || 1)) * 100).toFixed(1);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
    }`}>

      {/* ── Header ──────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between px-5 py-4 cursor-pointer select-none border-b ${
          isDark ? 'border-slate-700 hover:bg-slate-800/40' : 'border-slate-200 hover:bg-slate-100/60'
        }`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Sun className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Sungrow Live Data
              {loading && (
                <span className="ml-2 text-[10px] font-normal text-slate-400 animate-pulse">
                  { authStep === AUTH_STEP.LOGGING_IN ? 'Logging in…' : 'Fetching data…' }
                </span>
              )}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              iSolarCloud · {connected ? 'Live' : isDemo ? 'Demo' : '—'} ·{' '}
              {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            {error && (
              <p className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1" title={error}>
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[220px]">{error}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
            connected ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
          }`}>
            {connected
              ? <><Wifi    className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> {loading ? 'Connecting…' : 'Demo'}</>}
          </span>

          <button
            onClick={e => { e.stopPropagation(); connect(); }}
            disabled={loading}
            className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
            }`}
            title={connected ? 'Refresh' : 'Reconnect'}
          >
            {connected
              ? <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              : <LogIn     className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />}
          </button>

          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      {expanded && (
        <div className="p-5 space-y-5">

          {loading && <AuthProgress step={authStep} theme={theme} />}

          <PowerFlow activePower={activePower} feedIn={feedInPower} load={loadPower} theme={theme} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Sun}      label="Active Power"   value={activePower}   unit="kW" sub="Current PV output"    color="yellow" theme={theme} />
            <MetricCard icon={Zap}      label="Feed-in Power"  value={feedInPower}   unit="kW" sub="Exported to grid"     color="blue"   theme={theme} />
            <MetricCard icon={Activity} label="Load Power"     value={loadPower}     unit="kW" sub="Site consumption"     color="teal"   theme={theme} />
            <MetricCard icon={Gauge}    label="Grid Frequency" value={gridFrequency} unit="Hz" sub={`PF: ${powerFactor}`} color="indigo" theme={theme} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`rounded-xl p-4 border flex items-center gap-4 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <BatteryRing level={batteryLevel} theme={theme} />
              <div className="min-w-0">
                <p className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Battery</p>
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {batteryCharge > 0
                    ? `↑ Charging ${batteryCharge} kW`
                    : batteryDischarge > 0
                    ? `↓ Discharging ${batteryDischarge} kW`
                    : 'Idle'}
                </p>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>State of charge</p>
              </div>
            </div>

            <MetricCard icon={TrendingUp} label="Total PV Yield" value={totalPvYield} unit="kWh" sub="Lifetime generation" color="yellow" theme={theme} />

            <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <p className={`text-[11px] font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Grid Balance (Lifetime)</p>
              <div className="space-y-2">
                {[
                  { label: 'Feed-in',         val: `${totalFeedIn.toLocaleString()} kWh`,    cls: 'text-green-400'  },
                  { label: 'Purchased',        val: `${totalPurchased.toLocaleString()} kWh`, cls: 'text-orange-400' },
                  { label: 'Self-consumption', val: `${selfConsumptionPct}%`,
                    cls: isDark ? 'text-slate-300' : 'text-slate-700' },
                ].map(({ label, val, cls }, i, arr) => (
                  <React.Fragment key={label}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                      <span className={`text-xs font-bold ${cls}`}>{val}</span>
                    </div>
                    {i < arr.length - 1 && <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-xl px-4 py-3 border flex flex-wrap items-center gap-x-6 gap-y-2 ${
            isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { label: 'Phase A',      val: `${phaseVoltage} V`                      },
              { label: 'Frequency',    val: `${gridFrequency} Hz`                    },
              { label: 'Power Factor', val: powerFactor                              },
              { label: 'Devices',      val: psKeyList.length || '—'                 },
              { label: 'Auth',         val: connected ? '✓ Direct Login' : isDemo ? 'Demo' : '—' },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{val}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default SungrowLivePanel;