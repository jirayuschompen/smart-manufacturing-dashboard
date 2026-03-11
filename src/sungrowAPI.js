// ============================================================
// Sungrow iSolarCloud Open API Service — Direct Login Flow
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

export const login = async (user_account, user_password) => {
  const data = await apiPost('/openapi/login', { user_account, user_password });
  const tok  = data.token ?? data.access_token;
  if (!tok) throw new Error('Login succeeded but no token returned');
  storeToken(tok);
  return data;
};

export const authorizeApp = async (loginToken) => loginToken;

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

/**
 * PV Inverter (device_type=1) — dedicated endpoint, no device_type param
 * Returns all inverter points automatically
 */
export const getPVInverterRealTimeData = async (token, psKeyList) =>
  apiPost('/openapi/getPVInverterRealTimeData', {
    token,
    ps_key_list: psKeyList,
  });

/**
 * ESS / Meter / other types — generic endpoint needs device_type + point_id_list
 */
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
  const energyKeys = new Set(['totalPvYield','dailyPvYield','totalPurchased','totalFeedIn']);
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
  INVERTER:              1,   // PV Inverter → ใช้ getPVInverterRealTimeData
  ENERGY_STORAGE_SYSTEM: 14,  // ESS        → ใช้ getDeviceRealTimeData
  METER:                 17,  // Meter      → ใช้ getDeviceRealTimeData
};

// ── Inverter (device_type=1) point IDs ────────────────────────
export const INVERTER_POINTS = {
  ACTIVE_POWER:    24,  // Total Active Power  W
  TOTAL_PV_YIELD:   2,  // Total Yield         Wh
  DAILY_PV_YIELD:   1,  // Yield Today         Wh
  GRID_FREQUENCY:  27,  // Grid Frequency      Hz
  PHASE_A_VOLTAGE: 18,  // Phase A Voltage     V
  PHASE_A_CURRENT: 21,  // Phase A Current     A
  TOTAL_PF:        26,  // Total Power Factor
};

// ── ESS (device_type=14) point IDs ────────────────────────────
export const ESS_POINTS = {
  ACTIVE_POWER:              13011,
  FEED_IN_POWER:             13121,
  LOAD_POWER:                13119,
  GRID_FREQUENCY:            13007,
  PHASE_A_VOLTAGE:           13157,
  PHASE_A_CURRENT:           13008,
  TOTAL_POWER_FACTOR:        13013,
  BATTERY_LEVEL:             13141,
  BATTERY_CHARGING_POWER:    13126,
  BATTERY_DISCHARGING_POWER: 13150,
  BATTERY_VOLTAGE:           13138,
  BATTERY_CURRENT:           13139,
  BATTERY_HEALTH:            13142,
  BATTERY_TEMPERATURE:       13143,
  TOTAL_PV_YIELD:            13134,
  TOTAL_FEED_IN_ENERGY:      13125,
  TOTAL_PURCHASED_ENERGY:    13148,
  TOTAL_BATTERY_CHARGING:    13034,
  TOTAL_BATTERY_DISCHARGING: 13035,
  DAILY_PV_YIELD:            13112,
};

// backward compat
export const LIVE_DATA_POINTS = ESS_POINTS;