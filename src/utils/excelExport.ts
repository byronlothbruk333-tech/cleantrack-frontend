import * as XLSX from 'xlsx-js-style';

// ============================================
// TYPES
// ============================================
interface KpiData {
  completionRate?: number;
  fuelEfficiency?: number;
  punctuality?: number;
  totalCollections?: number;
  resolvedReports?: number;
  pendingReports?: number;
  inProgressReports?: number;
  totalReports?: number;
  totalTrucks?: number;
  activeTrucks?: number;
  availableTrucks?: number;
  totalCitizens?: number;
  totalDrivers?: number;
  avgTruckCompletion?: number;
}

interface TruckData {
  truckId: string;
  driverName: string;
  zone: string;
  workingDays?: string[];
  status: string;
  completion: number;
}

interface RoutePerformanceData {
  id: string | number;
  route: string;
  driver: string;
  truckId: string;
  duration: string;
  durationType?: 'scheduled' | 'actual';
  stops: number;
  completed: number;
  efficiency: number;
  status: string;
}

interface RouteStatsData {
  totalRoutes: number;
  completedRoutes: number;
  avgEfficiency: number;
  avgDuration: number;
}

interface ComplaintData {
  id: string;
  issueType: string;
  description: string;
  address: string;
  zone?: string | null;
  status: string;
  priority: string;
  citizen?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  createdAt: string;
  resolvedAt?: string | null;
}

interface DashboardData {
  kpis: KpiData | null;
  trucks: TruckData[];
  routeData: RoutePerformanceData[];
  routeStats: RouteStatsData;
  complaints: ComplaintData[];
}

// ============================================
// STYLE PRESETS
// ============================================
const STYLES = {
  title: {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2E7D32' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '1B5E20' } },
      bottom: { style: 'thin', color: { rgb: '1B5E20' } },
      left: { style: 'thin', color: { rgb: '1B5E20' } },
      right: { style: 'thin', color: { rgb: '1B5E20' } },
    },
  },
  subtitle: {
    font: { bold: false, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4CAF50' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  },
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '37474F' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  tableHeader: {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1976D2' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  tableCell: {
    font: { sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  },
  metricLabel: {
    font: { sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  },
  goodValue: {
    font: { sz: 12, bold: true, color: { rgb: '2E7D32' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  },
  warningValue: {
    font: { sz: 12, bold: true, color: { rgb: 'F57C00' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  },
  errorValue: {
    font: { sz: 12, bold: true, color: { rgb: 'C62828' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'DDDDDD' } },
      bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
      left: { style: 'thin', color: { rgb: 'DDDDDD' } },
      right: { style: 'thin', color: { rgb: 'DDDDDD' } },
    },
  },
};

// ============================================
// HELPERS
// ============================================
const styleCell = (sheet: XLSX.WorkSheet, cellRef: string, style: object) => {
  if (!sheet[cellRef]) {
    sheet[cellRef] = { t: 's', v: '' };
  }
  sheet[cellRef].s = style;
};

const getValueStyle = (value: number): object => {
  if (value >= 75) return STYLES.goodValue;
  if (value >= 40) return STYLES.warningValue;
  return STYLES.errorValue;
};

function getRateStatus(value: number): string {
  if (value >= 75) return 'Good';
  if (value >= 40) return 'Fair';
  return 'Poor';
}

// ============================================
// EXPORT DASHBOARD TO EXCEL
// ============================================
export const exportDashboardToExcel = (data: DashboardData) => {
  const { kpis, trucks, routeData, routeStats, complaints } = data;

  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekLabel = `${weekStart.toISOString().slice(0, 10)}_to_${weekEnd
    .toISOString()
    .slice(0, 10)}`;

  const workbook = XLSX.utils.book_new();

  // ============================================
  // SHEET 1: KPIs
  // ============================================
  const kpiRows: (string | number)[][] = [
    ['CleanTrack — Weekly KPI Report'],
    [`Week: ${weekStart.toDateString()} → ${weekEnd.toDateString()}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ['OPERATIONAL RATES'],
    ['Metric', 'Value', 'Unit', 'Status'],
    ['Collection Rate', kpis?.completionRate ?? 0, '%', getRateStatus(kpis?.completionRate ?? 0)],
    ['Fuel Efficiency', kpis?.fuelEfficiency ?? 0, '%', getRateStatus(kpis?.fuelEfficiency ?? 0)],
    ['Punctuality', kpis?.punctuality ?? 0, '%', getRateStatus(kpis?.punctuality ?? 0)],
    [],
    ['COMPLAINTS SUMMARY'],
    ['Category', 'Count', '', ''],
    ['Total Complaints', kpis?.totalReports ?? 0, '', ''],
    ['Resolved', kpis?.resolvedReports ?? 0, '', ''],
    ['Pending', kpis?.pendingReports ?? 0, '', ''],
    ['In Progress', kpis?.inProgressReports ?? 0, '', ''],
    [
      'Resolution Rate',
      kpis?.totalReports && kpis.totalReports > 0
        ? Math.round(((kpis.resolvedReports ?? 0) / kpis.totalReports) * 100)
        : 0,
      '%',
      '',
    ],
    [],
    ['FLEET SUMMARY'],
    ['Category', 'Count', '', ''],
    ['Total Trucks', kpis?.totalTrucks ?? 0, '', ''],
    ['Active (On Route)', kpis?.activeTrucks ?? 0, '', ''],
    ['Available', kpis?.availableTrucks ?? 0, '', ''],
    ['Avg Truck Completion', kpis?.avgTruckCompletion ?? 0, '%', ''],
    [],
    ['USER SUMMARY'],
    ['Category', 'Count', '', ''],
    ['Total Citizens', kpis?.totalCitizens ?? 0, '', ''],
    ['Total Drivers', kpis?.totalDrivers ?? 0, '', ''],
  ];

  const kpiSheet = XLSX.utils.aoa_to_sheet(kpiRows);

  kpiSheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
  ];

  kpiSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
    { s: { r: 18, c: 0 }, e: { r: 18, c: 3 } },
    { s: { r: 24, c: 0 }, e: { r: 24, c: 3 } },
  ];

  styleCell(kpiSheet, 'A1', STYLES.title);
  styleCell(kpiSheet, 'A2', STYLES.subtitle);
  styleCell(kpiSheet, 'A3', STYLES.subtitle);

  styleCell(kpiSheet, 'A5', STYLES.sectionHeader);
  styleCell(kpiSheet, 'A11', STYLES.sectionHeader);
  styleCell(kpiSheet, 'A19', STYLES.sectionHeader);
  styleCell(kpiSheet, 'A25', STYLES.sectionHeader);

  ['A6', 'B6', 'C6', 'D6'].forEach((c) => styleCell(kpiSheet, c, STYLES.tableHeader));
  ['A12', 'B12', 'C12', 'D12'].forEach((c) => styleCell(kpiSheet, c, STYLES.tableHeader));
  ['A20', 'B20', 'C20', 'D20'].forEach((c) => styleCell(kpiSheet, c, STYLES.tableHeader));
  ['A26', 'B26', 'C26', 'D26'].forEach((c) => styleCell(kpiSheet, c, STYLES.tableHeader));

  // Rate rows — color-coded
  [7, 8, 9].forEach((row, i) => {
    const values = [
      kpis?.completionRate ?? 0,
      kpis?.fuelEfficiency ?? 0,
      kpis?.punctuality ?? 0,
    ];
    styleCell(kpiSheet, `A${row}`, STYLES.metricLabel);
    styleCell(kpiSheet, `B${row}`, getValueStyle(values[i]));
    styleCell(kpiSheet, `C${row}`, STYLES.metricLabel);
    styleCell(kpiSheet, `D${row}`, STYLES.metricLabel);
  });

  // Complaint section rows (13-18 in Excel)
  [13, 14, 15, 16, 17].forEach((row) => {
    ['A', 'B', 'C', 'D'].forEach((col) => {
      styleCell(kpiSheet, `${col}${row}`, STYLES.metricLabel);
    });
  });
  // Resolution Rate row (18) — color-coded
  const resolutionRate =
    kpis?.totalReports && kpis.totalReports > 0
      ? Math.round(((kpis.resolvedReports ?? 0) / kpis.totalReports) * 100)
      : 0;
  styleCell(kpiSheet, 'A18', STYLES.metricLabel);
  styleCell(kpiSheet, 'B18', getValueStyle(resolutionRate));
  styleCell(kpiSheet, 'C18', STYLES.metricLabel);
  styleCell(kpiSheet, 'D18', STYLES.metricLabel);

  // Fleet section rows (21-25)
  [21, 22, 23, 24].forEach((row) => {
    ['A', 'B', 'C', 'D'].forEach((col) => {
      styleCell(kpiSheet, `${col}${row}`, STYLES.metricLabel);
    });
  });

  // User section rows (27-28)
  [27, 28].forEach((row) => {
    ['A', 'B', 'C', 'D'].forEach((col) => {
      styleCell(kpiSheet, `${col}${row}`, STYLES.metricLabel);
    });
  });

  XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');

  // ============================================
  // SHEET 2: Fleet Status
  // ============================================
  const fleetRows = [
    ['CleanTrack — Fleet Status'],
    [`Week: ${weekStart.toDateString()} → ${weekEnd.toDateString()}`],
    [],
    ['Truck ID', 'Driver', 'Zone', 'Collection Days', 'Status', 'Completion (%)'],
    ...trucks.map((t) => [
      t.truckId,
      t.driverName,
      t.zone,
      (t.workingDays || []).map((d: string) => d.slice(0, 3).toUpperCase()).join(', '),
      t.status.toUpperCase(),
      t.completion,
    ]),
  ];

  const fleetSheet = XLSX.utils.aoa_to_sheet(fleetRows);
  fleetSheet['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
  ];
  fleetSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  styleCell(fleetSheet, 'A1', STYLES.title);
  styleCell(fleetSheet, 'A2', STYLES.subtitle);
  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'].forEach((c) =>
    styleCell(fleetSheet, c, STYLES.tableHeader)
  );
  for (let i = 0; i < trucks.length; i++) {
    const rowNum = i + 5;
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col) => {
      styleCell(fleetSheet, `${col}${rowNum}`, STYLES.tableCell);
    });
  }

  XLSX.utils.book_append_sheet(workbook, fleetSheet, 'Fleet Status');

  // ============================================
  // SHEET 3: Route Performance
  // ============================================
  const routeRows = [
    ['CleanTrack — Route Performance'],
    [`Week: ${weekStart.toDateString()} → ${weekEnd.toDateString()}`],
    [],
    [
      'Route',
      'Driver',
      'Truck ID',
      'Duration',
      'Duration Type',
      'Stops',
      'Completed',
      'Efficiency (%)',
      'Status',
    ],
    ...routeData.map((r) => [
      r.route,
      r.driver,
      r.truckId,
      r.duration,
      r.durationType === 'actual' ? 'ACTUAL' : 'Scheduled',
      r.stops,
      r.completed,
      r.efficiency,
      r.status.toUpperCase(),
    ]),
    [],
    ['Summary'],
    ['Total Routes', routeStats.totalRoutes],
    ['Completed Routes', routeStats.completedRoutes],
    ['Avg Efficiency (%)', routeStats.avgEfficiency],
    ['Avg Duration (hrs)', routeStats.avgDuration],
  ];

  const routeSheet = XLSX.utils.aoa_to_sheet(routeRows);
  routeSheet['!cols'] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
  ];
  routeSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
  ];

  styleCell(routeSheet, 'A1', STYLES.title);
  styleCell(routeSheet, 'A2', STYLES.subtitle);
  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'].forEach((c) =>
    styleCell(routeSheet, c, STYLES.tableHeader)
  );
  for (let i = 0; i < routeData.length; i++) {
    const rowNum = i + 5;
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
      styleCell(routeSheet, `${col}${rowNum}`, STYLES.tableCell);
    });
  }

  XLSX.utils.book_append_sheet(workbook, routeSheet, 'Route Performance');

  // ============================================
  // SHEET 4: Complaints
  // ============================================
  const complaintSheetRows = [
    ['CleanTrack — Complaints Report'],
    [`Week: ${weekStart.toDateString()} → ${weekEnd.toDateString()}`],
    [],
    [
      'Complaint ID',
      'Issue Type',
      'Description',
      'Address',
      'Zone',
      'Status',
      'Priority',
      'Reported By',
      'Citizen Email',
      'Date Reported',
      'Resolved At',
    ],
    ...complaints.map((c) => [
      c.id.slice(0, 8),
      c.issueType,
      c.description,
      c.address,
      c.zone || 'N/A',
      c.status.toUpperCase(),
      c.priority.toUpperCase(),
      c.citizen?.name || 'Unknown',
      c.citizen?.email || 'N/A',
      new Date(c.createdAt).toLocaleString(),
      c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : 'N/A',
    ]),
  ];

  const complaintSheet = XLSX.utils.aoa_to_sheet(complaintSheetRows);
  complaintSheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 40 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 25 },
    { wch: 22 },
    { wch: 22 },
  ];
  complaintSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
  ];

  styleCell(complaintSheet, 'A1', STYLES.title);
  styleCell(complaintSheet, 'A2', STYLES.subtitle);
  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4'].forEach((c) =>
    styleCell(complaintSheet, c, STYLES.tableHeader)
  );
  for (let i = 0; i < complaints.length; i++) {
    const rowNum = i + 5;
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach((col) => {
      styleCell(complaintSheet, `${col}${rowNum}`, STYLES.tableCell);
    });
  }

  XLSX.utils.book_append_sheet(workbook, complaintSheet, 'Complaints');

  // ============================================
  // WRITE FILE
  // ============================================
  XLSX.writeFile(workbook, `cleantrack-week-${weekLabel}.xlsx`);
};