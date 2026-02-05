import React from 'react';
// ====================================================================
// Weather Service - TMD API Integration
// ====================================================================
// ไฟล์นี้จัดการการดึงข้อมูลพยากรณ์อากาศจาก TMD API
// และแปลงข้อมูลให้เหมาะกับ Weather Widget

// ====================================================================
// 🔧 CONFIGURATION - แก้พิกัดตรงนี้
// ====================================================================
const WEATHER_CONFIG = {
  // พิกัดโรงงาน: 13°28'26.1"N 101°05'22.3"E
  LATITUDE: 13.473917,   // ⭐ แก้พิกัด Latitude ตรงนี้
  LONGITUDE: 101.089528, // ⭐ แก้พิกัด Longitude ตรงนี้
  
  // TMD API Configuration
  API_BASE_URL: 'https://data.tmd.go.th/nwpapi/v1',
  API_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjM0NzNkZWVmNjYxOGE2ZWY5ZTVmOTlmMGY1OTAyM2M0NmMzYjgzYmRiMzQ2YzU1Y2E2MDBjMjIzMjQ1NTg0MjFjZWVmM2QwOTllY2EzZjk5In0.eyJhdWQiOiIyIiwianRpIjoiMzQ3M2RlZWY2NjE4YTZlZjllNWY5OWYwZjU5MDIzYzQ2YzNiODNiZGIzNDZjNTVjYTYwMGMyMjMyNDU1ODQyMWNlZWYzZDA5OWVjYTNmOTkiLCJpYXQiOjE3NzAyNjMzMzgsIm5iZiI6MTc3MDI2MzMzOCwiZXhwIjoxODAxNzk5MzM4LCJzdWIiOiI0OTEwIiwic2NvcGVzIjpbXX0.MvLIfggM9gmJPikdRUbFJAEJQ2U4GLMIvn3U6ADCn7pE5DLC2Px9El4EEa_tqhjwEFkcN2vfJvAqTLwwEcSaTIaWxNzTGd7ii9Fd2y8QdLIZJHaQMntxEE5k5yXfysPlL8b_zK8fQP9JDwIRc7sgiYqvx5MNBKyBn1LD8zBQbzrgYGJvppdyNlLQEVKL1h2Bf-uo21ugOjgf4B-zYJmnw7fR8bXFjGuDpwK3y3ATJPbrAZr_NEAGiq2bqiChM8GSP3gXzQo1-k8lRYG-CmVIqb2kG-FmyoZwhXA9dsbg2ztgiCP9A39Rp2pWDKXCtfsxRVLMga51VJhplbo9XnYYQrrJdx0nOKDfXlNum0ccmRAK9WLoVQKtNXy4XT1qIG1Leo3MZM1BNdY_X6IryDTW01k9_k8-j8yeRH6YMDP2gkJ6boDE-RaB8gA1zPKtQqyC922xJmHHbunQBzAHUuYy2l-kRj_Yrav9BX9K433fUcPNsBpkAjjUvjsHvaDFqJ9ockdqdNiyc821WEPUmUJ1acsKXBNGejyqbUWTdUyFeq14boCgxqxYmR9ItVaMGnBLklh9UcNkrzIGKwqCWvvbaAxd8LoQ_mXjQDT5WEKco1czJyQ2Vx2Zvj-I0lKvP9zsfzigoXtzXycp_KIUHBFPypayUAQ93fAWhtCIsNyqLKI',
  
  // Update Interval
  UPDATE_INTERVAL_MS: 30 * 60 * 1000, // 30 นาที
  
  // Default Fields to Fetch
  FIELDS: 'tc,rh,slp,ws10m,wd10m,rain,cond,cloudlow,cloudmed,cloudhigh'
};

// ====================================================================
// Weather Condition Mapping (จาก TMD API Documentation)
// ====================================================================
const CONDITION_MAP = {
  1: 'Clear',
  2: 'Partly Cloudy',
  3: 'Cloudy',
  4: 'Overcast',
  5: 'Light Rain',
  6: 'Moderate Rain',
  7: 'Heavy Rain',
  8: 'Thunderstorm',
  9: 'Very Cold',
  10: 'Cold',
  11: 'Cool',
  12: 'Very Hot'
};

// ====================================================================
// Utility Functions
// ====================================================================

/**
 * แปลงความเร็วลมจาก m/s เป็น km/h
 */
const msToKmh = (ms) => {
  return Math.round(ms * 3.6 * 10) / 10; // ทศนิยม 1 ตำแหน่ง
};

/**
 * แปลง solar radiation เป็น W/m²
 */
// eslint-disable-next-line no-unused-vars
const calculateLight = (swdown) => {
  return swdown ? Math.round(swdown) : 850; // Default 850 W/m²
};

/**
 * คำนวณ Cloud Coverage จาก low, medium, high
 */
const calculateCloudCoverage = (low, med, high) => {
  const total = (low + med + high) / 3;
  return Math.round(total);
};

// ====================================================================
// API Fetch Function
// ====================================================================

/**
 * ดึงข้อมูลพยากรณ์อากาศจาก TMD API
 * @returns {Promise<Object>} Weather data object
 */
export const fetchWeatherData = async () => {
  try {
    const url = `${WEATHER_CONFIG.API_BASE_URL}/forecast/location/hourly/at?` +
      `lat=${WEATHER_CONFIG.LATITUDE}&` +
      `lon=${WEATHER_CONFIG.LONGITUDE}&` +
      `fields=${WEATHER_CONFIG.FIELDS}&` +
      `duration=1`; // ขอข้อมูล 1 ชั่วโมงปัจจุบัน

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${WEATHER_CONFIG.API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`TMD API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse ข้อมูลจาก API Response
    if (data.WeatherForcasts && data.WeatherForcasts.length > 0) {
      const forecast = data.WeatherForcasts[0];
      if (forecast.forecasts && forecast.forecasts.length > 0) {
        return parseWeatherData(forecast.forecasts[0].data);
      }
    }

    throw new Error('Invalid API response format');

  } catch (error) {
    console.error('❌ Error fetching weather data:', error);
    // Return fallback data
    return getFallbackWeatherData();
  }
};

/**
 * แปลงข้อมูลจาก TMD API เป็นรูปแบบที่ใช้ใน Widget
 */
const parseWeatherData = (apiData) => {
  return {
    // Temperature
    temp: apiData.tc ? Math.round(apiData.tc * 10) / 10 : 32.5,
    
    // Condition (แปลงจากรหัสเป็นข้อความ)
    condition: CONDITION_MAP[apiData.cond] || 'Partly Cloudy',
    
    // Wind Speed (แปลง m/s → km/h)
    windSpeed: apiData.ws10m ? msToKmh(apiData.ws10m) : 12,
    
    // Wind Direction
    windDirection: apiData.wd10m || 0,
    
    // Humidity
    humidity: apiData.rh ? Math.round(apiData.rh) : 65,
    
    // Pressure (hPa)
    pressure: apiData.slp ? Math.round(apiData.slp) : 1012,
    
    // Light/Solar Radiation (ใช้ข้อมูลจาก daily API หรือ estimate)
    light: 850, // W/m² - ต้องดึงจาก daily API แยก
    
    // PM 2.5 (Mock Data - ไม่มีใน TMD API)
    pm25: 12,
    
    // AQI (Mock Data - ไม่มีใน TMD API)
    aqi: 'Good',
    
    // Rain (mm)
    rain: apiData.rain || 0,
    
    // Cloud Coverage
    cloudCoverage: calculateCloudCoverage(
      apiData.cloudlow || 0,
      apiData.cloudmed || 0,
      apiData.cloudhigh || 0
    ),
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Fallback data เมื่อ API ล้มเหลว
 */
const getFallbackWeatherData = () => {
  return {
    temp: 32.5,
    condition: 'Partly Cloudy',
    windSpeed: 12,
    windDirection: 0,
    humidity: 65,
    pressure: 1012,
    light: 850,
    pm25: 12,
    aqi: 'Good',
    rain: 0,
    cloudCoverage: 30,
    lastUpdated: new Date().toISOString(),
    isFallback: true
  };
};

// ====================================================================
// Weather Data Manager (with Auto-Update)
// ====================================================================

class WeatherDataManager {
  constructor() {
    this.currentData = null;
    this.updateInterval = null;
    this.listeners = [];
  }

  /**
   * เริ่มต้นและดึงข้อมูลครั้งแรก
   */
  async initialize() {
    console.log('🌤️ Initializing Weather Service...');
    console.log(`📍 Location: ${WEATHER_CONFIG.LATITUDE}°N, ${WEATHER_CONFIG.LONGITUDE}°E`);
    
    // ดึงข้อมูลครั้งแรก
    await this.updateWeatherData();
    
    // ตั้งค่า Auto-update ทุก 30 นาที
    this.startAutoUpdate();
    
    console.log('✅ Weather Service initialized');
    console.log(`🔄 Auto-update every ${WEATHER_CONFIG.UPDATE_INTERVAL_MS / 60000} minutes`);
  }

  /**
   * ดึงข้อมูลอากาศใหม่
   */
  async updateWeatherData() {
    try {
      console.log('🔄 Fetching weather data from TMD API...');
      this.currentData = await fetchWeatherData();
      
      if (this.currentData.isFallback) {
        console.warn('⚠️ Using fallback weather data');
      } else {
        console.log('✅ Weather data updated successfully');
      }
      
      // แจ้ง listeners ทั้งหมด
      this.notifyListeners();
      
      return this.currentData;
    } catch (error) {
      console.error('❌ Failed to update weather data:', error);
      return this.currentData || getFallbackWeatherData();
    }
  }

  /**
   * เริ่ม Auto-update
   */
  startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.updateWeatherData();
    }, WEATHER_CONFIG.UPDATE_INTERVAL_MS);
  }

  /**
   * หยุด Auto-update
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * ดึงข้อมูลปัจจุบัน
   */
  getCurrentData() {
    return this.currentData || getFallbackWeatherData();
  }

  /**
   * Subscribe to weather updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // ส่งข้อมูลปัจจุบันให้ทันที
    if (this.currentData) {
      callback(this.currentData);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * แจ้ง listeners ทั้งหมด
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error('Error in weather listener:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAutoUpdate();
    this.listeners = [];
    this.currentData = null;
  }
}

// ====================================================================
// Export Singleton Instance
// ====================================================================
export const weatherManager = new WeatherDataManager();

// ====================================================================
// React Hook สำหรับใช้ใน Component
// ====================================================================

/**
 * Custom React Hook สำหรับดึงข้อมูลอากาศ
 * @returns {Object} { weatherData, isLoading, error, refresh }
 */
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Initialize on mount
    const initWeather = async () => {
      try {
        setIsLoading(true);
        await weatherManager.initialize();
        setWeatherData(weatherManager.getCurrentData());
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Weather initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initWeather();

    // Subscribe to updates
    const unsubscribe = weatherManager.subscribe((data) => {
      setWeatherData(data);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Force refresh weather data
   */
  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await weatherManager.updateWeatherData();
      setWeatherData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    weatherData,
    isLoading,
    error,
    refresh
  };
};

// ====================================================================
// Export Configuration (for debugging)
// ====================================================================
export const getWeatherConfig = () => ({
  location: {
    latitude: WEATHER_CONFIG.LATITUDE,
    longitude: WEATHER_CONFIG.LONGITUDE
  },
  updateInterval: WEATHER_CONFIG.UPDATE_INTERVAL_MS,
  apiEndpoint: `${WEATHER_CONFIG.API_BASE_URL}/forecast/location/hourly/at`
});
