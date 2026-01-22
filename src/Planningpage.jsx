// src/Planning.jsx
import React from 'react';

const Planning = ({
  theme,
  language,
  currentLang,
  setShowPlanningModal
}) => {

  // Mockup ข้อมูลตารางการผลิต
  const scheduleData = [
    { day: 'Monday', orders: 25, machines: 'M1, M2, M3', util: 89 },
    { day: 'Tuesday', orders: 28, machines: 'M1, M2, M4', util: 92 },
    { day: 'Wednesday', orders: 22, machines: 'M1, M3, M4', util: 85 },
    { day: 'Thursday', orders: 30, machines: 'M1, M2, M3, M4', util: 95 },
    { day: 'Friday', orders: 26, machines: 'M2, M3, M4', util: 88 },
  ];

  return (
    <div className="space-y-6">
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {currentLang.productionPlanning}
            </h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              {language === 'th' ? 'การจัดตารางการผลิตและจัดสรรทรัพยากรด้วย AI' : 'AI-optimized production scheduling and resource allocation'}
            </p>
          </div>
          <button 
            onClick={() => setShowPlanningModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
          >
            {currentLang.optimizeSchedule}
          </button>
        </div>

        {/* 1. Metrics Grid (ปรับดีไซน์ให้เหมือนรูป) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          
          {/* Planned Orders */}
          <div className={`${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'} rounded-lg p-4 border`}>
            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {language === 'th' ? 'คำสั่งที่วางแผนไว้' : 'Planned Orders'}
            </p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-slate-800'} mt-2`}>156</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-500' : 'text-blue-500'}`}>Next 30 days</p>
          </div>

          {/* Machine Utilization */}
          <div className={`${theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100'} rounded-lg p-4 border`}>
            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              {language === 'th' ? 'การใช้งานเครื่องจักร' : 'Machine Utilization'}
            </p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-slate-800'} mt-2`}>87%</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`}>Average across all</p>
          </div>

          {/* Total Cost */}
          <div className={`${theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100'} rounded-lg p-4 border`}>
            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              {language === 'th' ? 'ต้นทุนรวม' : 'Total Cost'}
            </p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-slate-800'} mt-2`}>$125K</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-purple-500' : 'text-purple-600'}`}>Optimized plan</p>
          </div>

          {/* On-Time Delivery */}
          <div className={`${theme === 'dark' ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-100'} rounded-lg p-4 border`}>
            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              {language === 'th' ? 'การส่งตรงเวลา' : 'On-Time Delivery'}
            </p>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-slate-800'} mt-2`}>98%</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-orange-500' : 'text-orange-600'}`}>Predicted rate</p>
          </div>

        </div>

        {/* 2. Schedule List (ส่วนที่เพิ่มเข้ามาใหม่) */}
        <div>
          <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {language === 'th' ? 'ตารางการผลิตสัปดาห์นี้' : "This Week's Schedule"}
          </h3>
          
          <div className="space-y-3">
            {scheduleData.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' 
                    : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Left: Day & Info */}
                <div className="flex items-center gap-4 mb-2 md:mb-0">
                  <div className={`w-24 h-10 flex items-center justify-center rounded font-bold text-sm ${
                    theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.day}
                  </div>
                  <div>
                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.orders} {language === 'th' ? 'คำสั่งผลิต' : 'Production Orders'}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Machines: {item.machines}
                    </p>
                  </div>
                </div>

                {/* Right: Utilization */}
                <div className="flex items-center gap-4 justify-end">
                  <div className="text-right">
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Utilization
                    </p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.util}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Planning;