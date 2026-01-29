import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Forecast = ({
  theme,
  language,
  currentLang,
  demandDataSets, 
  demandPeriod,   
  setDemandPeriod,
  setShowForecastModal
}) => {

  // --- ปรับชุดสีใหม่ให้สบายตา และใช้ได้ทั้ง 2 โหมด ---
  const colors = {
    // Actual: สีเขียวมรกต (Emerald) ดูสบายตาและชัดเจนในทั้งสองโหมด
    actual: theme === 'dark' ? '#26df9b' : '#26df9b', 

    // Forecast: สีเหลือง (Yellow) ดูเย็นตา
    forecast: theme === 'dark' ? '#ffe70e' : '#ff9f0e', 
    
    // Bounds: สีม่วงอ่อน (Violet) ดูนุ่มนวล
    upper: theme === 'dark' ? '#38e1ff' : '#1fbfff', 
    lower: theme === 'dark' ? '#1fbfff' : '#4580ff', 

    // Grid & Text: ปรับตาม Theme เหมือนเดิม
    grid: theme === 'dark' ? '#334155' : '#e2e8f0',
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#fff',
    tooltipText: theme === 'dark' ? '#fff' : '#0f172a',
  };

  return (
    <div className="space-y-6">
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {currentLang.demandForecasting}
            </h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              {language === 'th' ? 'การพยากรณ์ความต้องการด้วย AI' : 'AI-powered demand prediction'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
              {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setDemandPeriod(period)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    demandPeriod === period
                      ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200')
                      : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                  }`}
                >
                  {period === 'daily' ? 'Day' : 
                   period === 'weekly' ? 'Week' : 
                   period === 'monthly' ? 'Month' : 
                   'Year'}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowForecastModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              {currentLang.generateForecast}
            </button>
          </div>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard 
            theme={theme}
            label={language === 'th' ? 'ความแม่นยำการพยากรณ์ (MAPE)' : 'Forecast Accuracy (MAPE)'}
            value="8.5%"
            labelColor={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}
            valueColor={theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}
            bgColor={theme === 'dark' ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'}
          />
          <MetricCard 
            theme={theme}
            label={language === 'th' ? 'ความเชื่อมั่นของโมเดล' : 'Model Confidence'}
            value="92%"
            labelColor={theme === 'dark' ? 'text-green-300' : 'text-green-600'}
            valueColor={theme === 'dark' ? 'text-green-400' : 'text-green-700'}
            bgColor={theme === 'dark' ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'}
          />
          <MetricCard 
            theme={theme}
            label={language === 'th' ? 'อัปเดตครั้งถัดไป' : 'Next Update'}
            value={`3 ${language === 'th' ? 'วัน' : 'days'}`}
            labelColor={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}
            valueColor={theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}
            bgColor={theme === 'dark' ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50'}
          />
        </div>

        {/* Chart Section */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demandDataSets[demandPeriod]}>
              <defs>
                <linearGradient id="colorActualForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.actual} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.actual} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecastVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.forecast} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.forecast} stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="label" stroke={colors.text} tick={{ fill: colors.text }} />
              <YAxis stroke={colors.text} tick={{ fill: colors.text }} />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: colors.tooltipBg, 
                  border: `1px solid ${colors.grid}`, 
                  borderRadius: '8px', 
                  color: colors.tooltipText 
                }}
              />
              <Legend />
              
              {/* Upper Bound */}
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke={colors.upper} 
                fill={colors.upper} 
                fillOpacity={0.1} 
                strokeDasharray="5 5" 
                name="Upper Bound" 
              />
              
              {/* Forecast */}
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke={colors.forecast} 
                strokeWidth={2} 
                fill="url(#colorForecastVal)" 
                name="Forecast" 
              />
              
              {/* Lower Bound */}
              <Area 
                type="monotone" 
                dataKey="lower" 
                stroke={colors.lower} 
                fill={colors.lower} 
                fillOpacity={0.1} 
                strokeDasharray="5 5" 
                name="Lower Bound" 
              />
              
              {/* Actual */}
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke={colors.actual} 
                strokeWidth={2} 
                fill="url(#colorActualForecast)" 
                name="Actual" 
                connectNulls 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border ${theme === 'dark' ? 'border-slate-700 bg-slate-750' : 'border-slate-200'} rounded-lg p-4`}>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'} mb-2`}>
              {language === 'th' ? 'ข้อมูลโมเดล' : 'Model Information'}
            </h4>
            <div className="space-y-2 text-sm">
              <CleanInfoRow theme={theme} label={language === 'th' ? 'อัลกอริทึม' : 'Algorithm'} value="LSTM + Attention" />
              <CleanInfoRow theme={theme} label={language === 'th' ? 'เวอร์ชัน' : 'Version'} value="v1.2.3" />
              <CleanInfoRow theme={theme} label={language === 'th' ? 'ฝึกฝนเมื่อ' : 'Trained'} value="2024-06-15" />
              <CleanInfoRow theme={theme} label={language === 'th' ? 'ชุดข้อมูล' : 'Dataset'} value={language === 'th' ? '18 เดือน' : '18 months history'} />
            </div>
          </div>

          <div className={`border ${theme === 'dark' ? 'border-slate-700 bg-slate-750' : 'border-slate-200'} rounded-lg p-4`}>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'} mb-2`}>
              {language === 'th' ? 'ตัวชี้วัดประสิทธิภาพ' : 'Performance Metrics'}
            </h4>
            <div className="space-y-2 text-sm">
              <CleanInfoRow theme={theme} label="MAPE" value="8.5%" valueColor="text-green-600" boldValue />
              <CleanInfoRow theme={theme} label="RMSE" value="45.2" />
              <CleanInfoRow theme={theme} label="R² Score" value="0.94" valueColor="text-green-600" boldValue />
              <CleanInfoRow theme={theme} label={language === 'th' ? 'เวลาคำนวณ' : 'Inference Time'} value="234ms" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---
const MetricCard = ({ theme, label, value, labelColor, valueColor, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-4`}>
    <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
    <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
  </div>
);

const CleanInfoRow = ({ theme, label, value, valueColor, boldValue }) => (
  <div className="flex justify-between">
    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{label}:</span>
    <span className={`${boldValue ? 'font-bold' : 'font-medium'} ${valueColor ? valueColor : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>{value}</span>
  </div>
);

export default Forecast;