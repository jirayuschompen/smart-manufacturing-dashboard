import React from 'react';
// ====================================================================
// Weather Service - TMD API Integration (Fixed Version)
// ====================================================================
// แก้ไขปัญหา: Invalid API response format

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
// Weather Condition Mapping
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
const msToKmh = (ms) => {
  return Math.round(ms * 3.6 * 10) / 10;
};

const calculateCloudCoverage = (low, med, high) => {
  const total = (low + med + high) / 3;
  return Math.round(total);
};

// ====================================================================
// API Fetch Function - SUPPORTS CUSTOM LAT/LNG
// ====================================================================
export const fetchWeatherDataByLocation = async (latitude, longitude) => {
  try {
    const url = `${WEATHER_CONFIG.API_BASE_URL}/forecast/location/hourly/at?` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `fields=${WEATHER_CONFIG.FIELDS}&` +
      `duration=1`;

    console.log(`🌤️ Calling TMD API for PV at [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);

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
    let weatherApiData = null;
    
    if (data.WeatherForcasts?.length > 0) {
      weatherApiData = data.WeatherForcasts[0].forecasts?.[0]?.data;
    } else if (data.WeatherForecasts?.length > 0) {
      weatherApiData = data.WeatherForecasts[0].forecasts?.[0]?.data;
    } else if (data.location && data.forecasts?.length > 0) {
      weatherApiData = data.forecasts[0].data;
    } else if (data.data) {
      weatherApiData = data.data;
    }

    if (!weatherApiData) {
      throw new Error('Invalid API response format');
    }

    return parseWeatherData(weatherApiData);

  } catch (error) {
    console.error('Error fetching weather data for location:', error.message);
    return getFallbackWeatherData();
  }
};

// ====================================================================
// Original function for default location
// ====================================================================
export const fetchWeatherData = async () => {
  return fetchWeatherDataByLocation(WEATHER_CONFIG.LATITUDE, WEATHER_CONFIG.LONGITUDE);
};

// ====================================================================
// Parse Weather Data
// ====================================================================
const parseWeatherData = (apiData) => {
  const parsed = {
    temp: apiData.tc ? Math.round(apiData.tc * 10) / 10 : 32.5,
    condition: CONDITION_MAP[apiData.cond] || 'Partly Cloudy',
    windSpeed: apiData.ws10m ? msToKmh(apiData.ws10m) : 12,
    windDirection: apiData.wd10m || 0,
    humidity: apiData.rh ? Math.round(apiData.rh) : 65,
    pressure: apiData.slp ? Math.round(apiData.slp) : 1012,
    light: 850,
    pm25: 12,
    aqi: 'Good',
    rain: apiData.rain || 0,
    cloudCoverage: calculateCloudCoverage(
      apiData.cloudlow || 0,
      apiData.cloudmed || 0,
      apiData.cloudhigh || 0
    ),
    lastUpdated: new Date().toISOString()
  };
  return parsed;
};

// ====================================================================
// Fallback Data
// ====================================================================
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
// Weather Data Manager
// ====================================================================
class WeatherDataManager {
  constructor() {
    this.currentData = null;
    this.updateInterval = null;
    this.listeners = [];
  }

  async initialize() {
    console.log('🌤️ Initializing Weather Service...');
    console.log(`📍 Location: ${WEATHER_CONFIG.LATITUDE}°N, ${WEATHER_CONFIG.LONGITUDE}°E`);
    
    await this.updateWeatherData();
    this.startAutoUpdate();
    
    console.log('Weather Service initialized');
    console.log(`Auto-update every ${WEATHER_CONFIG.UPDATE_INTERVAL_MS / 60000} minutes`);
  }

  async updateWeatherData() {
    try {
      this.currentData = await fetchWeatherData();
      this.notifyListeners();
      return this.currentData;
    } catch (error) {
      console.error('Failed to update weather data:', error);
      return this.currentData || getFallbackWeatherData();
    }
  }

  startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.updateWeatherData();
    }, WEATHER_CONFIG.UPDATE_INTERVAL_MS);
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getCurrentData() {
    return this.currentData || getFallbackWeatherData();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    
    if (this.currentData) {
      callback(this.currentData);
    }
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error('Error in weather listener:', error);
      }
    });
  }

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
// React Hook - Default Location
// ====================================================================
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const initWeather = async () => {
      try {
        setIsLoading(true);
        await weatherManager.initialize();
        setWeatherData(weatherManager.getCurrentData());
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initWeather();

    const unsubscribe = weatherManager.subscribe((data) => {
      setWeatherData(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  return { weatherData, isLoading, error, refresh };
};

// ====================================================================
// React Hook - Custom Location (For Each PV Plant)
// ====================================================================
export const useWeatherDataByLocation = (latitude, longitude) => {
  const [weatherData, setWeatherData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!latitude || !longitude) {
        setWeatherData(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchWeatherDataByLocation(latitude, longitude);
        setWeatherData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setWeatherData(getFallbackWeatherData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchData, WEATHER_CONFIG.UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  return { weatherData, isLoading, error };
};

// ====================================================================
// Export Configuration
// ====================================================================
export const getWeatherConfig = () => ({
  location: {
    latitude: WEATHER_CONFIG.LATITUDE,
    longitude: WEATHER_CONFIG.LONGITUDE
  },
  updateInterval: WEATHER_CONFIG.UPDATE_INTERVAL_MS,
  apiEndpoint: `${WEATHER_CONFIG.API_BASE_URL}/forecast/location/hourly/at`
});