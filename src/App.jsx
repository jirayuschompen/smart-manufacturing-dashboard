import React, {useState} from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, AlertTriangle, Activity, Settings, Calendar, Package, Factory, Cpu, Bell, ChevronRight, CheckCircle, XCircle, Clock, X, User, LogOut, Shield, FileText, Loader, Check, Upload, Download } from 'lucide-react';
import LoginMockup from './login'; // 1. IMPORT Login เข้ามา

const generateDailyData = () => {
  const data = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      const timeLabel = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      let baseValue = 0;

      // 1. กำหนด Base Value ตามช่วงเวลา (Trend หลัก)
      if (h < 6) baseValue = 150;        
      else if (h < 9) baseValue = 300 + ((h - 6) * 200); 
      else if (h < 12) baseValue = 850;  
      else if (h < 13) baseValue = 700;  
      else if (h < 17) baseValue = 900;  
      else if (h < 21) baseValue = 600 - ((h - 17) * 100); 
      else baseValue = 200;              

      // 2. ปรุงแต่งข้อมูล
      // Actual: มีความแกว่งตัว (Noise) เล็กน้อยตามธรรมชาติเครื่องจักร
      const randomNoise = (Math.random() - 0.5) * 40; 
      const actual = Math.max(0, baseValue + randomNoise);

      // Forecast: ตัดความแกว่งออก ให้เป็นเส้นเรียบๆ (Smooth Trend) 
      // อาจจะบวกค่านิดหน่อยเพื่อให้เห็นเส้นแยกกับ Actual ชัดเจน
      const forecast = baseValue * 1.02; 

      data.push({
        label: timeLabel,
        actual: Math.round(actual),   // ปัดเศษให้ดูสวย
        forecast: Math.round(forecast) // เส้นนี้จะนิ่ง เรียบร้อย
      });
    }
  }
  return data;
};

const generateHourlyOEE = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    let oee = 0;

    // จำลองสถานการณ์จริง:
    if (i < 6) oee = 0; // 00:00-06:00 เครื่องจักรหยุดเดิน (หรือ Low)
    else if (i === 12) oee = 45; // พักเที่ยง ประสิทธิภาพตกลง
    else if (i > 17 && i <= 20) oee = 75; // OT ประสิทธิภาพลดลงนิดหน่อย
    else if (i > 20) oee = 0; // เลิกงาน
    else oee = 85 + Math.floor(Math.random() * 10); // เวลาทำงานปกติ (85-95%)

    data.push({
      label: hour,
      oee: oee
    });
  }
  return data;
};

// 2. เปลี่ยนชื่อ Component เดิมเป็น Dashboard และรับ onLogout
const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showMachineDetail, setShowMachineDetail] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleType, setScheduleType] = useState('inspection');
  const [productionPeriod, setProductionPeriod] = useState('daily');
  const [demandPeriod, setDemandPeriod] = useState('monthly');
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    technician: '',
    priority: 'medium',
    notes: ''
  });
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all');
  const [alertSearch, setAlertSearch] = useState('');

  // --- แก้ไขข้อมูล Production Efficiency ตามที่คุณต้องการ ---
  const productionDataSets = {
    // 1. Daily: แสดงรายชั่วโมงใน 1 วัน
    daily: generateHourlyOEE(),

    // 2. Weekly: แสดงข้อมูล 7 วัน (Mon - Sun)
    weekly: [
      { label: 'Mon', oee: 85 },
      { label: 'Tue', oee: 87 },
      { label: 'Wed', oee: 82 },
      { label: 'Thu', oee: 89 },
      { label: 'Fri', oee: 86 },
      { label: 'Sat', oee: 75 }, // วันเสาร์ (ครึ่งวัน/OT)
      { label: 'Sun', oee: 0 }   // วันหยุด
    ],

    // 3. Monthly: แสดง 12 เดือน (เหมือนเดิม)
    monthly: [
      { label: 'Jan', oee: 80 }, { label: 'Feb', oee: 82 }, { label: 'Mar', oee: 81 },
      { label: 'Apr', oee: 85 }, { label: 'May', oee: 86 }, { label: 'Jun', oee: 84 },
      { label: 'Jul', oee: 87 }, { label: 'Aug', oee: 88 }, { label: 'Sep', oee: 86 },
      { label: 'Oct', oee: 89 }, { label: 'Nov', oee: 88 }, { label: 'Dec', oee: 90 }
    ],

    // 4. Yearly: แสดง 5 ปี (เหมือนเดิม)
    yearly: [
      { label: '2021', oee: 78 }, { label: '2022', oee: 82 },
      { label: '2023', oee: 85 }, { label: '2024', oee: 86 },
      { label: '2025', oee: 88 }
    ]
  };
  
  const demandDataSets = {
    daily: generateDailyData(), // (อันเดิมที่เป็นราย 10 นาที)
    
    // --- แก้ไขตรงนี้ครับ (เปลี่ยนจาก W1-W12 เป็น Mon-Sun) ---
    weekly: [
      { label: 'Mon', actual: 4250, forecast: 4300 },
      { label: 'Tue', actual: 4400, forecast: 4350 },
      { label: 'Wed', actual: 4150, forecast: 4200 },
      { label: 'Thu', actual: 4600, forecast: 4550 },
      { label: 'Fri', actual: 4850, forecast: 4900 },
      { label: 'Sat', actual: 3800, forecast: 3900 }, // วันเสาร์ลดลง
      { label: 'Sun', actual: 3500, forecast: 3600 }  // วันอาทิตย์ต่ำสุด
    ],
    // ----------------------------------------------------

    monthly: [ // (เหมือนเดิม)
      { label: 'Jan', actual: 850, forecast: 860 }, { label: 'Feb', actual: 920, forecast: 910 },
      { label: 'Mar', actual: 880, forecast: 890 }, { label: 'Apr', actual: 1050, forecast: 1040 },
      { label: 'May', actual: 1100, forecast: 1120 }, { label: 'Jun', actual: 1080, forecast: 1090 },
      { label: 'Jul', actual: 0, forecast: 1150 }, { label: 'Aug', actual: 0, forecast: 1200 },
      { label: 'Sep', actual: 0, forecast: 1180 }, { label: 'Oct', actual: 0, forecast: 1250 }
    ],
    yearly: [ // (เหมือนเดิม)
      { label: '2021', actual: 12000, forecast: 11800 }, { label: '2022', actual: 14500, forecast: 14200 },
      { label: '2023', actual: 16800, forecast: 17000 }, { label: '2024', actual: 18500, forecast: 18200 },
      { label: '2025', actual: 0, forecast: 21000 }
    ]
  };

  // Translation object
  const t = {
    th: {
      title: 'ระบบผลิตอัจฉริยะ',
      subtitle: 'แพลตฟอร์มวิเคราะห์ข้อมูลเชิงคาดการณ์',
      notifications: 'การแจ้งเตือน',
      markAllRead: 'ทำเครื่องหมายอ่านทั้งหมด',
      viewAll: 'ดูทั้งหมด',
      profile: 'โปรไฟล์',
      settings: 'ตั้งค่า',
      security: 'ความปลอดภัย',
      apiDocs: 'เอกสาร API',
      logout: 'ออกจากระบบ',
      language: 'ภาษา',
      themeMode: 'โหมดธีม',
      light: 'สว่าง',
      dark: 'มืด',
      overview: 'ภาพรวม',
      demandForecasting: 'พยากรณ์ความต้องการ',
      productionPlanning: 'วางแผนการผลิต',
      predictiveMaintenance: 'การบำรุงรักษาเชิงคาดการณ์',
      overallOEE: 'OEE รวม',
      forecastAccuracy: 'ความแม่นยำการพยากรณ์',
      activeMachines: 'เครื่องจักรที่ทำงาน',
      criticalAlerts: 'การแจ้งเตือนสำคัญ',
      underMaintenance: 'อยู่ระหว่างบำรุงรักษา',
      newToday: 'ใหม่วันนี้',
      weeklyProduction: 'ประสิทธิภาพการผลิตรายสัปดาห์',
      demandTrend: 'แนวโน้มและการพยากรณ์ความต้องการ',
      recentAlerts: 'การแจ้งเตือนล่าสุด',
      machineHealth: 'สถานะสุขภาพเครื่องจักร',
      healthScore: 'คะแนนสุขภาพ',
      rul: 'อายุการใช้งานคงเหลือ',
      days: 'วัน',
      good: 'ดี',
      warning: 'เตือน',
      critical: 'วิกฤต',
      generateForecast: 'สร้างการพยากรณ์ใหม่',
      runAnalysis: 'วิเคราะห์',
      optimizeSchedule: 'ปรับปรุงตารางการผลิต',
      cancel: 'ยกเลิก',
      processing: 'กำลังประมวลผล...',
      success: 'สำเร็จ!',
      aiDriven: 'การตรวจสอบสุขภาพอุปกรณ์และพยากรณ์ความเสียหายด้วย AI',
      failureProbability: 'โอกาสความเสียหาย (30วัน)',
      lastMaintenance: 'บำรุงรักษาล่าสุด',
      scheduleUrgent: 'กำหนดการบำรุงรักษาเร่งด่วน',
      scheduleInspection: 'กำหนดการตรวจสอบ',
      viewDetails: 'ดูรายละเอียด',
      daysAgo: 'วันที่แล้ว',
      machineType: 'ประเภทเครื่องจักร',
      installDate: 'วันที่ติดตั้ง',
      operatingHours: 'ชั่วโมงการทำงาน',
      maintenanceHistory: 'ประวัติการบำรุงรักษา',
      sensorData: 'ข้อมูลเซ็นเซอร์',
      temperature: 'อุณหภูมิ',
      vibration: 'การสั่นสะเทือน',
      pressure: 'แรงดัน',
      speed: 'ความเร็ว',
      normal: 'ปกติ',
      high: 'สูง',
      recommendations: 'คำแนะนำ',
      scheduleMaintenance: 'กำหนดการบำรุงรักษา',
      exportReport: 'ส่งออกรายงาน',
      close: 'ปิด',
      scheduleTitle: 'กำหนดการบำรุงรักษา',
      urgentMaintenance: 'บำรุงรักษาเร่งด่วน',
      routineInspection: 'ตรวจสอบตามปกติ',
      selectDate: 'เลือกวันที่',
      selectTime: 'เลือกเวลา',
      assignTechnician: 'มอบหมายช่าง',
      selectTechnician: 'เลือกช่างผู้รับผิดชอบ',
      priority: 'ลำดับความสำคัญ',
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      additionalNotes: 'บันทึกเพิ่มเติม',
      notesPlaceholder: 'ระบุรายละเอียดเพิ่มเติม อาการที่พบ หรือคำขอพิเศษ...',
      confirmSchedule: 'ยืนยันการนัดหมาย',
      scheduleSuccess: 'นัดหมายสำเร็จ!',
      scheduleSuccessMessage: 'การนัดหมายได้ถูกบันทึกและแจ้งเตือนช่างเรียบร้อยแล้ว',
      allAlerts: 'การแจ้งเตือนทั้งหมด',
      filterAlerts: 'กรองการแจ้งเตือน',
      all: 'ทั้งหมด',
      unread: 'ยังไม่อ่าน',
      read: 'อ่านแล้ว',
      searchAlerts: 'ค้นหาการแจ้งเตือน...',
      deleteAlert: 'ลบ',
      deleteAll: 'ลบทั้งหมด',
      noAlertsFound: 'ไม่พบการแจ้งเตือน',
      severity: 'ความสำคัญ',
      machine: 'เครื่องจักร',
      message: 'ข้อความ',
      time: 'เวลา',
      action: 'การดำเนินการ',
      alertDeleted: 'ลบการแจ้งเตือนแล้ว',
    },
    en: {
      title: 'Smart Manufacturing AI',
      subtitle: 'Predictive Analytics Platform',
      notifications: 'Notifications',
      markAllRead: 'Mark all as read',
      viewAll: 'View All',
      profile: 'My Profile',
      settings: 'Settings',
      security: 'Security',
      apiDocs: 'API Documentation',
      logout: 'Logout',
      language: 'Language',
      themeMode: 'Theme Mode',
      light: 'Light',
      dark: 'Dark',
      overview: 'Overview',
      demandForecasting: 'Demand Forecasting',
      productionPlanning: 'Production Planning',
      predictiveMaintenance: 'Predictive Maintenance',
      overallOEE: 'Overall OEE',
      forecastAccuracy: 'Forecast Accuracy',
      activeMachines: 'Active Machines',
      criticalAlerts: 'Critical Alerts',
      underMaintenance: 'under maintenance',
      newToday: 'new today',
      weeklyProduction: 'Production Efficiency',
      demandTrend: 'Demand Trend & Forecast',
      recentAlerts: 'Recent Alerts',
      machineHealth: 'Machine Health Status',
      healthScore: 'Health Score',
      rul: 'RUL',
      days: 'days',
      good: 'good',
      warning: 'warning',
      critical: 'critical',
      generateForecast: 'Generate New Forecast',
      runAnalysis: 'Run Analysis',
      optimizeSchedule: 'Optimize Schedule',
      cancel: 'Cancel',
      processing: 'Processing...',
      success: 'Success!',
      aiDriven: 'AI-driven equipment health monitoring and failure prediction',
      failureProbability: 'Failure Probability (30d)',
      lastMaintenance: 'Last Maintenance',
      scheduleUrgent: 'Schedule Urgent Maintenance',
      scheduleInspection: 'Schedule Inspection',
      viewDetails: 'View Details',
      daysAgo: 'days ago',
      machineType: 'Machine Type',
      installDate: 'Install Date',
      operatingHours: 'Operating Hours',
      maintenanceHistory: 'Maintenance History',
      sensorData: 'Sensor Data',
      temperature: 'Temperature',
      vibration: 'Vibration',
      pressure: 'Pressure',
      speed: 'Speed',
      normal: 'Normal',
      high: 'High',
      recommendations: 'Recommendations',
      scheduleMaintenance: 'Schedule Maintenance',
      exportReport: 'Export Report',
      close: 'Close',
      scheduleTitle: 'Schedule Maintenance',
      urgentMaintenance: 'Urgent Maintenance',
      routineInspection: 'Routine Inspection',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      assignTechnician: 'Assign Technician',
      selectTechnician: 'Select responsible technician',
      priority: 'Priority',
      low: 'Low',
      medium: 'Medium',
      additionalNotes: 'Additional Notes',
      notesPlaceholder: 'Specify details, symptoms found, or special requests...',
      confirmSchedule: 'Confirm Schedule',
      scheduleSuccess: 'Schedule Successful!',
      scheduleSuccessMessage: 'Appointment has been recorded and technician notified successfully',
      allAlerts: 'All Alerts',
      filterAlerts: 'Filter Alerts',
      all: 'All',
      unread: 'Unread',
      read: 'Read',
      searchAlerts: 'Search alerts...',
      deleteAlert: 'Delete',
      deleteAll: 'Delete All',
      noAlertsFound: 'No alerts found',
      severity: 'Severity',
      machine: 'Machine',
      message: 'Message',
      time: 'Time',
      action: 'Action',
      alertDeleted: 'Alert deleted',
    }
  };

  const currentLang = t[language];

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', machine: 'Inverter101', message: 'Health score dropped to 65%', time: '10 mins ago', severity: 'high', read: false },
    { id: 2, type: 'info', machine: 'Inverter103', message: 'Maintenance scheduled', time: '1 hour ago', severity: 'medium', read: false },
    { id: 3, type: 'critical', machine: 'Irradiation201', message: 'Anomaly detected in vibration', time: '25 mins ago', severity: 'critical', read: false },
    { id: 4, type: 'info', machine: 'System', message: 'Model v1.2.3 deployed successfully', time: '2 hours ago', severity: 'low', read: true },
    { id: 5, type: 'warning', machine: 'Inverter102', message: 'Temperature above normal', time: '3 hours ago', severity: 'medium', read: true },
    { id: 6, type: 'critical', machine: 'Irradiation101', message: 'Pressure sensor malfunction detected', time: '4 hours ago', severity: 'critical', read: true },
    { id: 7, type: 'info', machine: 'Inverter104', message: 'Routine inspection completed', time: '5 hours ago', severity: 'low', read: true },
    { id: 8, type: 'warning', machine: 'Inverter101', message: 'Vibration levels increasing', time: '6 hours ago', severity: 'high', read: true },
    { id: 9, type: 'info', machine: 'System', message: 'Daily backup completed', time: '8 hours ago', severity: 'low', read: true },
    { id: 10, type: 'warning', machine: 'Irradiation201', message: 'Hydraulic fluid low', time: '10 hours ago', severity: 'medium', read: true },
    { id: 11, type: 'critical', machine: 'Inverter103', message: 'Motor overheating', time: '12 hours ago', severity: 'critical', read: true },
    { id: 12, type: 'info', machine: 'Inverter102', message: 'Calibration successful', time: '1 day ago', severity: 'low', read: true },
    { id: 13, type: 'warning', machine: 'Irradiation101', message: 'Belt tension adjustment needed', time: '1 day ago', severity: 'medium', read: true },
    { id: 14, type: 'info', machine: 'System', message: 'Security patch applied', time: '2 days ago', severity: 'low', read: true },
    { id: 15, type: 'warning', machine: 'Inverter101', message: 'Coolant level low', time: '2 days ago', severity: 'medium', read: true },
  ]);

  const [forecastParams, setForecastParams] = useState({
    horizon: 90,
    products: ['PROD-001', 'PROD-002'],
    includeConfidence: true,
    confidenceLevel: 0.95
  });

  const [planningParams, setPlanningParams] = useState({
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    objective: 'minimize_cost',
    constraints: 'standard'
  });

  // ข้อมูล Demand Forecasting
  const demandData = [
    { month: 'Jan', actual: 850, forecast: 0, lower: 0, upper: 0 },
    { month: 'Feb', actual: 920, forecast: 0, lower: 0, upper: 0 },
    { month: 'Mar', actual: 880, forecast: 0, lower: 0, upper: 0 },
    { month: 'Apr', actual: 1050, forecast: 0, lower: 0, upper: 0 },
    { month: 'May', actual: 1100, forecast: 0, lower: 0, upper: 0 },
    { month: 'Jun', actual: 1080, forecast: 0, lower: 0, upper: 0 },
    { month: 'Jul', actual: 0, forecast: 1150, lower: 1050, upper: 1250 },
    { month: 'Aug', actual: 0, forecast: 1200, lower: 1100, upper: 1300 },
    { month: 'Sep', actual: 0, forecast: 1180, lower: 1080, upper: 1280 },
    { month: 'Oct', actual: 0, forecast: 1250, lower: 1150, upper: 1350 },
  ];

  // ข้อมูล Production Efficiency
  const productionData = [
    { day: 'Mon', oee: 85, availability: 92, performance: 88, quality: 98 },
    { day: 'Tue', oee: 87, availability: 94, performance: 90, quality: 97 },
    { day: 'Wed', oee: 82, availability: 88, performance: 92, quality: 96 },
    { day: 'Thu', oee: 89, availability: 95, performance: 91, quality: 98 },
    { day: 'Fri', oee: 86, availability: 91, performance: 89, quality: 97 },
    { day: 'Sat', oee: 84, availability: 90, performance: 87, quality: 96 },
    { day: 'Sun', oee: 88, availability: 93, performance: 90, quality: 98 },
  ];

  // ข้อมูล Machine Health
  const machineHealth = [
    { 
      name: 'Inverter101', 
      health: 65, 
      status: 'warning', 
      rul: 45,
      type: 'Solar Inverter',
      installDate: '2020-03-15',
      operatingHours: 18500,
      lastMaintenance: '45 days ago',
      sensors: {
        temperature: { value: 75, unit: '°C', status: 'high' },
        vibration: { value: 8.5, unit: 'mm/s', status: 'high' },
        pressure: { value: 5.2, unit: 'bar', status: 'normal' },
        speed: { value: 2400, unit: 'rpm', status: 'normal' }
      },
      maintenanceHistory: [
        { date: '2024-05-20', type: 'Routine Inspection', cost: 1200 },
        { date: '2024-03-10', type: 'Belt Replacement', cost: 3500 },
        { date: '2024-01-05', type: 'Lubrication', cost: 800 }
      ]
    },
    { 
      name: 'Inverter102', 
      health: 92, 
      status: 'good', 
      rul: 120,
      type: 'Solar Inverter',
      installDate: '2021-08-22',
      operatingHours: 12300,
      lastMaintenance: '15 days ago',
      sensors: {
        temperature: { value: 62, unit: '°C', status: 'normal' },
        vibration: { value: 4.2, unit: 'mm/s', status: 'normal' },
        pressure: { value: 5.0, unit: 'bar', status: 'normal' },
        speed: { value: 2350, unit: 'rpm', status: 'normal' }
      },
      maintenanceHistory: [
        { date: '2024-06-20', type: 'Routine Inspection', cost: 1200 },
        { date: '2024-04-12', type: 'Calibration', cost: 2100 }
      ]
    },
    { 
      name: 'Irradiation101', 
      health: 88, 
      status: 'good', 
      rul: 95,
      type: 'Irradiation Sensor',
      installDate: '2019-11-10',
      operatingHours: 22100,
      lastMaintenance: '20 days ago',
      sensors: {
        temperature: { value: 68, unit: '°C', status: 'normal' },
        vibration: { value: 5.8, unit: 'mm/s', status: 'normal' },
        pressure: { value: 8.5, unit: 'bar', status: 'normal' },
        speed: { value: 1800, unit: 'rpm', status: 'normal' }
      },
      maintenanceHistory: [
        { date: '2024-06-15', type: 'Oil Change', cost: 1800 },
        { date: '2024-04-01', type: 'Seal Replacement', cost: 4200 }
      ]
    },
    { 
      name: 'Irradiation201', 
      health: 58, 
      status: 'critical', 
      rul: 25,
      type: 'Irradiation Sensor',
      installDate: '2018-05-20',
      operatingHours: 28900,
      lastMaintenance: '60 days ago',
      sensors: {
        temperature: { value: 82, unit: '°C', status: 'high' },
        vibration: { value: 12.3, unit: 'mm/s', status: 'high' },
        pressure: { value: 7.8, unit: 'bar', status: 'high' },
        speed: { value: 1650, unit: 'rpm', status: 'normal' }
      },
      maintenanceHistory: [
        { date: '2024-05-05', type: 'Emergency Repair', cost: 5600 },
        { date: '2024-02-18', type: 'Routine Inspection', cost: 1200 }
      ]
    },
    { 
      name: 'Inverter103', 
      health: 85, 
      status: 'good', 
      rul: 80,
      type: 'Solar Inverter',
      installDate: '2020-09-14',
      operatingHours: 16200,
      lastMaintenance: '25 days ago',
      sensors: {
        temperature: { value: 58, unit: '°C', status: 'normal' },
        vibration: { value: 3.1, unit: 'mm/s', status: 'normal' },
        pressure: { value: 6.2, unit: 'bar', status: 'normal' },
        speed: { value: 3200, unit: 'rpm', status: 'normal' }
      },
      maintenanceHistory: [
        { date: '2024-06-10', type: 'Software Update', cost: 800 },
        { date: '2024-05-01', type: 'Calibration', cost: 1500 }
      ]
    },
    { 
      name: 'Inverter104', 
      health: 78, 
      status: 'warning', 
      rul: 60,
      type: 'Solar Inverter',
      installDate: '2020-09-14',
      operatingHours: 16800,
      lastMaintenance: '30 days ago',
      sensors: {
        temperature: { value: 71, unit: '°C', status: 'high' },
        vibration: { value: 6.7, unit: 'mm/s', status: 'normal' },
        pressure: { value: 6.5, unit: 'bar', status: 'normal' },
        speed: { value: 3150, unit: 'rpm', status: 'normal' }
      },
      maintenanceHistory: [
        { date: '2024-06-05', type: 'Routine Inspection', cost: 1200 },
        { date: '2024-03-22', type: 'Motor Replacement', cost: 6800 }
      ]
    },
  ];

  const kpiCards = [
    { title: 'Overall OEE', value: '86.2%', change: '+2.3%', trend: 'up', icon: Activity, color: 'blue' },
    { title: 'Forecast Accuracy', value: '91.5%', change: '+5.1%', trend: 'up', icon: TrendingUp, color: 'green' },
    { title: 'Active Machines', value: '24/26', change: '2 under maintenance', trend: 'neutral', icon: Factory, color: 'purple' },
    { title: 'Critical Alerts', value: '3', change: '2 new today', trend: 'down', icon: AlertTriangle, color: 'red' },
  ];

  const unreadCount = alerts.filter(a => !a.read).length;

  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  const markAsRead = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    setSuccessMessage(currentLang.alertDeleted);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const deleteAllAlerts = () => {
    if (confirm(language === 'th' ? 'ต้องการลบการแจ้งเตือนทั้งหมดหรือไม่?' : 'Delete all alerts?')) {
      setAlerts([]);
      setSuccessMessage(language === 'th' ? 'ลบการแจ้งเตือนทั้งหมดแล้ว' : 'All alerts deleted');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchFilter = 
      alertFilter === 'all' ? true :
      alertFilter === 'unread' ? !alert.read :
      alertFilter === 'read' ? alert.read :
      alert.severity === alertFilter;
    
    const matchSearch = 
      alertSearch === '' ? true :
      alert.machine.toLowerCase().includes(alertSearch.toLowerCase()) ||
      alert.message.toLowerCase().includes(alertSearch.toLowerCase());
    
    return matchFilter && matchSearch;
  });

  // Generate Forecast Function
  const handleGenerateForecast = async () => {
    setShowForecastModal(false);
    setIsProcessing(true);
    setProcessingMessage('Generating demand forecast...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    setSuccessMessage(`Forecast generated successfully! Horizon: ${forecastParams.horizon} days, MAPE: 8.3%`);
    setShowSuccessMessage(true);
    
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Optimize Schedule Function
  const handleOptimizeSchedule = async () => {
    setShowPlanningModal(false);
    setIsProcessing(true);
    setProcessingMessage('Optimizing production schedule...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    setIsProcessing(false);
    setSuccessMessage('Production schedule optimized! Total cost: $125,000, Utilization: 87%');
    setShowSuccessMessage(true);
    
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Run Analysis Function
  const handleRunAnalysis = async () => {
    setShowAnalysisModal(false);
    setIsProcessing(true);
    setProcessingMessage('Running predictive maintenance analysis...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    setIsProcessing(false);
    setSuccessMessage('Analysis completed! 2 machines require attention within 30 days');
    setShowSuccessMessage(true);
    
    // Add new alert
    const newAlert = {
      id: Date.now(),
      type: 'warning',
      machine: 'CNC-001',
      message: 'Analysis complete: Inspection recommended within 14 days',
      time: 'Just now',
      severity: 'high',
      read: false
    };
    setAlerts([newAlert, ...alerts]);
    
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleLogout = () => {
    // เรียกใช้ฟังก์ชัน onLogout เพื่อแจ้งให้ App รู้ว่าต้องการออกจากระบบ
    if (onLogout) {
      onLogout();
    }
  };

  const handleOpenSchedule = (machine, type) => {
    setSelectedMachine(machine);
    setScheduleType(type);
    setShowScheduleModal(true);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleForm({
      ...scheduleForm,
      date: tomorrow.toISOString().split('T')[0],
      priority: type === 'urgent' ? 'high' : 'medium'
    });
  };

  const handleScheduleSubmit = async () => {
    setShowScheduleModal(false);
    setIsProcessing(true);
    setProcessingMessage(currentLang.processing);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setSuccessMessage(`${currentLang.scheduleSuccessMessage} - ${selectedMachine.name} on ${scheduleForm.date}`);
    setShowSuccessMessage(true);
    
    // Add notification
    const newAlert = {
      id: Date.now(),
      type: 'info',
      machine: selectedMachine.name,
      message: `${scheduleType === 'urgent' ? currentLang.urgentMaintenance : currentLang.routineInspection} ${language === 'th' ? 'นัดหมายแล้ว' : 'scheduled'} - ${scheduleForm.date}`,
      time: language === 'th' ? 'เมื่อสักครู่' : 'Just now',
      severity: scheduleType === 'urgent' ? 'high' : 'medium',
      read: false
    };
    setAlerts([newAlert, ...alerts]);
    
    setTimeout(() => setShowSuccessMessage(false), 5000);
    
    // Reset form
    setScheduleForm({
      date: '',
      time: '',
      technician: '',
      priority: 'medium',
      notes: ''
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b shadow-sm sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.title}</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{currentLang.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <Bell className="w-6 h-6 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-96 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-lg shadow-xl border z-50`}>
                    <div className={`p-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex items-center justify-between`}>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.notifications}</h3>
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {currentLang.markAllRead}
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.slice(0, 5).map((alert) => (
                        <div 
                          key={alert.id}
                          onClick={() => markAsRead(alert.id)}
                          className={`p-4 ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'} border-b cursor-pointer transition ${
                            !alert.read ? (theme === 'dark' ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50') : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {getSeverityIcon(alert.severity)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{alert.machine}</p>
                                {!alert.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} mt-1`}>{alert.message}</p>
                              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mt-1`}>{alert.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`p-3 text-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t`}>
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          setShowAllAlerts(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {currentLang.viewAll}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-2 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} px-4 py-2 rounded-lg transition`}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Admin User</span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-64 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-lg shadow-xl border z-50`}>
                    <div className={`p-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b`}>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Admin User</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>admin@smartmfg.com</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Super Admin
                      </span>
                    </div>
                    <div className="py-2">
                      <button className={`w-full px-4 py-2 text-left text-sm ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'} flex items-center space-x-2`}>
                        <User className="w-4 h-4" />
                        <span>{currentLang.profile}</span>
                      </button>
                      <button className={`w-full px-4 py-2 text-left text-sm ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'} flex items-center space-x-2`}>
                        <Settings className="w-4 h-4" />
                        <span>{currentLang.settings}</span>
                      </button>
                      <button className={`w-full px-4 py-2 text-left text-sm ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'} flex items-center space-x-2`}>
                        <Shield className="w-4 h-4" />
                        <span>{currentLang.security}</span>
                      </button>
                      <button className={`w-full px-4 py-2 text-left text-sm ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'} flex items-center space-x-2`}>
                        <FileText className="w-4 h-4" />
                        <span>{currentLang.apiDocs}</span>
                      </button>
                      
                      {/* Language Selector */}
                      <div className={`px-4 py-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t mt-2 pt-2`}>
                        <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} block mb-2`}>
                          {currentLang.language}
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setLanguage('th')}
                            className={`flex-1 px-3 py-1 text-xs rounded ${
                              language === 'th'
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark' 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            ไทย
                          </button>
                          <button
                            onClick={() => setLanguage('en')}
                            className={`flex-1 px-3 py-1 text-xs rounded ${
                              language === 'en'
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark' 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            EN
                          </button>
                        </div>
                      </div>

                      {/* Theme Selector */}
                      <div className={`px-4 py-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t`}>
                        <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} block mb-2`}>
                          {currentLang.themeMode}
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 px-3 py-1 text-xs rounded flex items-center justify-center gap-1 ${
                              theme === 'light'
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark' 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            ☀️ {currentLang.light}
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 px-3 py-1 text-xs rounded flex items-center justify-center gap-1 ${
                              theme === 'dark'
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark' 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            🌙 {currentLang.dark}
                          </button>
                        </div>
                      </div>

                      <div className={`${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t mt-2 pt-2`}>
                        <button 
                          onClick={handleLogout}
                          className={`w-full px-4 py-2 text-left text-sm text-red-600 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-red-50'} flex items-center space-x-2`}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{currentLang.logout}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl`}>
            <div className="flex flex-col items-center space-y-4">
              <Loader className="w-16 h-16 text-blue-600 animate-spin" />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.processing}</h3>
              <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} text-center`}>{processingMessage}</p>
              <div className={`w-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-2 overflow-hidden`}>
                <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">{successMessage}</p>
            </div>
            <button 
              onClick={() => setShowSuccessMessage(false)}
              className="ml-4 hover:bg-green-600 rounded p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Forecast Modal */}
      {showForecastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-2xl w-full shadow-2xl`}>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.generateForecast}</h2>
              <button 
                onClick={() => setShowForecastModal(false)}
                className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  {language === 'th' ? 'ระยะเวลาการพยากรณ์ (วัน)' : 'Forecast Horizon (Days)'}
                </label>
                <input
                  type="number"
                  value={forecastParams.horizon}
                  onChange={(e) => setForecastParams({...forecastParams, horizon: parseInt(e.target.value)})}
                  className={`w-full px-4 py-2 border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  min="7"
                  max="365"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  {language === 'th' ? 'สินค้า' : 'Products'}
                </label>
                <div className="space-y-2">
                  {['PROD-001', 'PROD-002', 'PROD-003'].map(prod => (
                    <label key={prod} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={forecastParams.products.includes(prod)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForecastParams({...forecastParams, products: [...forecastParams.products, prod]});
                          } else {
                            setForecastParams({...forecastParams, products: forecastParams.products.filter(p => p !== prod)});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{prod}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  {language === 'th' ? 'ระดับความเชื่อมั่น' : 'Confidence Level'}
                </label>
                <select
                  value={forecastParams.confidenceLevel}
                  onChange={(e) => setForecastParams({...forecastParams, confidenceLevel: parseFloat(e.target.value)})}
                  className={`w-full px-4 py-2 border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="0.90">90%</option>
                  <option value="0.95">95%</option>
                  <option value="0.99">99%</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={forecastParams.includeConfidence}
                  onChange={(e) => setForecastParams({...forecastParams, includeConfidence: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'th' ? 'รวมช่วงความเชื่อมั่น' : 'Include confidence intervals'}
                </label>
              </div>
            </div>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t flex justify-end space-x-3`}>
              <button
                onClick={() => setShowForecastModal(false)}
                className={`px-6 py-2 border ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'} rounded-lg transition`}
              >
                {currentLang.cancel}
              </button>
              <button
                onClick={handleGenerateForecast}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                {currentLang.generateForecast}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Optimize Production Schedule</h2>
              <button 
                onClick={() => setShowPlanningModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={planningParams.startDate}
                    onChange={(e) => setPlanningParams({...planningParams, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={planningParams.endDate}
                    onChange={(e) => setPlanningParams({...planningParams, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Optimization Objective
                </label>
                <select
                  value={planningParams.objective}
                  onChange={(e) => setPlanningParams({...planningParams, objective: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="minimize_cost">Minimize Production Cost</option>
                  <option value="maximize_utilization">Maximize Machine Utilization</option>
                  <option value="minimize_inventory">Minimize Inventory Holding</option>
                  <option value="maximize_delivery">Maximize On-Time Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Constraints Profile
                </label>
                <select
                  value={planningParams.constraints}
                  onChange={(e) => setPlanningParams({...planningParams, constraints: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="standard">Standard Constraints</option>
                  <option value="aggressive">Aggressive (Higher Utilization)</option>
                  <option value="conservative">Conservative (More Buffers)</option>
                  <option value="custom">Custom Configuration</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Optimization may take 3-5 minutes depending on complexity.
                  You'll receive a notification when complete.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPlanningModal(false)}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOptimizeSchedule}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Start Optimization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Run Predictive Analysis</h2>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Analysis Type
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'full', label: 'Full System Analysis (All Machines)', time: '~4 min' },
                    { id: 'critical', label: 'Critical Machines Only', time: '~2 min' },
                    { id: 'custom', label: 'Custom Selection', time: 'Variable' }
                  ].map(type => (
                    <label key={type.id} className="flex items-center justify-between p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input type="radio" name="analysisType" defaultChecked={type.id === 'full'} className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-700">{type.label}</span>
                      </div>
                      <span className="text-sm text-slate-500">{type.time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prediction Horizon
                </label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="7">Next 7 days</option>
                  <option value="14">Next 14 days</option>
                  <option value="30">Next 30 days</option>
                  <option value="90">Next 90 days</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Analysis Options
                </label>
                {[
                  'Include anomaly detection',
                  'Generate maintenance recommendations',
                  'Calculate cost impact',
                  'Export detailed report (PDF)'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAnalysis}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Run Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp },
              { id: 'planning', label: 'Production Planning', icon: Calendar },
              { id: 'maintenance', label: 'Predictive Maintenance', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 ' + (theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50')
                      : (theme === 'dark' ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50')
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">
                    {tab.id === 'overview' ? currentLang.overview :
                     tab.id === 'forecast' ? currentLang.demandForecasting :
                     tab.id === 'planning' ? currentLang.productionPlanning :
                     currentLang.predictiveMaintenance}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="flex flex-col h-[calc(100vh-180px)] gap-4 overflow-hidden">
            {/* --- ส่วนที่ 1: KPI Cards --- */}
            <div className="flex-none grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi, idx) => {
                const Icon = kpi.icon;
                const bgColors = {
                  blue: theme === 'dark' ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50',
                  green: theme === 'dark' ? 'bg-green-900 bg-opacity-30' : 'bg-green-50',
                  purple: theme === 'dark' ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50',
                  red: theme === 'dark' ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'
                };
                const iconColors = {
                  blue: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
                  green: theme === 'dark' ? 'text-green-400' : 'text-green-600',
                  purple: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
                  red: theme === 'dark' ? 'text-red-400' : 'text-red-600'
                };
                return (
                  <div key={idx} className={`${bgColors[kpi.color]} rounded-xl p-4 flex items-center justify-between shadow-sm border border-transparent hover:border-slate-200 transition-all`}>
                    <div className="flex flex-col justify-center">
                      <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide`}>
                        {kpi.title === 'Overall OEE' ? currentLang.overallOEE :
                         kpi.title === 'Forecast Accuracy' ? currentLang.forecastAccuracy :
                         kpi.title === 'Active Machines' ? currentLang.activeMachines :
                         currentLang.criticalAlerts}
                      </p>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mt-1`}>{kpi.value}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                        <Icon className={`w-5 h-5 ${iconColors[kpi.color]}`} />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 
                        kpi.trend === 'down' ? 'bg-red-100 text-red-700' : 
                        theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- ส่วนที่ 2: Main Content Grid --- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
              
              {/* คอลัมน์ซ้าย: กราฟ */}
              <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
                
                {/* 1. กราฟบน: Production Efficiency (OEE) */}
                <div className={`flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-4 flex flex-col min-h-0`}>
                  <div className="flex justify-between items-center mb-2 flex-none">
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.weeklyProduction}</h3>
                    {/* ปุ่มเลือกช่วงเวลา Production */}
                    <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
                      {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setProductionPeriod(period)}
                          className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                            productionPeriod === period
                              ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200')
                              : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                          }`}
                        >
                          {period === 'daily' ? (language === 'th' ? 'วัน' : 'Day') :
                           period === 'weekly' ? (language === 'th' ? 'สัปดาห์' : 'Week') :
                           period === 'monthly' ? (language === 'th' ? 'เดือน' : 'Month') :
                           (language === 'th' ? 'ปี' : 'Year')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionDataSets[productionPeriod]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 11}} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4}}
                        />
                        <Bar dataKey="oee" fill="#3b82f6" name="OEE %" radius={[4, 4, 0, 0]} barSize={productionPeriod === 'yearly' ? 60 : 40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. กราฟล่าง: Demand Trend (วางทับจุดนี้) */}
                <div className={`flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-4 flex flex-col min-h-0`}>
                  <div className="flex justify-between items-center mb-2 flex-none">
                    <div className="flex items-center gap-4">
                      {/* จุดสังเกต: บรรทัดนี้ครับที่ให้ค้นหา */}
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.demandTrend}</h3>
                    </div>
                    
                    {/* ส่วนปุ่มเลือกช่วงเวลา (แก้ไขสีให้ถูกต้องแล้ว) */}
                    <div className="flex items-center gap-3">
                      <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
                        {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                          <button
                            key={period}
                            onClick={() => setDemandPeriod(period)}
                            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                              demandPeriod === period
                                ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200')
                                : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                            }`}
                          >
                            {period === 'daily' ? (language === 'th' ? 'วัน' : 'Day') :
                             period === 'weekly' ? (language === 'th' ? 'สัปดาห์' : 'Week') :
                             period === 'monthly' ? (language === 'th' ? 'เดือน' : 'Month') :
                             (language === 'th' ? 'ปี' : 'Year')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* พื้นที่กราฟ */}
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandDataSets[demandPeriod]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }} 
                        />
                        <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual" connectNulls />
                        <Area type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" name="Forecast" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* คอลัมน์ขวา: รายการแจ้งเตือน & เครื่องจักร (คงเดิม) */}
              <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
                {/* 1. Alerts List */}
                <div className={`flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border flex flex-col min-h-0 overflow-hidden`}>
                  <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'} flex-none flex justify-between items-center bg-opacity-50`}>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded-md">
                        <Bell className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.recentAlerts}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{unreadCount} new</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`group p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 hover:border-slate-500' : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-sm'} transition-all cursor-pointer relative overflow-hidden`}
                        onClick={() => {markAsRead(alert.id); setShowAllAlerts(true);}}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                           alert.severity === 'critical' ? 'bg-red-500' : 
                           alert.severity === 'high' ? 'bg-orange-500' : 
                           alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="pl-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{alert.machine}</span>
                            <span className="text-[10px] text-slate-400">{alert.time}</span>
                          </div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} line-clamp-2 leading-relaxed`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Machine Health List */}
                <div className={`flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border flex flex-col min-h-0 overflow-hidden`}>
                  <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'} flex-none flex items-center gap-2`}>
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.machineHealth}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {machineHealth.map((machine, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm hover:border-blue-200'} transition cursor-pointer`}
                        onClick={() => {setSelectedMachine(machine); setShowMachineDetail(true);}}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-8 h-8 flex-none flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-200'}`} />
                              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" 
                                strokeDasharray={88} 
                                strokeDashoffset={88 - (88 * machine.health) / 100}
                                className={`${machine.health >= 80 ? 'text-green-500' : machine.health >= 60 ? 'text-yellow-500' : 'text-red-500'}`} 
                              />
                            </svg>
                            <span className="absolute text-[8px] font-bold">{machine.health}</span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>{machine.name}</p>
                            <p className="text-[10px] text-slate-400">RUL: {machine.rul} days</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                          machine.status === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 
                          machine.status === 'warning' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {machine.status === 'critical' ? 'CRIT' : machine.status === 'warning' ? 'WARN' : 'GOOD'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.demandForecasting}</h2>
                  <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                    {language === 'th' ? 'การพยากรณ์ความต้องการด้วย AI สำหรับ 90 วันข้างหน้า' : 'AI-powered demand prediction for the next 90 days'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowForecastModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  {currentLang.generateForecast}
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className={`${theme === 'dark' ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'} rounded-lg p-4`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                    {language === 'th' ? 'ความแม่นยำการพยากรณ์ (MAPE)' : 'Forecast Accuracy (MAPE)'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'} mt-2`}>8.5%</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'} rounded-lg p-4`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                    {language === 'th' ? 'ความเชื่อมั่นของโมเดล' : 'Model Confidence'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'} mt-2`}>92%</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50'} rounded-lg p-4`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                    {language === 'th' ? 'อัปเดตครั้งถัดไป' : 'Next Update'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'} mt-2`}>
                    3 {language === 'th' ? 'วัน' : 'days'}
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={demandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="upper" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.2} name="Upper Bound" />
                  <Area type="monotone" dataKey="forecast" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Forecast" />
                  <Area type="monotone" dataKey="lower" stroke="#93c5fd" fill="#ffffff" fillOpacity={0.2} name="Lower Bound" />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Actual" />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className={`border ${theme === 'dark' ? 'border-slate-700 bg-slate-750' : 'border-slate-200'} rounded-lg p-4`}>
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'} mb-2`}>
                    {language === 'th' ? 'ข้อมูลโมเดล' : 'Model Information'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {language === 'th' ? 'อัลกอริทึม:' : 'Algorithm:'}
                      </span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>LSTM + Attention</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {language === 'th' ? 'เวอร์ชัน:' : 'Version:'}
                      </span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>v1.2.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {language === 'th' ? 'ฝึกฝนเมื่อ:' : 'Trained:'}
                      </span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>2024-06-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {language === 'th' ? 'ชุดข้อมูล:' : 'Dataset:'}
                      </span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        18 {language === 'th' ? 'เดือน' : 'months history'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`border ${theme === 'dark' ? 'border-slate-700 bg-slate-750' : 'border-slate-200'} rounded-lg p-4`}>
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'} mb-2`}>
                    {language === 'th' ? 'ตัวชี้วัดประสิทธิภาพ' : 'Performance Metrics'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>MAPE:</span>
                      <span className="font-medium text-green-600">8.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>RMSE:</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>45.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>R² Score:</span>
                      <span className="font-medium text-green-600">0.94</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {language === 'th' ? 'เวลาคำนวณ:' : 'Inference Time:'}
                      </span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>234ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.predictiveMaintenance}</h2>
                  <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{currentLang.aiDriven}</p>
                </div>
                <button 
                  onClick={() => setShowAnalysisModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  {currentLang.runAnalysis}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {machineHealth.map((machine, idx) => (
                  <div key={idx} className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                    machine.status === 'critical' ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                    machine.status === 'warning' ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
                    'border-green-300 bg-green-50 hover:bg-green-100'
                  } ${theme === 'dark' && (
                    machine.status === 'critical' ? 'bg-red-900 bg-opacity-20 border-red-700 hover:bg-opacity-30' :
                    machine.status === 'warning' ? 'bg-yellow-900 bg-opacity-20 border-yellow-700 hover:bg-opacity-30' :
                    'bg-green-900 bg-opacity-20 border-green-700 hover:bg-opacity-30'
                  )}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Factory className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} />
                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{machine.name}</h3>
                      </div>
                      {machine.status === 'critical' ? 
                        <XCircle className="w-6 h-6 text-red-600" /> :
                        machine.status === 'warning' ?
                        <AlertTriangle className="w-6 h-6 text-yellow-600" /> :
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      }
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.healthScore}</span>
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{machine.health}%</span>
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

                      <div className={`${theme === 'dark' ? 'bg-slate-700 bg-opacity-50' : 'bg-white'} rounded-lg p-3 space-y-2`}>
                        <div className="flex justify-between text-sm">
                          <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.rul}</span>
                          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{machine.rul} {currentLang.days}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.failureProbability}</span>
                          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {machine.status === 'critical' ? '18%' : machine.status === 'warning' ? '8%' : '2%'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.lastMaintenance}</span>
                          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {machine.lastMaintenance}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (machine.status === 'critical') {
                            handleOpenSchedule(machine, 'urgent');
                          } else if (machine.status === 'warning') {
                            handleOpenSchedule(machine, 'inspection');
                          } else {
                            setSelectedMachine(machine);
                            setShowMachineDetail(true);
                          }
                        }}
                        className={`w-full py-2 rounded-lg font-medium transition ${
                          machine.status === 'critical' ? 'bg-red-600 hover:bg-red-700 text-white' :
                          machine.status === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                          theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}>
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
        )}

        {activeTab === 'planning' && (
          <div className="space-y-6">
            <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.productionPlanning}</h2>
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

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    {language === 'th' ? 'คำสั่งที่วางแผนไว้' : 'Planned Orders'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'} mt-2`}>156</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mt-1`}>
                    {language === 'th' ? '30 วันข้างหน้า' : 'Next 30 days'}
                  </p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                    {language === 'th' ? 'การใช้งานเครื่องจักร' : 'Machine Utilization'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'} mt-2`}>87%</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1`}>
                    {language === 'th' ? 'เฉลี่ยทุกเครื่อง' : 'Average across all'}
                  </p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    {language === 'th' ? 'ต้นทุนรวม' : 'Total Cost'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'} mt-2`}>$125K</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} mt-1`}>
                    {language === 'th' ? 'แผนที่ปรับแล้ว' : 'Optimized plan'}
                  </p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>
                    {language === 'th' ? 'การส่งตรงเวลา' : 'On-Time Delivery'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-orange-200' : 'text-orange-800'} mt-2`}>98%</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} mt-1`}>
                    {language === 'th' ? 'อัตราที่คาดการณ์' : 'Predicted rate'}
                  </p>
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'} rounded-lg p-6 border`}>
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-4`}>
                  {language === 'th' ? 'ตารางสัปดาห์นี้' : 'This Week\'s Schedule'}
                </h3>
                <div className="space-y-3">
                  {[
                    { day: language === 'th' ? 'จันทร์' : 'Monday', orders: 25, machines: ['M1', 'M2', 'M3'], utilization: 89 },
                    { day: language === 'th' ? 'อังคาร' : 'Tuesday', orders: 28, machines: ['M1', 'M2', 'M4'], utilization: 92 },
                    { day: language === 'th' ? 'พุธ' : 'Wednesday', orders: 22, machines: ['M1', 'M3', 'M4'], utilization: 85 },
                    { day: language === 'th' ? 'พฤหัสบดี' : 'Thursday', orders: 30, machines: ['M1', 'M2', 'M3', 'M4'], utilization: 95 },
                    { day: language === 'th' ? 'ศุกร์' : 'Friday', orders: 26, machines: ['M2', 'M3', 'M4'], utilization: 88 },
                  ].map((schedule, idx) => (
                    <div key={idx} className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg p-4 flex items-center justify-between hover:shadow-md transition`}>
                      <div className="flex items-center space-x-4">
                        <div className={`${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} font-bold px-4 py-2 rounded-lg`}>
                          {schedule.day}
                        </div>
                        <div>
                          <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {schedule.orders} {language === 'th' ? 'คำสั่งผลิต' : 'Production Orders'}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {language === 'th' ? 'เครื่องจักร' : 'Machines'}: {schedule.machines.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {language === 'th' ? 'การใช้งาน' : 'Utilization'}
                        </p>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{schedule.utilization}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-t mt-12`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className={`text-center text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            © 2025 Smart Manufacturing AI Platform | Powered by Advanced Predictive Analytics
          </p>
        </div>
      </footer>

      {/* All Alerts Modal */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-6xl w-full shadow-2xl my-8 flex flex-col`} style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            {/* Header */}
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Bell className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {currentLang.allAlerts}
                    </h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {alerts.length} {language === 'th' ? 'รายการ' : 'items'} ({unreadCount} {currentLang.unread.toLowerCase()})
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAllAlerts(false)}
                  className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={currentLang.searchAlerts}
                      value={alertSearch}
                      onChange={(e) => setAlertSearch(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border ${
                        theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'border-slate-300 placeholder-slate-400'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    <Bell className={`absolute left-3 top-2.5 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {['all', 'unread', 'read', 'critical', 'high', 'medium', 'low'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAlertFilter(filter)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                        alertFilter === filter
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {filter === 'all' ? currentLang.all :
                       filter === 'unread' ? currentLang.unread :
                       filter === 'read' ? currentLang.read :
                       filter === 'critical' ? currentLang.critical :
                       filter === 'high' ? currentLang.high :
                       filter === 'medium' ? currentLang.medium :
                       currentLang.low}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={markAllAsRead}
                  className={`px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } rounded-lg text-sm font-medium transition`}
                >
                  {currentLang.markAllRead}
                </button>
                <button
                  onClick={deleteAllAlerts}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                >
                  {currentLang.deleteAll}
                </button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 24rem)' }}>
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className={`w-16 h-16 mx-auto ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} mb-4`} />
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentLang.noAlertsFound}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`${
                        theme === 'dark'
                          ? !alert.read ? 'bg-slate-700' : 'bg-slate-750'
                          : !alert.read ? 'bg-blue-50' : 'bg-white'
                      } border ${
                        theme === 'dark' ? 'border-slate-600' : 'border-slate-200'
                      } rounded-lg p-4 hover:shadow-md transition`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {alert.machine}
                              </span>
                              {!alert.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {alert.severity === 'critical' ? currentLang.critical :
                                 alert.severity === 'high' ? currentLang.high :
                                 alert.severity === 'medium' ? currentLang.medium :
                                 currentLang.low}
                              </span>
                            </div>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} mb-2 break-words`}>
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs flex-wrap">
                              <span className={`flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {alert.time}
                              </span>
                              <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {alert.type === 'critical' ? '🔴 Critical' :
                                 alert.type === 'warning' ? '⚠️ Warning' :
                                 'ℹ️ Info'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!alert.read && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className={`p-2 ${
                                theme === 'dark'
                                  ? 'hover:bg-slate-600 text-slate-400'
                                  : 'hover:bg-slate-100 text-slate-500'
                              } rounded-lg transition`}
                              title={currentLang.markAllRead}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className={`p-2 ${
                              theme === 'dark'
                                ? 'hover:bg-red-900 hover:bg-opacity-20 text-red-400'
                                : 'hover:bg-red-50 text-red-500'
                            } rounded-lg transition`}
                            title={currentLang.deleteAlert}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t flex justify-between items-center`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {language === 'th' ? 'แสดง' : 'Showing'} {filteredAlerts.length} {language === 'th' ? 'จาก' : 'of'} {alerts.length} {language === 'th' ? 'รายการ' : 'items'}
              </p>
              <button
                onClick={() => setShowAllAlerts(false)}
                className={`px-6 py-2 ${
                  theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                } rounded-lg transition font-medium`}
              >
                {currentLang.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-2xl w-full shadow-2xl`}>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex items-center justify-between`}>
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {scheduleType === 'urgent' ? currentLang.urgentMaintenance : currentLang.routineInspection}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                  {selectedMachine.name} - {selectedMachine.type}
                </p>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Alert for urgent */}
              {scheduleType === 'urgent' && (
                <div className={`${theme === 'dark' ? 'bg-red-900 bg-opacity-20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 flex items-start space-x-3`}>
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>
                      {language === 'th' ? 'ต้องดำเนินการเร่งด่วน!' : 'Urgent Action Required!'}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-red-200' : 'text-red-700'} mt-1`}>
                      {language === 'th' 
                        ? 'เครื่องจักรมีความเสี่ยงสูงต่อการเสียหาย แนะนำให้ดำเนินการภายใน 7 วัน'
                        : 'Machine has high risk of failure. Recommended action within 7 days'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    {currentLang.selectDate}
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                    className={`w-full px-4 py-2 border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    {currentLang.selectTime}
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                    className={`w-full px-4 py-2 border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  {currentLang.assignTechnician}
                </label>
                <select
                  value={scheduleForm.technician}
                  onChange={(e) => setScheduleForm({...scheduleForm, technician: e.target.value})}
                  className={`w-full px-4 py-2 border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                >
                  <option value="">{currentLang.selectTechnician}</option>
                  <option value="tech1">{language === 'th' ? 'สมชาย ใจดี - ช่างอาวุโส' : 'John Smith - Senior Technician'}</option>
                  <option value="tech2">{language === 'th' ? 'สมหญิง รักงาน - ช่างชำนาญการ' : 'Jane Doe - Expert Technician'}</option>
                  <option value="tech3">{language === 'th' ? 'สมศักดิ์ ขยัน - หัวหน้าช่าง' : 'Bob Johnson - Chief Technician'}</option>
                  <option value="tech4">{language === 'th' ? 'สมใจ มั่นคง - ช่างไฟฟ้า' : 'Mike Wilson - Electrical Technician'}</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  {currentLang.priority}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setScheduleForm({...scheduleForm, priority: p})}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        scheduleForm.priority === p
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p === 'low' ? currentLang.low : p === 'medium' ? currentLang.medium : currentLang.high}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  {currentLang.additionalNotes}
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                  rows="4"
                  placeholder={currentLang.notesPlaceholder}
                  className={`w-full px-4 py-2 border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Summary */}
              <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}>
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-2`}>
                  {language === 'th' ? 'สรุปการนัดหมาย' : 'Appointment Summary'}
                </h4>
                <div className="space-y-1 text-sm">
                  <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="font-medium">{language === 'th' ? 'เครื่องจักร:' : 'Machine:'}</span> {selectedMachine.name}
                  </p>
                  <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="font-medium">{language === 'th' ? 'ประเภท:' : 'Type:'}</span> {scheduleType === 'urgent' ? currentLang.urgentMaintenance : currentLang.routineInspection}
                  </p>
                  {scheduleForm.date && (
                    <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className="font-medium">{language === 'th' ? 'วันที่:' : 'Date:'}</span> {scheduleForm.date} {scheduleForm.time && `at ${scheduleForm.time}`}
                    </p>
                  )}
                  {scheduleForm.technician && (
                    <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className="font-medium">{language === 'th' ? 'ช่าง:' : 'Technician:'}</span> {scheduleForm.technician === 'tech1' ? (language === 'th' ? 'สมชาย ใจดี' : 'John Smith') :
                       scheduleForm.technician === 'tech2' ? (language === 'th' ? 'สมหญิง รักงาน' : 'Jane Doe') :
                       scheduleForm.technician === 'tech3' ? (language === 'th' ? 'สมศักดิ์ ขยัน' : 'Bob Johnson') :
                       language === 'th' ? 'สมใจ มั่นคง' : 'Mike Wilson'}
                    </p>
                  )}
                  <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="font-medium">{language === 'th' ? 'ลำดับความสำคัญ:' : 'Priority:'}</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                      scheduleForm.priority === 'high' ? 'bg-red-100 text-red-700' :
                      scheduleForm.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {scheduleForm.priority === 'low' ? currentLang.low : 
                       scheduleForm.priority === 'medium' ? currentLang.medium : currentLang.high}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t flex justify-end space-x-3`}>
              <button
                onClick={() => setShowScheduleModal(false)}
                className={`px-6 py-2 border ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'} rounded-lg transition`}
              >
                {currentLang.cancel}
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={!scheduleForm.date || !scheduleForm.time || !scheduleForm.technician}
                className={`px-6 py-2 rounded-lg transition shadow-sm ${
                  !scheduleForm.date || !scheduleForm.time || !scheduleForm.technician
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {currentLang.confirmSchedule}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Detail Modal */}
      {showMachineDetail && selectedMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full shadow-2xl`} style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header - Fixed */}
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center space-x-3">
                <Factory className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedMachine.name}</h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{selectedMachine.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMachineDetail(false)}
                className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-1`}>{currentLang.healthScore}</p>
                  <p className={`text-3xl font-bold ${
                    selectedMachine.health >= 80 ? 'text-green-500' :
                    selectedMachine.health >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>{selectedMachine.health}%</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-1`}>{currentLang.rul}</p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{selectedMachine.rul}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{currentLang.days}</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-1`}>{currentLang.operatingHours}</p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{selectedMachine.operatingHours.toLocaleString()}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>hours</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-1`}>Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedMachine.status === 'critical' ? 'bg-red-100 text-red-700' :
                    selectedMachine.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedMachine.status === 'critical' ? currentLang.critical :
                     selectedMachine.status === 'warning' ? currentLang.warning : currentLang.good}
                  </span>
                </div>
              </div>

              {/* Machine Info */}
              <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}>
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-3`}>Machine Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.machineType}</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedMachine.type}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.installDate}</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedMachine.installDate}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.lastMaintenance}</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedMachine.lastMaintenance}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentLang.failureProbability}</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {selectedMachine.status === 'critical' ? '18%' : 
                       selectedMachine.status === 'warning' ? '8%' : '2%'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sensor Data */}
              <div>
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-3`}>{currentLang.sensorData}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedMachine.sensors).map(([key, sensor]) => (
                    <div key={key} className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4 border-l-4 ${
                      sensor.status === 'high' ? 'border-red-500' : 'border-green-500'
                    }`}>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                        {key === 'temperature' ? currentLang.temperature :
                         key === 'vibration' ? currentLang.vibration :
                         key === 'pressure' ? currentLang.pressure :
                         currentLang.speed}
                      </p>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {sensor.value}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{sensor.unit}</p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                        sensor.status === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {sensor.status === 'high' ? currentLang.high : currentLang.normal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance History */}
              <div>
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mb-3`}>{currentLang.maintenanceHistory}</h3>
                <div className="space-y-2">
                  {selectedMachine.maintenanceHistory.map((record, idx) => (
                    <div key={idx} className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4 flex items-center justify-between`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-blue-100'} flex items-center justify-center`}>
                          <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{record.type}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{record.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>${record.cost.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className={`${theme === 'dark' ? 'bg-blue-900 bg-opacity-20 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'} mb-2 flex items-center space-x-2`}>
                  <Cpu className="w-5 h-5" />
                  <span>{currentLang.recommendations}</span>
                </h3>
                <ul className={`space-y-2 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'} text-sm`}>
                  {selectedMachine.status === 'critical' ? (
                    <>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-500 mt-1">⚠</span>
                        <span>{language === 'th' ? 'จำเป็นต้องดำเนินการบำรุงรักษาภายใน 7 วัน' : 'Maintenance required within 7 days'}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-500 mt-1">⚠</span>
                        <span>{language === 'th' ? 'ตรวจสอบระบบสั่นสะเทือนและอุณหภูมิ' : 'Check vibration and temperature systems'}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-500 mt-1">⚠</span>
                        <span>{language === 'th' ? 'พิจารณาลดภาระงานจนกว่าจะได้รับการซ่อมแซม' : 'Consider reducing workload until repairs'}</span>
                      </li>
                    </>
                  ) : selectedMachine.status === 'warning' ? (
                    <>
                      <li className="flex items-start space-x-2">
                        <span className="text-yellow-500 mt-1">⚡</span>
                        <span>{language === 'th' ? 'กำหนดการตรวจสอบภายใน 14 วัน' : 'Schedule inspection within 14 days'}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-yellow-500 mt-1">⚡</span>
                        <span>{language === 'th' ? 'ตรวจสอบและเปลี่ยนชิ้นส่วนที่สึกหรอ' : 'Check and replace worn parts'}</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{language === 'th' ? 'ดำเนินการบำรุงรักษาตามปกติ' : 'Continue routine maintenance'}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{language === 'th' ? 'สภาพเครื่องจักรอยู่ในเกณฑ์ดี' : 'Machine condition is optimal'}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer Actions - Fixed */}
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t flex justify-between items-center flex-shrink-0`}>
              <div className="flex space-x-3">
                <button className={`px-4 py-2 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} rounded-lg transition flex items-center space-x-2`}>
                  <Download className="w-4 h-4" />
                  <span>{currentLang.exportReport}</span>
                </button>
                <button 
                  onClick={() => {
                    setShowMachineDetail(false);
                    setTimeout(() => {
                      handleOpenSchedule(selectedMachine, selectedMachine.status === 'critical' ? 'urgent' : 'inspection');
                    }, 100);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{currentLang.scheduleMaintenance}</span>
                </button>
              </div>
              <button
                onClick={() => setShowMachineDetail(false)}
                className={`px-6 py-2 ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'} border rounded-lg transition`}
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

// 3. สร้าง App Component ตัวหลักสำหรับควบคุมการสลับหน้า
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ถ้ายังไม่ล็อกอิน -> แสดงหน้า Login
  if (!isAuthenticated) {
    return <LoginMockup onLogin={() => setIsAuthenticated(true)} />;
  }

  // ถ้าล็อกอินแล้ว -> แสดงหน้า Dashboard
  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
};

export default App;