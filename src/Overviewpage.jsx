import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Activity, Factory, Bell, Clock, X, Cloud, Wind, Droplets, Gauge, Search, Info 
} from 'lucide-react';

const Overview = ({
  theme,
  currentLang,
  weatherData,
  kpiCards,
  productionDataSets,
  productionPeriod,
  setProductionPeriod,
  demandDataSets,
  demandPeriod,
  setDemandPeriod,
  alerts,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteAllAlerts,
  deleteAlert,
  machineHealth,
  setSelectedMachine,
  setShowMachineDetail,
  showAllAlerts,
  setShowAllAlerts,
  alertSearch,
  setAlertSearch,
  setAlertFilter,
  alertFilter,
  filteredAlerts
}) => {

  // Helper function สำหรับ Icon ในหน้านี้
  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    // Container หลัก
    <div className="flex flex-col h-auto lg:h-[calc(100vh-160px)] gap-3 lg:gap-4 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0 scrollbar-hide relative">
      
      {/* --- Weather Widget --- */}
      <div className={`rounded-2xl p-5 border shadow-lg transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#111827] border-slate-800 text-white' 
          : 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400 text-white' 
      }`}>
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-0">
          <div className="flex items-center gap-5 min-w-max lg:pr-8">
            <div className={`p-3.5 rounded-2xl shadow-sm backdrop-blur-md ${
              theme === 'dark' ? 'bg-slate-800 text-blue-400' : 'bg-white/20 text-white'
            }`}>
              <Cloud className="w-9 h-9 lg:w-10 lg:h-10 drop-shadow-md" />
            </div>
            <div>
              <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-blue-100'
              }`}>
                {currentLang.overview === 'Overview' ? 'Site Conditions' : 'สภาพอากาศหน้างาน'}
              </h3>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-bold tracking-tighter leading-none text-white">
                  {weatherData.temp}°
                </span>
                <span className={`text-base font-medium ${
                  theme === 'dark' ? 'text-slate-400' : 'text-blue-50'
                }`}>
                  {weatherData.condition}
                </span>
              </div>
            </div>
          </div>
          <div className={`hidden lg:block w-px h-12 mx-auto ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-white/20'
          }`}></div>
          <div className="w-full grid grid-cols-3 gap-y-6 gap-x-2 lg:grid-cols-6 lg:gap-x-4 lg:pl-8">
            {[
              { label: 'Wind', val: `${weatherData.windSpeed} km/h`, icon: Wind },
              { label: 'Humidity', val: `${weatherData.humidity}%`, icon: Droplets },
              { label: 'Pressure', val: `${weatherData.pressure} hPa`, icon: Gauge },
              { label: 'Light', val: '850 W/m²', icon: null, char: '☀️' },
              { label: 'PM 2.5', val: '12 µg', icon: null, char: 'PM', highlight: true },
              { label: 'AQI', val: 'Good', icon: null, char: '🍃', highlight: true },
            ].map((item, i) => (
              <div key={i} className="flex flex-col lg:flex-row items-center lg:justify-start lg:gap-3 text-center lg:text-left">
                <div className={`mb-1.5 lg:mb-0 transition-colors ${
                  theme === 'dark' ? 'text-slate-500' : 'text-blue-100'
                }`}>
                  {item.icon ? (
                    <item.icon className="w-5 h-5 drop-shadow-sm" />
                  ) : (
                    <div className={`flex items-center justify-center w-5 h-5 font-bold rounded ${
                      item.label === 'PM 2.5' ? 'text-[9px] border border-current px-0.5' : 'text-sm'
                    }`}>
                      {item.char}
                    </div>
                  )}
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                    theme === 'dark' ? 'text-slate-500' : 'text-blue-200'
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-sm font-bold whitespace-nowrap ${
                    item.highlight ? 'text-green-300' : 'text-white'
                  }`}>
                    {item.val}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          const bgColors = {
            blue: theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100',
            green: theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100',
            purple: theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100',
            red: theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'
          };
          const iconColors = {
            blue: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
            green: theme === 'dark' ? 'text-green-400' : 'text-green-600',
            purple: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
            red: theme === 'dark' ? 'text-red-400' : 'text-red-600'
          };
          return (
            <div key={idx} className={`${bgColors[kpi.color]} border rounded-xl p-3 shadow-sm flex flex-col justify-between h-full min-h-[100px] lg:min-h-0 lg:h-auto transition-transform active:scale-95 lg:hover:scale-[1.02]`}>
              <div className="flex justify-between items-start mb-1 lg:mb-2">
                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/80'} shadow-sm`}>
                  <Icon className={`w-4 h-4 ${iconColors[kpi.color]}`} />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                  kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 
                  kpi.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <div>
                <p className={`text-[10px] lg:text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-0.5 truncate ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {kpi.title === 'Overall OEE' ? currentLang.overallOEE :
                  kpi.title === 'Forecast Accuracy' ? currentLang.forecastAccuracy :
                  kpi.title === 'Active Machines' ? currentLang.activeMachines :
                  currentLang.criticalAlerts}
                </p>
                <p className={`text-xl lg:text-2xl font-bold leading-none ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Main Content Grid --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-auto lg:h-full lg:min-h-0">
          
          {/* Production Chart */}
          <div className={`h-[300px] lg:h-auto lg:flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-4 flex flex-col min-h-0`}>
            <div className="flex justify-between items-center mb-2 flex-none">
              <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.weeklyProduction}</h3>
              <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
                {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                  <button key={period} onClick={() => setProductionPeriod(period)} className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${productionPeriod === period ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200') : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>
                     {period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : period === 'monthly' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionDataSets[productionPeriod]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#46566d' : '#e2e8f0' } vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4}} />
                  <Bar dataKey="oee" fill="#3b82f6" name="OEE %" radius={[4, 4, 0, 0]} barSize={productionPeriod === 'yearly' ? 60 : 25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demand Chart */}
          <div className={`h-[300px] lg:h-auto lg:flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-4 flex flex-col min-h-0`}>
            <div className="flex justify-between items-center mb-2 flex-none">
              <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.demandTrend}</h3>
              <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
                  {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                    <button key={period} onClick={() => setDemandPeriod(period)} className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${demandPeriod === period ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200') : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}>
                     {period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : period === 'monthly' ? 'Month' : 'Year'}
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandDataSets[demandPeriod]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffe70e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ff9f0e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  
                  {/* --- ส่วนที่เพิ่ม: Upper Bound --- */}
                  <Area 
                    type="monotone" 
                    dataKey="upper" 
                    stroke="#38e1ff" 
                    strokeDasharray="3 3" 
                    strokeWidth={1} 
                    fill="#1fbfff" 
                    fillOpacity={0.1} 
                    name="Upper Bound" 
                  />

                  {/* --- ส่วนที่เพิ่ม: Lower Bound --- */}
                  <Area 
                    type="monotone" 
                    dataKey="lower" 
                    stroke="#1fbfff" 
                    strokeDasharray="3 3" 
                    strokeWidth={1} 
                    fill="#4580ff" 
                    fillOpacity={0.1} 
                    name="Lower Bound" 
                  />

                  {/* Forecast Line */}
                  <Area type="monotone" dataKey="forecast" stroke="#ffb30e" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" name="Forecast" />
                  
                  {/* Actual Line */}
                  <Area type="monotone" dataKey="actual" stroke="#26df9b" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Lists */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-auto lg:h-full lg:min-h-0">
          
          {/* Alerts List */}
          <div className={`h-[300px] lg:h-auto lg:flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border flex flex-col min-h-0 overflow-hidden`}>
            <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'} flex-none flex justify-between items-center bg-opacity-50`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-md">
                  <Bell className="w-4 h-4 text-red-600" />
                </div>
                <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.recentAlerts}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{unreadCount} new</span>
                <button 
                  onClick={() => setShowAllAlerts(true)}
                  className={`text-[10px] font-medium hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  {currentLang.viewAll}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} onClick={() => {markAsRead(alert.id); setShowAllAlerts(true);}} className={`group p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 hover:border-slate-500' : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-sm'} transition-all cursor-pointer relative overflow-hidden`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{alert.machine}</span>
                      <span className="text-[9px] text-slate-400">{alert.time}</span>
                    </div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} line-clamp-1`}>{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Machine Health List */}
          <div className={`h-[300px] lg:h-auto lg:flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border flex flex-col min-h-0 overflow-hidden`}>
            <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'} flex-none flex items-center gap-2`}>
              <div className="p-1.5 bg-blue-100 rounded-md"><Activity className="w-4 h-4 text-blue-600" /></div>
              <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.machineHealth}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {machineHealth.map((machine, idx) => (
                <div key={idx} onClick={() => {setSelectedMachine(machine); setShowMachineDetail(true);}} className={`flex items-center justify-between p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm hover:border-blue-200'} transition cursor-pointer`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-6 h-6 flex-none flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="transparent" className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-200'}`} />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={63} strokeDashoffset={63 - (63 * machine.health) / 100} className={`${machine.health >= 80 ? 'text-green-500' : machine.health >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                      </svg>
                      <span className="absolute text-[7px] font-bold">{machine.health}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>{machine.name}</p>
                      <p className="text-[9px] text-slate-400">RUL: {machine.rul} days</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${machine.status === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : machine.status === 'warning' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {machine.status === 'critical' ? 'CRIT' : machine.status === 'warning' ? 'WARN' : 'GOOD'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- All Alerts Modal --- */}
      {showAllAlerts && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#1e293b]' : 'bg-white'} zoom-in-95 duration-200`}>
                  
                  {/* 1. Header: Title & Close Button */}
                  <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <Bell className="w-6 h-6 text-blue-600" />
                      <div>
                        <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.allAlerts}</h2>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {alerts.length} items ({unreadCount} unread)
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAllAlerts(false)}
                      className={`p-1.5 rounded-full hover:bg-slate-100 transition ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
      
                  {/* 2. Controls: Search, Filters, Actions */}
                  <div className="p-4 space-y-4">
                    {/* Search Bar */}
                    <div className={`flex items-center px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}>
                      <Search className="w-5 h-5 text-slate-400 mr-2" />
                      <input 
                        type="text" 
                        placeholder={currentLang.searchAlerts} 
                        className={`bg-transparent outline-none w-full text-sm ${theme === 'dark' ? 'text-white placeholder:text-slate-500' : 'text-slate-800'}`}
                        value={alertSearch}
                        onChange={(e) => setAlertSearch(e.target.value)}
                      />
                    </div>
      
                    {/* Filters & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {['All', 'Unread', 'Read', 'critical', 'High', 'Medium', 'Low'].map(filter => (
                          <button
                            key={filter}
                            onClick={() => setAlertFilter(filter.toLowerCase())}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                              alertFilter === filter.toLowerCase()
                                ? 'bg-blue-600 text-white shadow-sm'
                                : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={markAllAsRead}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {currentLang.markAllRead}
                        </button>
                        <button 
                          onClick={deleteAllAlerts}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
                        >
                          {currentLang.deleteAll}
                        </button>
                      </div>
                    </div>
                  </div>
      
                  {/* 3. Alerts List Area */}
                  <div className={`flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map((alert) => (
                        <div key={alert.id} className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between relative group transition-all ${
                          theme === 'dark' ? 'bg-white/5 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}>
                          
                          {/* Left Side: Icon & Content */}
                          <div className="flex items-start gap-4">
                            {/* Circle Icon Background */}
                            <div className={`p-2 rounded-full flex-none ${
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                              alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {getSeverityIcon(alert.severity)}
                            </div>
      
                            {/* Text Content */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                  {alert.machine}
                                </span>
                                {/* Severity Badge */}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                  alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {alert.severity}
                                </span>
                                {/* Unread Dot */}
                                {!alert.read && <span className="w-2 h-2 rounded-full bg-blue-500 ml-1"></span>}
                              </div>
                              
                              <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                {alert.message}
                              </p>
                              
                              {/* Meta Data Row: Time & Type */}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center text-xs text-slate-400 gap-1">
                                  <Clock className="w-3 h-3" /> {alert.time}
                                </span>
                                
                                {/* Type Indicator */}
                                {alert.type === 'warning' && <span className="flex items-center text-xs text-orange-500 gap-1 font-medium"><AlertTriangle className="w-3 h-3" /> Warning</span>}
                                {alert.type === 'info' && <span className="flex items-center text-xs text-blue-500 gap-1 font-medium"><Info className="w-3 h-3" /> Info</span>}
                                {alert.type === 'critical' && <span className="flex items-center text-xs text-red-500 gap-1 font-medium"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical</span>}
                              </div>
                            </div>
                          </div>
      
                          {/* Right Side: Delete Button */}
                          <button 
                            onClick={() => deleteAlert(alert.id)}
                            className={`absolute top-3 right-3 p-1 rounded-full opacity-50 hover:opacity-100 transition ${theme === 'dark' ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-500'}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                        <Bell className="w-12 h-12 mb-2 opacity-50" />
                        <p>{currentLang.noAlertsFound}</p>
                      </div>
                    )}
                  </div>
      
                  {/* 4. Footer */}
                  <div className={`p-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Showing {filteredAlerts.length} of {alerts.length} items
                    </span>
                    <button 
                      onClick={() => setShowAllAlerts(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-white shadow-sm'
                      }`}
                    >
                      {currentLang.close}
                    </button>
                  </div>
      
                </div>
              </div>
      )}

    </div>
  );
};

export default Overview;