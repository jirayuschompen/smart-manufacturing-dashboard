// src/Planning.jsx
import React, { useMemo } from 'react';
import { 
  AlertTriangle, TrendingDown, TrendingUp, Calendar, 
  DollarSign, Factory, Wrench, CheckCircle, XCircle,
  Clock, BarChart3
} from 'lucide-react';

const Planning = ({
  theme,
  language,
  // currentLang,
  setShowPlanningModal,
  machineHealth, // ดึงข้อมูลจาก Maintenance
  handleOpenSchedule
}) => {

  // คำนวณผลกระทบจาก Health Score ของเครื่องจักร
  const analysisData = useMemo(() => {
    const criticalMachines = machineHealth.filter(m => m.status === 'critical');
    const warningMachines = machineHealth.filter(m => m.status === 'warning');
    const healthyMachines = machineHealth.filter(m => m.status === 'healthy');

    // คำนวณผลกระทบต่อการผลิต (สมมติว่าแต่ละเครื่องทำได้ 100 units/day)
    const avgProductionPerMachine = 100;
    const criticalLoss = criticalMachines.length * avgProductionPerMachine * 0.5; // เสี่ยงสูญเสีย 50%
    const warningLoss = warningMachines.length * avgProductionPerMachine * 0.2; // เสี่ยงสูญเสีย 20%
    const totalPotentialLoss = criticalLoss + warningLoss;

    // คำนวณผลกระทบต่อรายได้ (สมมติว่า 1 unit = $500)
    const revenuePerUnit = 500;
    const potentialRevenueLoss = totalPotentialLoss * revenuePerUnit * 30; // 30 วัน

    // คำนวณต้นทุนการซ่อมบำรุง
    const criticalMaintenanceCost = criticalMachines.length * 5000; // $5k ต่อเครื่อง
    const warningMaintenanceCost = warningMachines.length * 2000; // $2k ต่อเครื่อง
    const totalMaintenanceCost = criticalMaintenanceCost + warningMaintenanceCost;

    // คำนวณ ROI
    const savingsFromMaintenance = potentialRevenueLoss * 0.8; // ป้องกันได้ 80%
    const netBenefit = savingsFromMaintenance - totalMaintenanceCost;
    const roi = totalMaintenanceCost > 0 ? ((netBenefit / totalMaintenanceCost) * 100) : 0;

    return {
      criticalMachines,
      warningMachines,
      healthyMachines,
      totalPotentialLoss: Math.round(totalPotentialLoss),
      potentialRevenueLoss: Math.round(potentialRevenueLoss),
      totalMaintenanceCost,
      savingsFromMaintenance: Math.round(savingsFromMaintenance),
      netBenefit: Math.round(netBenefit),
      roi: Math.round(roi)
    };
  }, [machineHealth]);

  // สร้างแผนการซ่อมบำรุงที่แนะนำ
  const maintenancePlan = useMemo(() => {
    const plan = [];
    
    // Critical machines - แนะนำซ่อมทันที
    analysisData.criticalMachines.forEach(machine => {
      plan.push({
        machine: machine.name,
        priority: 'urgent',
        action: language === 'th' ? 'ซ่อมบำรุงฉุกเฉิน' : 'Emergency Maintenance',
        scheduledDate: 'Next 24-48 hours',
        estimatedCost: 5000,
        estimatedDowntime: '2-3 days',
        revenueLoss: 150000,
        status: 'critical',
        health: machine.health
      });
    });

    // Warning machines - แนะนำตรวจสอบภายใน 7 วัน
    analysisData.warningMachines.forEach(machine => {
      plan.push({
        machine: machine.name,
        priority: 'high',
        action: language === 'th' ? 'ตรวจสอบและซ่อมบำรุง' : 'Inspection & Maintenance',
        scheduledDate: 'Within 7 days',
        estimatedCost: 2000,
        estimatedDowntime: '1 day',
        revenueLoss: 50000,
        status: 'warning',
        health: machine.health
      });
    });

    // Healthy machines - แนะนำบำรุงรักษาตามแผน
    analysisData.healthyMachines.forEach(machine => {
      plan.push({
        machine: machine.name,
        priority: 'normal',
        action: language === 'th' ? 'บำรุงรักษาตามแผน' : 'Routine Maintenance',
        scheduledDate: 'Within 30 days',
        estimatedCost: 500,
        estimatedDowntime: '4 hours',
        revenueLoss: 0,
        status: 'healthy',
        health: machine.health
      });
    });

    return plan.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [analysisData, language]);

  return (
    <div className="space-y-6">
      
      {/* Overview Section */}
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {language === 'th' ? 'แผนการซ่อมบำรุงอัจฉริยะ' : 'Smart Maintenance Planning'}
            </h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              {language === 'th' ? 'วิเคราะห์สุขภาพเครื่องจักรและแนะนำแผนการซ่อมบำรุงเพื่อลดความเสี่ยงและเพิ่มรายได้' : 'Analyze machine health and recommend maintenance plans to reduce risk and increase revenue'}
            </p>
          </div>
          <button 
            onClick={() => setShowPlanningModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4" />
            {language === 'th' ? 'วิเคราะห์เพิ่มเติม' : 'Detailed Analysis'}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          
          {/* Total Machines */}
          <div className={`${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <Factory className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {language === 'th' ? 'เครื่องจักรทั้งหมด' : 'Total Machines'}
              </p>
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-slate-800'}`}>
              {machineHealth.length}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  {analysisData.criticalMachines.length} {language === 'th' ? 'วิกฤต' : 'Critical'}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  {analysisData.warningMachines.length} {language === 'th' ? 'เตือน' : 'Warning'}
                </span>
              </span>
            </div>
          </div>

          {/* Potential Revenue Loss */}
          <div className={`${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                {language === 'th' ? 'ความเสี่ยงรายได้สูญเสีย' : 'Revenue at Risk'}
              </p>
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-red-300' : 'text-slate-800'}`}>
              ${(analysisData.potentialRevenueLoss / 1000).toFixed(0)}K
            </p>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'}`}>
              {language === 'th' ? 'หากไม่ดำเนินการ (30 วัน)' : 'If no action taken (30 days)'}
            </p>
          </div>

          {/* Maintenance Cost */}
          <div className={`${theme === 'dark' ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-100'} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                {language === 'th' ? 'ต้นทุนการซ่อมบำรุง' : 'Maintenance Cost'}
              </p>
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-slate-800'}`}>
              ${(analysisData.totalMaintenanceCost / 1000).toFixed(0)}K
            </p>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-orange-500' : 'text-orange-600'}`}>
              {language === 'th' ? 'ค่าใช้จ่ายที่แนะนำ' : 'Recommended investment'}
            </p>
          </div>

          {/* Expected ROI */}
          <div className={`${theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100'} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                {language === 'th' ? 'ผลตอบแทน (ROI)' : 'Expected ROI'}
              </p>
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-slate-800'}`}>
              {analysisData.roi > 0 ? '+' : ''}{analysisData.roi}%
            </p>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`}>
              {language === 'th' ? 'ประหยัด $' : 'Savings $'}{(analysisData.netBenefit / 1000).toFixed(0)}K
            </p>
          </div>

        </div>

        {/* Financial Impact Summary */}
        <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-800' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'} rounded-lg p-5 border mb-8`}>
          <div className="flex items-start gap-3">
            <DollarSign className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0 mt-1`} />
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {language === 'th' ? 'สรุปผลกระทบทางการเงิน' : 'Financial Impact Summary'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
                {language === 'th' 
                  ? `จากการวิเคราะห์สุขภาพเครื่องจักร พบว่ามี ${analysisData.criticalMachines.length} เครื่องที่อยู่ในสภาวะวิกฤต และ ${analysisData.warningMachines.length} เครื่องที่ต้องเฝ้าระวัง หากไม่ดำเนินการซ่อมบำรุง คาดว่าจะสูญเสียรายได้ถึง $${(analysisData.potentialRevenueLoss / 1000).toFixed(0)}K ภายใน 30 วัน การลงทุนในการซ่อมบำรุง $${(analysisData.totalMaintenanceCost / 1000).toFixed(0)}K จะช่วยป้องกันความเสียหายและสร้างผลตอบแทนสุทธิ $${(analysisData.netBenefit / 1000).toFixed(0)}K หรือ ROI ${analysisData.roi}%`
                  : `Analysis shows ${analysisData.criticalMachines.length} critical and ${analysisData.warningMachines.length} warning machines. Without maintenance, estimated revenue loss is $${(analysisData.potentialRevenueLoss / 1000).toFixed(0)}K in 30 days. Investing $${(analysisData.totalMaintenanceCost / 1000).toFixed(0)}K in maintenance will prevent damage and generate net benefit of $${(analysisData.netBenefit / 1000).toFixed(0)}K, achieving ${analysisData.roi}% ROI.`
                }
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Maintenance Plan Recommendations */}
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
        
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {language === 'th' ? 'แผนการซ่อมบำรุงที่แนะนำ' : 'Recommended Maintenance Plan'}
          </h3>
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {maintenancePlan.length} {language === 'th' ? 'รายการ' : 'items'}
          </span>
        </div>

        <div className="space-y-3">
          {maintenancePlan.map((item, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-lg border transition-all ${
                item.status === 'critical' 
                  ? theme === 'dark' 
                    ? 'bg-red-900/20 border-red-800 hover:bg-red-900/30' 
                    : 'bg-red-50 border-red-200 hover:shadow-md'
                  : item.status === 'warning'
                  ? theme === 'dark'
                    ? 'bg-yellow-900/20 border-yellow-800 hover:bg-yellow-900/30'
                    : 'bg-yellow-50 border-yellow-200 hover:shadow-md'
                  : theme === 'dark'
                  ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/40'
                  : 'bg-slate-50 border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Machine Info */}
                <div className="flex items-start gap-4 flex-1">
                  
                  {/* Priority Badge */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 ${
                    item.status === 'critical' ? 'bg-red-500' :
                    item.status === 'warning' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}>
                    {item.status === 'critical' ? <XCircle className="w-6 h-6 text-white" /> :
                     item.status === 'warning' ? <AlertTriangle className="w-6 h-6 text-white" /> :
                     <CheckCircle className="w-6 h-6 text-white" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {item.machine}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                        item.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      }`}>
                        {language === 'th' ? 'สุขภาพ' : 'Health'} {item.health}%
                      </span>
                    </div>
                    
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      {item.action}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Calendar className="w-3 h-3" />
                        {item.scheduledDate}
                      </span>
                      <span className={`flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Clock className="w-3 h-3" />
                        {language === 'th' ? 'หยุด' : 'Downtime'} {item.estimatedDowntime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Cost & Action */}
                <div className="flex items-center gap-4 lg:flex-row flex-col lg:items-center items-start">
                  
                  {/* Cost Info */}
                  <div className="text-right">
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mb-1`}>
                      {language === 'th' ? 'ค่าใช้จ่าย' : 'Cost'}
                    </p>
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      ${item.estimatedCost.toLocaleString()}
                    </p>
                    {item.revenueLoss > 0 && (
                      <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mt-1`}>
                        {language === 'th' ? 'ป้องกันสูญเสีย' : 'Prevents loss'} ${(item.revenueLoss / 1000).toFixed(0)}K
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      const machine = machineHealth.find(m => m.name === item.machine);
                      if (machine) {
                        handleOpenSchedule(machine, item.priority);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition shadow-sm whitespace-nowrap ${
                      item.status === 'critical' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : item.status === 'warning'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : theme === 'dark'
                        ? 'bg-slate-600 hover:bg-slate-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {language === 'th' ? 'จัดตารางซ่อม' : 'Schedule Now'}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default Planning;