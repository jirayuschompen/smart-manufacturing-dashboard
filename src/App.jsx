import React, {useState} from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, AlertTriangle, Activity, Settings, Calendar, Package, Factory, Cpu, Bell, ChevronRight, CheckCircle, XCircle, Clock, X, User, LogOut, Shield, FileText, Loader, Check, Upload, Download, Cloud, Wind, Droplets, Gauge } from 'lucide-react';
import LoginMockup from './login'; 

// --- Helper Functions ---
const generateDailyData = () => {
  const data = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      const timeLabel = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      let baseValue = 0;
      if (h < 6) baseValue = 150;        
      else if (h < 9) baseValue = 300 + ((h - 6) * 200); 
      else if (h < 12) baseValue = 850;  
      else if (h < 13) baseValue = 700;  
      else if (h < 17) baseValue = 900;  
      else if (h < 21) baseValue = 600 - ((h - 17) * 100); 
      else baseValue = 200;              
      const randomNoise = (Math.random() - 0.5) * 40; 
      const actual = Math.max(0, baseValue + randomNoise);
      const forecast = baseValue * 1.02; 
      data.push({
        label: timeLabel,
        actual: Math.round(actual),
        forecast: Math.round(forecast)
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
    if (i < 6) oee = 0;
    else if (i === 12) oee = 45;
    else if (i > 17 && i <= 20) oee = 75;
    else if (i > 20) oee = 0;
    else oee = 85 + Math.floor(Math.random() * 10);
    data.push({ label: hour, oee: oee });
  }
  return data;
};

// --- Dashboard Component ---
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
  const [isGenerating, setIsGenerating] = useState(false);
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

  // --- 1. เพิ่ม Weather Data (ที่หายไป) ---
  const weatherData = {
    temp: 32.5,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    pressure: 1012,
  };

  // --- Data Sets ---
  const productionDataSets = {
    daily: generateHourlyOEE(),
    weekly: [
      { label: 'Mon', oee: 85 }, { label: 'Tue', oee: 87 }, { label: 'Wed', oee: 82 },
      { label: 'Thu', oee: 89 }, { label: 'Fri', oee: 86 }, { label: 'Sat', oee: 75 }, { label: 'Sun', oee: 0 }
    ],
    monthly: [
      { label: 'Jan', oee: 80 }, { label: 'Feb', oee: 82 }, { label: 'Mar', oee: 81 },
      { label: 'Apr', oee: 85 }, { label: 'May', oee: 86 }, { label: 'Jun', oee: 84 },
      { label: 'Jul', oee: 87 }, { label: 'Aug', oee: 88 }, { label: 'Sep', oee: 86 },
      { label: 'Oct', oee: 89 }, { label: 'Nov', oee: 88 }, { label: 'Dec', oee: 90 }
    ],
    yearly: [
      { label: '2021', oee: 78 }, { label: '2022', oee: 82 },
      { label: '2023', oee: 85 }, { label: '2024', oee: 86 }, { label: '2025', oee: 88 }
    ]
  };
  
  const demandDataSets = {
    daily: generateDailyData(),
    weekly: [
      { label: 'Mon', actual: 4250, forecast: 4300 }, { label: 'Tue', actual: 4400, forecast: 4350 },
      { label: 'Wed', actual: 4150, forecast: 4200 }, { label: 'Thu', actual: 4600, forecast: 4550 },
      { label: 'Fri', actual: 4850, forecast: 4900 }, { label: 'Sat', actual: 3800, forecast: 3900 },
      { label: 'Sun', actual: 3500, forecast: 3600 }
    ],
    monthly: [
      { label: 'Jan', actual: 850, forecast: 860 }, { label: 'Feb', actual: 920, forecast: 910 },
      { label: 'Mar', actual: 880, forecast: 890 }, { label: 'Apr', actual: 1050, forecast: 1040 },
      { label: 'May', actual: 1100, forecast: 1120 }, { label: 'Jun', actual: 1080, forecast: 1090 },
      { label: 'Jul', actual: 0, forecast: 1150 }, { label: 'Aug', actual: 0, forecast: 1200 },
      { label: 'Sep', actual: 0, forecast: 1180 }, { label: 'Oct', actual: 0, forecast: 1250 }
    ],
    yearly: [
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

  // Function to handle forecast
  const handleGenerateForecast = async () => {
    setShowForecastModal(false);
    setIsProcessing(true);
    setProcessingMessage('Generating demand forecast...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsProcessing(false);
    setSuccessMessage(`Forecast generated successfully! Horizon: ${forecastParams.horizon} days, MAPE: 8.3%`);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleOptimizeSchedule = async () => {
    setShowPlanningModal(false);
    setIsProcessing(true);
    setProcessingMessage('Optimizing production schedule...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    setIsProcessing(false);
    setSuccessMessage('Production schedule optimized! Total cost: $125,000, Utilization: 87%');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleRunAnalysis = async () => {
    setShowAnalysisModal(false);
    setIsProcessing(true);
    setProcessingMessage('Running predictive maintenance analysis...');
    await new Promise(resolve => setTimeout(resolve, 3500));
    setIsProcessing(false);
    setSuccessMessage('Analysis completed! 2 machines require attention within 30 days');
    setShowSuccessMessage(true);
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

  const handleLogout = async () => {
    if (window.firebase && window.firebase.auth()) {
      try {
        await window.firebase.auth().signOut();
        if (onLogout) onLogout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    } else {
      if (onLogout) onLogout();
    }
  };

  const handleOpenSchedule = (machine, type) => {
    setSelectedMachine(machine);
    setScheduleType(type);
    setShowScheduleModal(true);
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
    setScheduleForm({ date: '', time: '', technician: '', priority: 'medium', notes: '' });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>      
      
      {/* Header */}
      <header className={`border-b shadow-sm sticky top-0 z-50 transition-all duration-200 ${theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'} backdrop-blur-md`}>
        {(showNotifications || showUserMenu) && (
          <div className="fixed inset-0 z-0 bg-transparent" onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}></div>
        )}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-md shrink-0">
                <Cpu className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className={`text-base lg:text-xl font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {currentLang.title}
                </h1>
                <p className={`text-[10px] lg:text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium hidden sm:block mt-1`}>
                  {currentLang.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-3">
              <div className="relative z-10">
                <button 
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className={`relative p-2.5 rounded-full transition-all active:scale-95 ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>}
                </button>
                {showNotifications && (
                  <div className={`absolute right-[-50px] sm:right-0 mt-3 w-[90vw] sm:w-80 lg:w-96 origin-top-right transform transition-all rounded-2xl shadow-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.notifications}</h3>
                      <button onClick={markAllAsRead} className="text-xs font-medium text-blue-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition">{currentLang.markAllRead}</button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} onClick={() => markAsRead(alert.id)} className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${!alert.read ? (theme === 'dark' ? 'bg-blue-900/10 border-slate-700' : 'bg-blue-50/50 border-slate-100') : (theme === 'dark' ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-slate-50 border-slate-100')}`}>
                          <div className="flex gap-3 items-start">
                            <div className="mt-0.5 shrink-0">{getSeverityIcon(alert.severity)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-start mb-0.5">
                                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{alert.machine}</p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{alert.time}</span>
                              </div>
                              <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{alert.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`p-3 text-center border-t ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}><button onClick={() => { setShowNotifications(false); setShowAllAlerts(true); }} className="text-xs font-medium text-blue-600 hover:text-blue-700 w-full py-1">{currentLang.viewAll}</button></div>
                  </div>
                )}
              </div>
              <div className="relative z-10">
                <button 
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                  className={`flex items-center gap-2 p-1.5 lg:px-3 lg:py-2 rounded-full transition-all border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                >
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">A</div>
                  <span className={`text-xs font-medium hidden md:block pr-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Admin</span>
                  <ChevronRight className={`w-3 h-3 hidden md:block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                </button>
                {showUserMenu && (
                  <div className={`absolute right-0 mt-3 w-[85vw] sm:w-72 origin-top-right transform transition-all rounded-2xl shadow-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`p-5 border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">A</div>
                        <div>
                          <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin User</p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Super Admin</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {[ { icon: User, label: currentLang.profile }, { icon: Settings, label: currentLang.settings }, { icon: Shield, label: currentLang.security }, { icon: FileText, label: currentLang.apiDocs } ].map((item, idx) => (
                        <button key={idx} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <item.icon className="w-4 h-4 opacity-70" />{item.label}
                        </button>
                      ))}
                    </div>
                    <div className={`p-4 border-t space-y-4 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-1 rounded-lg flex ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <button onClick={() => setLanguage('th')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${language === 'th' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>TH</button>
                          <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>EN</button>
                        </div>
                        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-white text-slate-600'}`}>{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</button>
                      </div>
                      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl transition-colors"><LogOut className="w-4 h-4" />{currentLang.logout}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={`sticky z-40 border-b transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur-sm top-[60px] lg:top-[76px]`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="flex min-w-full px-2 lg:px-6">
              {[ { id: 'overview', label: 'Overview', icon: Activity }, { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp }, { id: 'planning', label: 'Production Planning', icon: Calendar }, { id: 'maintenance', label: 'Predictive Maintenance', icon: Settings } ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-none flex items-center gap-2 px-4 py-3 lg:px-6 lg:py-4 border-b-2 transition-all whitespace-nowrap text-sm lg:text-base font-medium select-none ${isActive ? 'border-blue-500 text-blue-600 ' + (theme === 'dark' ? 'bg-slate-800' : 'bg-blue-50/50') : 'border-transparent ' + (theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50')}`}>
                    <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span>{tab.id === 'overview' ? currentLang.overview : tab.id === 'forecast' ? currentLang.demandForecasting : tab.id === 'planning' ? currentLang.productionPlanning : currentLang.predictiveMaintenance}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {activeTab === 'overview' && (
          // Container หลัก: ปรับความสูงให้พอดีหน้าจอ Desktop (h-[calc(100vh-160px)])
          <div className="flex flex-col h-auto lg:h-[calc(100vh-160px)] gap-3 lg:gap-4 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0 scrollbar-hide">
            <div className={`rounded-2xl p-5 border shadow-lg transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-[#111827] border-slate-800 text-white' // Dark Mode: ธีมมืด ดุดัน
                : 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400 text-white' // Light Mode: ธีมฟ้า สดใส (Blue Theme)
            }`}>
              
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-0">
                
                {/* --- ส่วนที่ 1: Main Info (ซ้าย) --- */}
                <div className="flex items-center gap-5 min-w-max lg:pr-8">
                  {/* Icon Box */}
                  <div className={`p-3.5 rounded-2xl shadow-sm backdrop-blur-md ${
                    theme === 'dark' 
                      ? 'bg-slate-800 text-blue-400' // Dark: พื้นเทา ไอคอนฟ้า
                      : 'bg-white/20 text-white'      // Light: พื้นขาวโปร่งแสง ไอคอนขาว
                  }`}>
                    <Cloud className="w-9 h-9 lg:w-10 lg:h-10 drop-shadow-md" />
                  </div>
                  
                  {/* Text Info */}
                  <div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-blue-100' // Light: หัวข้อสีฟ้าอ่อน
                    }`}>
                      {currentLang.overview === 'Overview' ? 'Site Conditions' : 'สภาพอากาศหน้างาน'}
                    </h3>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-4xl font-bold tracking-tighter leading-none text-white">
                        {weatherData.temp}°
                      </span>
                      <span className={`text-base font-medium ${
                        theme === 'dark' ? 'text-slate-400' : 'text-blue-50' // Light: ข้อความรองสีฟ้าจางๆ เกือบขาว
                      }`}>
                        {weatherData.condition}
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- เส้นคั่น (Divider) --- */}
                <div className={`hidden lg:block w-px h-12 mx-auto ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-white/20' // Light: เส้นคั่นสีขาวจางๆ
                }`}></div>

                {/* --- ส่วนที่ 2: Stats Grid (ขวา) --- */}
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
                      
                      {/* Icon/Symbol */}
                      <div className={`mb-1.5 lg:mb-0 transition-colors ${
                        theme === 'dark' ? 'text-slate-500' : 'text-blue-100' // Light: ไอคอนสีฟ้าอ่อน
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

                      {/* Data */}
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                          theme === 'dark' ? 'text-slate-500' : 'text-blue-200' // Light: Label สีฟ้าเข้มขึ้นมานิดนึงให้อ่านง่าย
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-sm font-bold whitespace-nowrap ${
                          item.highlight 
                            ? 'text-green-300' // Highlight: สีเขียวสว่าง (เข้ากับพื้นฟ้าได้ดี)
                            : 'text-white'     // Value: สีขาวล้วนเพื่อความชัด
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
            {/* ปรับ gap-3 ให้ชิดกันมากขึ้นทั้ง Mobile และ Desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpiCards.map((kpi, idx) => {
                const Icon = kpi.icon;
                
                // Theme colors
                const bgColors = {
                  blue: theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100',
                  green: theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100',
                  purple: theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100',
                  red: theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'
                };
                
                // Icon colors
                const iconColors = {
                  blue: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
                  green: theme === 'dark' ? 'text-green-400' : 'text-green-600',
                  purple: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
                  red: theme === 'dark' ? 'text-red-400' : 'text-red-600'
                };

                return (
                  <div 
                    key={idx} 
                    // ปรับ p-3 (ลดจาก 4) และ lg:h-auto เพื่อให้ Desktop ไม่ยืดสูงเกินไป
                    className={`${bgColors[kpi.color]} border rounded-xl p-3 shadow-sm flex flex-col justify-between h-full min-h-[100px] lg:min-h-0 lg:h-auto transition-transform active:scale-95 lg:hover:scale-[1.02]`}
                  >
                    {/* --- ส่วนหัว: Icon & Badge --- */}
                    <div className="flex justify-between items-start mb-1 lg:mb-2">
                      {/* Icon: ลดขนาด Box ลงนิดนึง */}
                      <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/80'} shadow-sm`}>
                        <Icon className={`w-4 h-4 ${iconColors[kpi.color]}`} />
                      </div>

                      {/* Trend Badge: ปรับขนาดให้เล็กกระชับ */}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                        kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 
                        kpi.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {kpi.change}
                      </span>
                    </div>

                    {/* --- ส่วนเนื้อหา: Title & Value --- */}
                    <div>
                      {/* Title: ลด margin-bottom ให้ชิดตัวเลขมากขึ้น */}
                      <p className={`text-[10px] lg:text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-0.5 truncate ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {kpi.title === 'Overall OEE' ? currentLang.overallOEE :
                        kpi.title === 'Forecast Accuracy' ? currentLang.forecastAccuracy :
                        kpi.title === 'Active Machines' ? currentLang.activeMachines :
                        currentLang.criticalAlerts}
                      </p>
                      {/* Value: ปรับขนาดตัวอักษรให้พอดี ไม่ใหญ่เทอะทะ */}
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
                
                {/* 1. Production Chart */}
                <div className={`h-[300px] lg:h-auto lg:flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-4 flex flex-col min-h-0`}>
                  <div className="flex justify-between items-center mb-2 flex-none">
                    <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.weeklyProduction}</h3>
                    <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
                      {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                        <button
                          key={period}
                          onClick={() => setProductionPeriod(period)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                            productionPeriod === period
                              ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200')
                              : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                          }`}
                        >
                           {/* แก้ไขปุ่มตรงนี้เป็น Day, Week, Month, Year */}
                           {period === 'daily' ? 'Day' :
                           period === 'weekly' ? 'Week' :
                           period === 'monthly' ? 'Month' :
                           'Year'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionDataSets[productionPeriod]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4}} />
                        <Bar dataKey="oee" fill="#3b82f6" name="OEE %" radius={[4, 4, 0, 0]} barSize={productionPeriod === 'yearly' ? 40 : 20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Demand Chart */}
                <div className={`h-[300px] lg:h-auto lg:flex-1 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl shadow-sm border p-4 flex flex-col min-h-0`}>
                  <div className="flex justify-between items-center mb-2 flex-none">
                    <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.demandTrend}</h3>
                    <div className={`flex rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'} p-0.5`}>
                        {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                          <button
                            key={period}
                            onClick={() => setDemandPeriod(period)}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                              demandPeriod === period
                                ? (theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200')
                                : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                            }`}
                          >
                           {/* แก้ไขปุ่มตรงนี้เป็น Day, Week, Month, Year */}
                           {period === 'daily' ? 'Day' :
                           period === 'weekly' ? 'Week' :
                           period === 'monthly' ? 'Month' :
                           'Year'}
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
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual" connectNulls />
                        <Area type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" name="Forecast" />
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
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{unreadCount} new</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {alerts.map((alert) => (
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
          </div>
        )}

        {activeTab === 'forecast' && (
        // Container หลัก
        <div className={`flex flex-col h-auto gap-6 pb-10 relative ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          
          {/* --- Header & Metrics Section --- */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Demand Forecasting
                </h2>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  AI-powered demand prediction for the next 90 days
                </p>
              </div>
              <button 
                onClick={() => setShowForecastModal(true)}
                className="bg-blue-600 text-white px-4 py-2 lg:px-6 lg:py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm text-sm lg:text-base whitespace-nowrap"
              >
                Generate New Forecast
              </button>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard 
                theme={theme}
                label="Forecast Accuracy (MAPE)" 
                value="8.5%" 
                labelColor={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} 
                valueColor={theme === 'dark' ? 'text-blue-500' : 'text-blue-700'} 
              />
              <MetricCard 
                theme={theme}
                label="Model Confidence" 
                value="92%" 
                labelColor={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} 
                valueColor={theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'} 
              />
              <MetricCard 
                theme={theme}
                label="Next Update" 
                value="3 days" 
                labelColor={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} 
                valueColor={theme === 'dark' ? 'text-purple-500' : 'text-purple-700'} 
              />
            </div>
          </div>

          {/* --- Chart Section --- */}
          <div className={`rounded-xl shadow-lg border p-4 lg:p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="w-full h-[400px] min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradientCI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="5 5" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={true} horizontal={true} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  
                  <Tooltip 
                    cursor={{ stroke: theme === 'dark' ? '#fff' : '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const upperVal = payload.find(p => p.dataKey === 'upper')?.value;
                        const forecastVal = payload.find(p => p.dataKey === 'forecast')?.value;
                        const lowerVal = payload.find(p => p.dataKey === 'lower')?.value;
                        const actualVal = payload.find(p => p.dataKey === 'actual')?.value;

                        return (
                          <div className={`backdrop-blur-sm border p-4 rounded-lg shadow-2xl min-w-[200px] ${theme === 'dark' ? 'bg-slate-900/95 border-slate-600' : 'bg-white/95 border-slate-200'}`}>
                            <p className={`font-bold mb-3 text-base border-b pb-2 ${theme === 'dark' ? 'text-white border-slate-700' : 'text-slate-800 border-slate-200'}`}>
                              {label}
                            </p>
                            <div className="space-y-2 text-sm font-medium">
                              {upperVal !== undefined && (
                                <div className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'} flex justify-between gap-4`}>
                                  <span>Upper Bound :</span>
                                  <span>{upperVal}</span>
                                </div>
                              )}
                              {forecastVal !== undefined && (
                                <div className="text-blue-600 flex justify-between gap-4 font-bold">
                                  <span>Forecast :</span>
                                  <span>{forecastVal}</span>
                                </div>
                              )}
                              {lowerVal !== undefined && (
                                <div className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'} flex justify-between gap-4`}>
                                  <span>Lower Bound :</span>
                                  <span>{lowerVal}</span>
                                </div>
                              )}
                              {actualVal !== undefined && (
                                <div className={`text-emerald-500 flex justify-between gap-4 mt-2 pt-2 border-t font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <span>Actual :</span>
                                  <span>{actualVal}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#gradientCI)" activeDot={false} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="url(#gradientCI)" activeDot={false} />
                  <Area type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={3} fill="url(#gradientForecast)" activeDot={{ r: 6, stroke: theme === 'dark' ? '#fff' : '#fff', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fill="url(#gradientActual)" activeDot={{ r: 6, stroke: theme === 'dark' ? '#fff' : '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 select-none">
              <CustomLegendItem label="Upper Bound" color="#93c5fd" theme={theme} />
              <CustomLegendItem label="Forecast" color="#3b82f6" theme={theme} />
              <CustomLegendItem label="Lower Bound" color="#93c5fd" theme={theme} />
              <CustomLegendItem label="Actual" color="#10b981" theme={theme} />
            </div>
          </div>

          {/* --- Model Info & Metrics Section --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            
            {/* Model Information Card */}
            <div className={`rounded-xl shadow-lg border p-6 h-full ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-bold mb-6 border-b pb-2 ${theme === 'dark' ? 'text-white border-slate-700' : 'text-slate-800 border-slate-200'}`}>
                Model Information
              </h3>
              <div className="space-y-4 text-sm">
                <CleanInfoRow theme={theme} label="Algorithm" value="LSTM + Attention" boldValue />
                <CleanInfoRow theme={theme} label="Version" value="v1.2.3" />
                <CleanInfoRow theme={theme} label="Trained" value="2024-06-15" />
                <CleanInfoRow theme={theme} label="Dataset" value="18 months history" boldValue />
              </div>
            </div>

            {/* Performance Metrics Card */}
            <div className={`rounded-xl shadow-lg border p-6 h-full ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-bold mb-6 border-b pb-2 ${theme === 'dark' ? 'text-white border-slate-700' : 'text-slate-800 border-slate-200'}`}>
                Performance Metrics
              </h3>
              <div className="space-y-4 text-sm">
                <CleanInfoRow theme={theme} label="MAPE" value="8.5%" valueColor="text-emerald-500" boldValue />
                <CleanInfoRow theme={theme} label="RMSE" value="45.2" />
                <CleanInfoRow theme={theme} label="R² Score" value="0.94" valueColor="text-emerald-500" boldValue />
                <CleanInfoRow theme={theme} label="Inference Time" value="234ms" />
              </div>
            </div>
          </div>

          {/* --- Generate Forecast Modal & Loading State --- */}
          {showForecastModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className={`w-full max-w-lg rounded-xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1e293b]' : 'bg-white'} zoom-in-95 duration-200`}>
                
                {/* เงื่อนไขแสดงผล: ถ้ากำลังโหลด (isGenerating) ให้แสดงหน้าโหลด, ถ้าไม่ ให้แสดงฟอร์ม */}
                {isGenerating ? (
                  <div className="p-10 flex flex-col items-center justify-center text-center space-y-5">
                    {/* Spinner */}
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        Processing...
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Generating demand forecast...
                      </p>
                    </div>

                    {/* Progress Bar (Indeterminate) */}
                    <div className={`w-full h-2 rounded-full overflow-hidden mt-2 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div className="h-full bg-blue-600 rounded-full w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* --- Form Header --- */}
                    <div className={`px-6 py-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        Generate New Forecast
                      </h3>
                      <button 
                        onClick={() => setShowForecastModal(false)}
                        className={`p-1 rounded-full hover:bg-slate-100 transition ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500'}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* --- Form Body --- */}
                    <div className="p-6 space-y-5">
                      
                      {/* Forecast Horizon */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Forecast Horizon (Days)
                        </label>
                        <input 
                          type="number" 
                          defaultValue={90}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            theme === 'dark' 
                              ? 'bg-slate-800 border-slate-600 text-white' 
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Products Checkboxes */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Products
                        </label>
                        <div className="space-y-2">
                          {['PROD-001', 'PROD-002', 'PROD-003'].map((prod, idx) => (
                            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                defaultChecked={idx < 2} 
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className={`text-sm group-hover:opacity-80 transition ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {prod}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Confidence Level */}
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Confidence Level
                        </label>
                        <select className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${
                            theme === 'dark' 
                              ? 'bg-slate-800 border-slate-600 text-white' 
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}>
                          <option>95%</option>
                          <option>90%</option>
                          <option>99%</option>
                        </select>
                      </div>

                      {/* Include Confidence Intervals */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-medium group-hover:opacity-80 transition ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Include confidence intervals
                        </span>
                      </label>

                    </div>

                    {/* --- Form Footer Buttons --- */}
                    <div className={`px-6 py-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                      <button 
                        onClick={() => setShowForecastModal(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                          theme === 'dark' 
                            ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                            : 'border-slate-300 text-slate-700 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          // เริ่มกระบวนการโหลด 5 วินาที
                          setIsGenerating(true);
                          setTimeout(() => {
                            setIsGenerating(false);
                            setShowForecastModal(false);
                          }, 5000);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
                      >
                        Generate New Forecast
                      </button>
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

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
                </div>
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                    {language === 'th' ? 'การใช้งานเครื่องจักร' : 'Machine Utilization'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'} mt-2`}>87%</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    {language === 'th' ? 'ต้นทุนรวม' : 'Total Cost'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'} mt-2`}>$125K</p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'} rounded-lg p-4 border`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>
                    {language === 'th' ? 'การส่งตรงเวลา' : 'On-Time Delivery'}
                  </p>
                  <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-orange-200' : 'text-orange-800'} mt-2`}>98%</p>
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

      {/* Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Optimize Production Schedule</h2>
              <button onClick={() => setShowPlanningModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
               <p className="text-slate-600">Configuration options for optimization...</p>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button onClick={() => setShowPlanningModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700">Cancel</button>
              <button onClick={handleOptimizeSchedule} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Start Optimization</button>
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
              <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
               <p className="text-slate-600">Select analysis parameters...</p>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button onClick={() => setShowAnalysisModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700">Cancel</button>
              <button onClick={handleRunAnalysis} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Run Analysis</button>
            </div>
          </div>
        </div>
      )}

      {/* All Alerts Modal */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-6xl w-full shadow-2xl my-8 flex flex-col`} style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex justify-between`}>
               <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentLang.allAlerts}</h2>
               <button onClick={() => setShowAllAlerts(false)}><X className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
               {filteredAlerts.length === 0 ? <p className="text-center text-slate-500">{currentLang.noAlertsFound}</p> : (
                 <div className="space-y-3">
                   {filteredAlerts.map(alert => (
                     <div key={alert.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                       <div className="flex justify-between">
                         <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{alert.machine}</span>
                         <span className="text-sm text-slate-500">{alert.time}</span>
                       </div>
                       <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{alert.message}</p>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-2xl w-full shadow-2xl`}>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{scheduleType === 'urgent' ? currentLang.urgentMaintenance : currentLang.routineInspection}</h2>
              <button onClick={() => setShowScheduleModal(false)} className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
               <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})} className="w-full border rounded p-2" />
               <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})} className="w-full border rounded p-2" />
               <select value={scheduleForm.technician} onChange={(e) => setScheduleForm({...scheduleForm, technician: e.target.value})} className="w-full border rounded p-2">
                 <option value="">{currentLang.selectTechnician}</option>
                 <option value="tech1">Tech 1</option>
                 <option value="tech2">Tech 2</option>
               </select>
            </div>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t flex justify-end space-x-3`}>
              <button onClick={() => setShowScheduleModal(false)} className="px-6 py-2 border rounded-lg">{currentLang.cancel}</button>
              <button onClick={handleScheduleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg">{currentLang.confirmSchedule}</button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Detail Modal */}
      {showMachineDetail && selectedMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full shadow-2xl`} style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-b flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center space-x-3">
                <Factory className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <div><h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedMachine.name}</h2><p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{selectedMachine.type}</p></div>
              </div>
              <button onClick={() => setShowMachineDetail(false)} className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-4 gap-4">
                 <div className="p-4 bg-slate-100 rounded">Health: {selectedMachine.health}%</div>
                 <div className="p-4 bg-slate-100 rounded">RUL: {selectedMachine.rul} days</div>
               </div>
            </div>
            <div className={`p-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t flex justify-end`}>
               <button onClick={() => setShowMachineDetail(false)} className="px-6 py-2 border rounded-lg">{currentLang.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* Success & Processing Messages */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <Loader className="animate-spin w-8 h-8 text-blue-600 mb-2" />
            <p>{processingMessage}</p>
          </div>
        </div>
      )}
      {showSuccessMessage && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50">
          <CheckCircle className="w-6 h-6" />
          <p>{successMessage}</p>
        </div>
      )}

    </div>
  );
};


// --- Helper Components ---

// 1. Metric Card Helper
const MetricCard = ({ theme, label, value, labelColor, valueColor }) => (
  <div className={`rounded-xl p-4 flex flex-col justify-center border shadow-lg ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
    <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
  </div>
);

// 2. Custom Legend Item Helper (รองรับ Theme)
const CustomLegendItem = ({ label, color, theme }) => (
  <div className="flex items-center gap-2.5 group cursor-default">
    <div className="relative flex items-center justify-center w-8 h-4">
      <div className="absolute w-full h-[2px] rounded-full opacity-60 transition-opacity group-hover:opacity-100" style={{ backgroundColor: color }}></div>
      <div className={`absolute w-2.5 h-2.5 rounded-full border-[2px] z-10 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`} style={{ borderColor: color }}></div>
    </div>
    <span className={`text-sm font-medium transition-opacity group-hover:opacity-100 opacity-90 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
      {label}
    </span>
  </div>
);

// 3. Clean Info Row Helper (รองรับ Theme)
const CleanInfoRow = ({ theme, label, value, valueColor, boldValue }) => (
  <div className={`flex justify-between items-center py-2 border-b last:border-0 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`}>
    <span className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}:</span>
    <span className={`${boldValue ? 'font-bold' : 'font-medium'} ${valueColor ? valueColor : (theme === 'dark' ? 'text-slate-200' : 'text-slate-700')}`}>
      {value}
    </span>
  </div>
);

// --- App Component ---
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginMockup onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
};

export default App;