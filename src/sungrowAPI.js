// ============================================================
// Sungrow iSolarCloud Open API Service — Direct Login Flow
// ============================================================
// Flow:
//   1. login(user, pass)  → POST /openapi/login → token
//   2. Use token in all API request bodies
//   3. Token stored in sessionStorage for reuse
// ============================================================

const CONFIG = {
  APP_KEY:    'EDA3396BA90A265E773C72AB969E3846',
  ACCESS_KEY: 'dw7an4xui4jccjw79macpwk55y1awa9c',
  BASE_URL:   import.meta.env.VITE_SUNGROW_BASE_URL ?? '/sungrow',
  SYS_CODE:   '901',
  LANG:       '_en_US',
};

// ─── Token Storage ────────────────────────────────────────────
const TOKEN_KEY = 'sg_token';

export const getStoredToken   = ()    => sessionStorage.getItem(TOKEN_KEY);
export const clearStoredToken = ()    => sessionStorage.removeItem(TOKEN_KEY);
const storeToken              = (tok) => sessionStorage.setItem(TOKEN_KEY, tok);

// ─── Base HTTP helper ─────────────────────────────────────────
const apiPost = async (path, body) => {
  const res = await fetch(`${CONFIG.BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'x-access-key':  CONFIG.ACCESS_KEY,
      'sys_code':      CONFIG.SYS_CODE,
    },
    body: JSON.stringify({
      appkey: CONFIG.APP_KEY,
      lang:   CONFIG.LANG,
      ...body,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const json = await res.json();
  if (String(json.result_code) !== '1') {
    throw new Error(json.result_msg || `API error (code: ${json.result_code})`);
  }
  return json.result_data ?? json;
};

// ─── Auth ─────────────────────────────────────────────────────

/**
 * Login with iSolarCloud credentials.
 * Stores token in sessionStorage automatically.
 */
export const login = async (user_account, user_password) => {
  const data = await apiPost('/openapi/login', { user_account, user_password });
  const tok  = data.token ?? data.access_token;
  if (!tok) throw new Error('Login succeeded but no token returned');
  storeToken(tok);
  return data;
};

/**
 * For direct login flow, authorize is a no-op — login token IS the API token.
 */
export const authorizeApp = async (loginToken) => loginToken;

/**
 * Convenience: login + return token string.
 */
export const loginAndAuthorize = async (user_account, user_password) => {
  const data = await login(user_account, user_password);
  return data.token ?? data.access_token;
};

// ─── Plant & Device ───────────────────────────────────────────

export const getPlantList = async (token) =>
  apiPost('/openapi/getPowerStationList', { token, curPage: 1, size: 20 });

export const getDeviceList = async (token, psId) =>
  apiPost('/openapi/getDeviceList', { token, ps_id: String(psId), curPage: 1, size: 50 });

// ─── Real-Time Data ───────────────────────────────────────────

export const getDeviceRealTimeData = async (token, psKeyList, pointIdList, deviceType) =>
  apiPost('/openapi/getDeviceRealTimeData', {
    token,
    device_type:   deviceType,
    ps_key_list:   psKeyList,
    point_id_list: pointIdList.map(String),
  });

/**
 * Parse device_point_list → named keys.
 * W → kW for power, Wh → kWh for energy.
 */
export const parseDevicePoints = (apiResult, pointMap) => {
  const list = apiResult?.device_point_list ?? [];
  if (!list.length) return null;

  const powerKeys  = new Set(['activePower','feedInPower','loadPower','batteryCharge','batteryDischarge']);
  const energyKeys = new Set(['totalPvYield','totalPurchased','totalFeedIn']);
  const totals = {};

  for (const item of list) {
    const dp = item?.device_point ?? {};
    for (const [pointId, key] of Object.entries(pointMap)) {
      const raw = dp[`p${pointId}`];
      if (raw == null || raw === '' || raw === 'null') continue;
      const val = parseFloat(raw);
      if (!isNaN(val)) totals[key] = (totals[key] ?? 0) + val;
    }
  }

  if (!Object.keys(totals).length) return null;

  const result = {};
  for (const [key, val] of Object.entries(totals)) {
    if (powerKeys.has(key))       result[key] = +(val / 1000).toFixed(2);
    else if (energyKeys.has(key)) result[key] = Math.round(val / 1000);
    else                          result[key] = +val.toFixed(2);
  }
  result.timestamp = new Date();
  return result;
};

// ─── Constants ────────────────────────────────────────────────

export const DEVICE_TYPE = {
  INVERTER:              1,   // ← แก้จาก 11 เป็น 1
  ENERGY_STORAGE_SYSTEM: 14,
  METER:                 17,
};

export const LIVE_DATA_POINTS = {
  // ── Inverter (type 1) points ──────────────────────
  ACTIVE_POWER:         24,   // Total Active Power  W
  GRID_FREQUENCY:       27,   // Grid Frequency      Hz
  PHASE_A_VOLTAGE:      18,   // Phase A Voltage     V
  PHASE_A_CURRENT:      21,   // Phase A Current     A
  TOTAL_POWER_FACTOR:   26,   // Total Power Factor
  TOTAL_PV_YIELD:        2,   // Total Yield         Wh
  DAILY_PV_YIELD:        1,   // Yield Today         Wh

  // ── ESS (type 14) points — ใช้ถ้า device เป็น ESS ─
  FEED_IN_POWER:             13121,
  LOAD_POWER:                13119,
  TOTAL_FEED_IN_ENERGY:      13125,
  TOTAL_PURCHASED_ENERGY:    13148,
  BATTERY_LEVEL:             13141,
  BATTERY_CHARGING_POWER:    13126,
  BATTERY_DISCHARGING_POWER: 13150,
};