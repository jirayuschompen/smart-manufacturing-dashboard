// src/Maintenance.jsx
import React from 'react';
import { 
  AlertTriangle, Activity, Factory, CheckCircle, XCircle 
} from 'lucide-react';

const Maintenance = ({
  theme,
  currentLang,
  machineHealth,
  setShowAnalysisModal,
  handleOpenSchedule,
  setSelectedMachine,
  setShowMachineDetail
}) => {
  return (
    <div className="space-y-6">
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {currentLang.predictiveMaintenance}
            </h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              {currentLang.aiDriven}
            </p>
          </div>
          <button 
            onClick={() => setShowAnalysisModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {currentLang.runAnalysis}
          </button>
        </div>

        {/* Machine Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {machineHealth.map((machine, idx) => (
            <div key={idx} className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
              machine.status === 'critical' ? 'border-red-300 bg-red-50 hover:bg-red-100' :
              machine.status === 'warning' ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
              'border-green-300 bg-green-50 hover:bg-green-100'
            } ${theme === 'dark' ? (
              machine.status === 'critical' ? '!bg-red-900/20 !border-red-700 hover:!bg-red-900/30' :
              machine.status === 'warning' ? '!bg-yellow-900/20 !border-yellow-700 hover:!bg-yellow-900/30' :
              '!bg-green-900/20 !border-green-700 hover:!bg-green-900/30'
            ) : ''}`}>
              
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Factory className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} />
                  <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {machine.name}
                  </h3>
                </div>
                {machine.status === 'critical' ? 
                  <XCircle className="w-6 h-6 text-red-600" /> :
                  machine.status === 'warning' ?
                  <AlertTriangle className="w-6 h-6 text-yellow-600" /> :
                  <CheckCircle className="w-6 h-6 text-green-600" />
                }
              </div>

              {/* Stats & Progress */}
              <div className="space-y-4">
                
                {/* Health Score Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {currentLang.healthScore}
                    </span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {machine.health}%
                    </span>
                  </div>
                  <div className={`w-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-3`}>
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        machine.health >= 80 ? 'bg-green-500' :
                        machine.health >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${machine.health}%` }}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-white'} rounded-lg p-3 space-y-2 shadow-sm`}>
                  <div className="flex justify-between text-sm">
                    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {currentLang.rul}
                    </span>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {machine.rul} {currentLang.days}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {currentLang.failureProbability}
                    </span>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {machine.status === 'critical' ? 'High' : machine.status === 'warning' ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // ป้องกันการคลิกซ้อน
                    if (machine.status === 'critical') {
                      handleOpenSchedule(machine, 'urgent');
                    } else if (machine.status === 'warning') {
                      handleOpenSchedule(machine, 'inspection');
                    } else {
                      setSelectedMachine(machine);
                      setShowMachineDetail(true);
                    }
                  }}
                  className={`w-full py-2 rounded-lg font-medium transition shadow-sm ${
                    machine.status === 'critical' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    machine.status === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {machine.status === 'critical' ? currentLang.scheduleUrgent :
                   machine.status === 'warning' ? currentLang.scheduleInspection :
                   currentLang.viewDetails}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;