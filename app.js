(() => {
  'use strict';

  const STORAGE_KEY = 'hrms-reference-demo-v2';
  const USER = { name: 'Sarah Johnson', initials: 'SJ', role: 'HR Administrator', email: 'sarah.johnson@hrms.lk' };
  const PAGE_LABELS = {
    overview: 'Dashboard', people: 'Employees', organization: 'Organization', attendance: 'Attendance',
    timeoff: 'Leave', payroll: 'Payroll', hiring: 'Recruitment', performance: 'Performance',
    documents: 'Documents', reports: 'Reports', audit: 'Audit Logs', settings: 'Settings'
  };
  const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Product', 'IT', 'Customer Support'];
  const LEAVE_TYPES = ['Annual Leave', 'Casual Leave', 'Sick Leave', 'Maternity Leave', 'Unpaid Leave'];
  const AVATAR_COUNT = 8;
  const icons = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    organization: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4m-7-4v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18m-5 5h2M7 5V3h9"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/>',
    audit: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/><circle cx="18" cy="18" r="3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
    more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    calendarCheck: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m3 4-3 3-1.5-1.5"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    building: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12M7 7h.01M17 7h.01M7 12h.01M17 12h.01M7 17h.01M17 17h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  };
  const icon = (name, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;

  const localISO = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  function addDaysISO(days, base = new Date()) { const date = new Date(base.getFullYear(), base.getMonth(), base.getDate()); date.setDate(date.getDate() + days); return localISO(date); }
  function dateObj(value) { if (!value) return null; const [year, month, day] = String(value).split('-').map(Number); return year ? new Date(year, month - 1, day) : null; }
  function fmtDate(value, opts = { month: 'short', day: 'numeric' }) { const date = dateObj(value); return date ? new Intl.DateTimeFormat('en-US', opts).format(date) : '—'; }
  function fmtDateTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date); }
  function fullDate() { return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()); }
  function money(value) { return `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function initials(name) { return String(name || '').trim().split(/\s+/).slice(0, 2).map(item => item[0]).join('').toUpperCase() || 'HR'; }
  function avatar(name, color = 0, extra = '') { return `<span class="avatar avatar-${Math.abs(Number(color) || 0) % AVATAR_COUNT} ${extra}" aria-hidden="true">${escapeHtml(initials(name))}</span>`; }
  function employee(id) { return state.employees.find(person => person.id === id); }
  function employeeName(id) { return employee(id)?.name || 'Sarah Johnson'; }
  function allDepartmentNames() { return [...new Set([...DEPARTMENTS, ...Object.keys(state.headcountByDepartment || {})])]; }
  function getEmployeeStatus(id) { return state.attendance[id]?.status || 'Present'; }
  function statusClass(status) {
    const key = String(status || '').toLowerCase();
    if (['active', 'present', 'approved', 'generated', 'completed', 'on track', 'open', 'processed', 'hired'].includes(key)) return 'success';
    if (['pending', 'late', 'at risk', 'half day', 'review', 'on leave'].includes(key)) return 'warning';
    if (['absent', 'declined', 'closed', 'overdue', 'delete'].includes(key)) return 'danger';
    if (['draft', 'screening', 'in progress'].includes(key)) return 'info';
    return 'neutral';
  }
  function badge(status) { return `<span class="status-badge ${statusClass(status)}">${escapeHtml(status)}</span>`; }

  function seedState() {
    const employees = [
      { id: 'emp-1024', code: 'EMP-1024', name: 'Nimal Silva', department: 'Engineering', title: 'Senior Software Engineer', email: 'nimal.silva@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2021-04-12', salary: 485000 },
      { id: 'emp-1031', code: 'EMP-1031', name: 'Ayesha Perera', department: 'HR', title: 'HR Executive', email: 'ayesha.perera@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2022-01-18', salary: 285000 },
      { id: 'emp-1042', code: 'EMP-1042', name: 'Kasun Fernando', department: 'Finance', title: 'Accountant', email: 'kasun.fernando@hrms.lk', location: 'Kandy', status: 'Active', startDate: '2021-09-06', salary: 365000 },
      { id: 'emp-1056', code: 'EMP-1056', name: 'Tharushi Fernando', department: 'Marketing', title: 'Marketing Specialist', email: 'tharushi.fernando@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2023-02-15', salary: 315000 },
      { id: 'emp-1068', code: 'EMP-1068', name: 'Dilshan Perera', department: 'Sales', title: 'Sales Executive', email: 'dilshan.perera@hrms.lk', location: 'Galle', status: 'Active', startDate: '2023-06-01', salary: 290000 },
      { id: 'emp-1079', code: 'EMP-1079', name: 'Sadeew Wijesinghe', department: 'Operations', title: 'Operations Manager', email: 'sadeew.wijesinghe@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2020-11-23', salary: 540000 },
      { id: 'emp-1090', code: 'EMP-1090', name: 'Kasun Perera', department: 'Engineering', title: 'Frontend Developer', email: 'kasun.perera@hrms.lk', location: 'Kandy', status: 'Active', startDate: '2024-07-08', salary: 410000 },
      { id: 'emp-1103', code: 'EMP-1103', name: 'Dilshan Fernando', department: 'Sales', title: 'Sales Associate', email: 'dilshan.fernando@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2024-03-11', salary: 275000 },
      { id: 'emp-1118', code: 'EMP-1118', name: 'Chathuri Jayawardena', department: 'HR', title: 'People Partner', email: 'chathuri.j@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2024-05-10', salary: 330000 },
      { id: 'emp-1132', code: 'EMP-1132', name: 'Anjali Samarasinghe', department: 'Finance', title: 'Payroll Specialist', email: 'anjali.s@hrms.lk', location: 'Kandy', status: 'Active', startDate: '2025-01-20', salary: 305000 },
      { id: 'emp-1147', code: 'EMP-1147', name: 'Ravindu Perera', department: 'Operations', title: 'Operations Analyst', email: 'ravindu.p@hrms.lk', location: 'Colombo', status: 'Active', startDate: '2025-05-12', salary: 290000 },
      { id: 'emp-1164', code: 'EMP-1164', name: 'Ishan Gamage', department: 'Product', title: 'Product Manager', email: 'ishan.gamage@hrms.lk', location: 'Remote', status: 'Active', startDate: '2025-07-01', salary: 515000 },
    ];
    const requests = [
      { id: 'leave-01', employeeId: 'emp-1031', type: 'Annual Leave', startDate: addDaysISO(1), endDate: addDaysISO(3), days: 3, note: 'Family trip planned.', status: 'Pending', requestedAt: addDaysISO(-1) },
      { id: 'leave-02', employeeId: 'emp-1024', type: 'Sick Leave', startDate: addDaysISO(-1), endDate: addDaysISO(0), days: 2, note: 'Medical appointment and recovery.', status: 'Approved', requestedAt: addDaysISO(-2) },
      { id: 'leave-03', employeeId: 'emp-1056', type: 'Casual Leave', startDate: addDaysISO(2), endDate: addDaysISO(2), days: 1, note: 'Personal matters.', status: 'Pending', requestedAt: addDaysISO(-1) },
      { id: 'leave-04', employeeId: 'emp-1056', type: 'Annual Leave', startDate: addDaysISO(8), endDate: addDaysISO(9), days: 2, note: 'Annual break.', status: 'Approved', requestedAt: addDaysISO(-4) },
      { id: 'leave-05', employeeId: 'emp-1042', type: 'Casual Leave', startDate: addDaysISO(6), endDate: addDaysISO(6), days: 1, note: 'Family appointment.', status: 'Pending', requestedAt: localISO() },
      { id: 'leave-06', employeeId: 'emp-1079', type: 'Maternity Leave', startDate: addDaysISO(14), endDate: addDaysISO(24), days: 11, note: 'Family leave.', status: 'Pending', requestedAt: addDaysISO(-2) },
      { id: 'leave-07', employeeId: 'emp-1103', type: 'Annual Leave', startDate: addDaysISO(12), endDate: addDaysISO(14), days: 3, note: 'Travel.', status: 'Pending', requestedAt: localISO() },
      { id: 'leave-08', employeeId: 'emp-1090', type: 'Sick Leave', startDate: addDaysISO(-9), endDate: addDaysISO(-9), days: 1, note: 'Not feeling well.', status: 'Approved', requestedAt: addDaysISO(-9) },
    ];
    const jobs = [
      { id: 'job-01', title: 'Senior Frontend Developer', department: 'Engineering', applications: 24, status: 'Open', location: 'Colombo' },
      { id: 'job-02', title: 'Backend Developer', department: 'Engineering', applications: 18, status: 'Open', location: 'Remote' },
      { id: 'job-03', title: 'HR Executive', department: 'HR', applications: 12, status: 'Open', location: 'Colombo' },
      { id: 'job-04', title: 'Marketing Specialist', department: 'Marketing', applications: 10, status: 'Open', location: 'Colombo' },
      { id: 'job-05', title: 'Accountant', department: 'Finance', applications: 8, status: 'Closed', location: 'Kandy' },
    ];
    const candidates = [
      { id: 'app-01', name: 'Olivia Reyes', title: 'Senior Frontend Developer', email: 'olivia.reyes@example.com', stage: 'Applied', source: 'LinkedIn' },
      { id: 'app-02', name: 'Amara Okafor', title: 'Backend Developer', email: 'amara.okafor@example.com', stage: 'Interview', source: 'Referral' },
      { id: 'app-03', name: 'Felix Fischer', title: 'HR Executive', email: 'felix.fischer@example.com', stage: 'Screening', source: 'Careers page' },
      { id: 'app-04', name: 'Sofia Martinez', title: 'Marketing Specialist', email: 'sofia.martinez@example.com', stage: 'Offer', source: 'Referral' },
      { id: 'app-05', name: 'Dev Shah', title: 'Senior Frontend Developer', email: 'dev.shah@example.com', stage: 'Applied', source: 'Careers page' },
    ];
    return {
      currentPage: 'overview',
      employees,
      headcount: 1248,
      summary: { onLeave: 37, pendingApprovals: 12, newHires: 8, attendance: { present: 1162, absent: 45, late: 18, halfDay: 23 } },
      attendance: {
        'emp-1024': { status: 'Present', checkIn: '08:52', checkOut: '17:30' },
        'emp-1031': { status: 'Present', checkIn: '09:30', checkOut: '17:45' },
        'emp-1042': { status: 'Present', checkIn: '09:05', checkOut: '17:20' },
        'emp-1056': { status: 'Late', checkIn: '09:18', checkOut: '17:32' },
        'emp-1068': { status: 'Present', checkIn: '08:47', checkOut: '17:15' },
        'emp-1079': { status: 'Present', checkIn: '09:00', checkOut: '17:40' },
        'emp-1090': { status: 'Present', checkIn: '08:58', checkOut: '17:25' },
        'emp-1103': { status: 'Present', checkIn: '08:49', checkOut: '17:33' },
        'emp-1118': { status: 'Half Day', checkIn: '08:57', checkOut: '13:00' },
        'emp-1132': { status: 'Present', checkIn: '08:54', checkOut: '17:38' },
        'emp-1147': { status: 'Absent', checkIn: '—', checkOut: '—' },
        'emp-1164': { status: 'Present', checkIn: '08:42', checkOut: '17:29' },
      },
      requests,
      jobs,
      candidates,
      goals: [
        { id: 'goal-01', employeeId: 'emp-1024', title: 'Build new feature module', progress: 80, status: 'On Track', department: 'Engineering' },
        { id: 'goal-02', employeeId: 'emp-1031', title: 'Improve employee satisfaction', progress: 91, status: 'On Track', department: 'HR' },
        { id: 'goal-03', employeeId: 'emp-1042', title: 'Lead project delivery', progress: 60, status: 'At Risk', department: 'Finance' },
        { id: 'goal-04', employeeId: 'emp-1056', title: 'Complete certification', progress: 100, status: 'Completed', department: 'Marketing' },
        { id: 'goal-05', employeeId: 'emp-1079', title: 'Improve process cycle time', progress: 70, status: 'On Track', department: 'Operations' },
        { id: 'goal-06', employeeId: 'emp-1090', title: 'Increase releases per sprint', progress: 74, status: 'On Track', department: 'Engineering' },
      ],
      documents: [
        { id: 'doc-01', name: 'Contract - Nimal Silva.pdf', category: 'Contracts', employeeId: 'emp-1024', uploaded: addDaysISO(-15), size: '1.2 MB' },
        { id: 'doc-02', name: 'CV - Ayesha Perera.pdf', category: 'Employee Documents', employeeId: 'emp-1031', uploaded: addDaysISO(-12), size: '840 KB' },
        { id: 'doc-03', name: 'Medical Report - Kasun Fernando.pdf', category: 'Medical', employeeId: 'emp-1042', uploaded: addDaysISO(-10), size: '560 KB' },
        { id: 'doc-04', name: 'Performance Review - Tharushi.pdf', category: 'Performance', employeeId: 'emp-1056', uploaded: addDaysISO(-8), size: '720 KB' },
        { id: 'doc-05', name: 'Salary Revision - Dilshan.pdf', category: 'Payroll', employeeId: 'emp-1068', uploaded: addDaysISO(-5), size: '320 KB' },
        { id: 'doc-06', name: 'Leave Policy 2026.pdf', category: 'Company Policies', employeeId: '', uploaded: addDaysISO(-3), size: '410 KB' },
      ],
      auditLogs: [
        { id: 'log-01', date: new Date(Date.now() - 45 * 60000).toISOString(), user: 'Sarah Johnson', action: 'UPDATE', entity: 'Employee', details: 'Updated salary for EMP-1024' },
        { id: 'log-02', date: new Date(Date.now() - 120 * 60000).toISOString(), user: 'Nimal Silva', action: 'LOGIN', entity: 'System', details: 'User logged in' },
        { id: 'log-03', date: new Date(Date.now() - 190 * 60000).toISOString(), user: 'Ayesha Perera', action: 'CREATE', entity: 'Leave Request', details: 'New leave request submitted' },
        { id: 'log-04', date: new Date(Date.now() - 280 * 60000).toISOString(), user: 'Sarah Johnson', action: 'APPROVE', entity: 'Leave Request', details: 'Approved leave for EMP-1024' },
        { id: 'log-05', date: new Date(Date.now() - 400 * 60000).toISOString(), user: 'Sarah Johnson', action: 'UPDATE', entity: 'Payroll', details: 'Updated payroll structure' },
        { id: 'log-06', date: new Date(Date.now() - 540 * 60000).toISOString(), user: 'Sarah Johnson', action: 'DELETE', entity: 'Document', details: 'Deleted archived document' },
      ],
      birthdays: [
        { employeeId: 'emp-1042', name: 'Kasun Perera', date: addDaysISO(0), label: 'Today' },
        { employeeId: 'emp-1079', name: 'Sadeew Wijesinghe', date: addDaysISO(1), label: 'Tomorrow' },
        { employeeId: 'emp-1068', name: 'Dilshan Fernando', date: addDaysISO(3), label: 'In 3 days' },
      ],
      reviews: [
        { id: 'review-01', employeeId: 'emp-1024', period: 'Q3 2026', status: 'Completed' },
        { id: 'review-02', employeeId: 'emp-1031', period: 'Q3 2026', status: 'Completed' },
        { id: 'review-03', employeeId: 'emp-1042', period: 'Q3 2026', status: 'Pending' },
        { id: 'review-04', employeeId: 'emp-1056', period: 'Q3 2026', status: 'Pending' },
      ],
      organization: { name: 'Northstar Technologies', email: 'hr@northstar.lk', country: 'Sri Lanka', timezone: '(UTC+05:30) Asia/Colombo', language: 'English', currency: 'LKR — Sri Lankan Rupee' },
      settings: { twoFactor: true, weeklyDigest: true, approvalAlerts: true, publicProfiles: false, backupEnabled: true },
      settingsTab: 'General', payrollTab: 'Overview', hiringTab: 'Job Posts', performanceTab: 'Goals', documentsTab: 'All Documents',
      leaveTab: 'All Requests', leaveTypeFilter: 'All Leave Types', leaveStatusFilter: 'All Status', attendanceFilter: 'All Status',
      peopleQuery: '', departmentFilter: 'All Departments', employeeStatusFilter: 'All Status',
      documentQuery: '', documentCategory: 'All Categories', auditFilter: 'All Modules',
      clockStatus: 'off', clockStartedAt: null, payrollHistory: [], notificationsRead: false,
      employeePage: 1, hiringQuery: '', jobDepartmentFilter: 'All Departments', jobStatusFilter: 'All Status', performanceDepartmentFilter: 'All Departments', headcountByDepartment: { Engineering: 420, Marketing: 160, Sales: 190, Finance: 120, HR: 85, Operations: 145, Product: 75, IT: 33, 'Customer Support': 20 },
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.employees)) return seedState();
      const base = seedState();
      return { ...base, ...saved, summary: { ...base.summary, ...(saved.summary || {}), attendance: { ...base.summary.attendance, ...(saved.summary?.attendance || {}) } }, settings: { ...base.settings, ...(saved.settings || {}) }, organization: { ...base.organization, ...(saved.organization || {}) } };
    } catch (_error) { return seedState(); }
  }
  let state = loadState();
  let searchEntries = [];
  let searchIndex = 0;
  let payrollTimer = null;
  const pageRoot = document.getElementById('page-content');
  const modalRoot = document.getElementById('modal-root');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('global-search-input');
  const toastRoot = document.getElementById('toast-stack');

  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) {} }
  function recordAudit(action, entity, details, user = USER.name) {
    state.auditLogs.unshift({ id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, date: new Date().toISOString(), user, action: action.toUpperCase(), entity, details });
    state.auditLogs = state.auditLogs.slice(0, 100);
  }
  function allEmployees() { return state.employees.filter(person => person.status !== 'Archived'); }
  function pageHeading(title, subtitle = '', actions = '') {
    return `<div class="page-heading"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div><div class="page-actions">${actions}</div></div>`;
  }
  function metricCard(label, value, note, iconName, color, trend = '') {
    return `<article class="metric-card"><div class="metric-top"><span class="metric-icon ${color}">${icon(iconName, 19)}</span><span class="metric-trend ${trend.startsWith('-') ? 'negative' : ''}">${trend}</span></div><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><small class="metric-note">${note}</small></article>`;
  }
  function table(headers, body, extraClass = '') {
    return `<div class="table-wrap"><table class="data-table ${extraClass}"><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td class="empty-cell" colspan="${headers.length}">No matching records found.</td></tr>`}</tbody></table></div>`;
  }
  function tabs(items, active, action) {
    return `<div class="tabbar" role="tablist">${items.map(item => `<button class="tab-button ${item === active ? 'active' : ''}" type="button" role="tab" aria-selected="${item === active}" data-action="${action}" data-tab="${escapeHtml(item)}">${item}</button>`).join('')}</div>`;
  }
  function selectOptions(items, selected) { return items.map(item => `<option ${item === selected ? 'selected' : ''}>${escapeHtml(item)}</option>`).join(''); }

  function attendanceChart() {
    const values = [
      { color: '#3e84ee', values: [128, 111, 92, 126, 115, 105, 130] },
      { color: '#22ae92', values: [53, 42, 47, 46, 35, 43, 39] },
      { color: '#e9a353', values: [35, 44, 34, 47, 38, 37, 42] },
    ];
    const xs = [38, 122, 206, 290, 374, 458, 542];
    const labels = Array.from({ length: 7 }, (_, index) => fmtDate(addDaysISO(index - 6), { month: 'short', day: 'numeric' }));
    const mapY = value => 180 - value / 150 * 150;
    const lines = values.map(series => `<polyline points="${series.values.map((value, i) => `${xs[i]},${mapY(value)}`).join(' ')}" fill="none" stroke="${series.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${series.values.map((value, i) => `<circle cx="${xs[i]}" cy="${mapY(value)}" r="2.7" fill="${series.color}"/>`).join('')}`).join('');
    const grid = [0, 50, 100, 150, 200].map((value, index) => `<line x1="34" y1="${180 - index * 38}" x2="558" y2="${180 - index * 38}" stroke="#edf0f5"/><text x="2" y="${184 - index * 38}" fill="#98a2b2" font-size="9">${value}</text>`).join('');
    const xLabels = labels.map((label, i) => `<text x="${xs[i]}" y="204" text-anchor="middle" fill="#929cad" font-size="8">${label}</text>`).join('');
    return `<svg class="attendance-svg" viewBox="0 0 580 218" preserveAspectRatio="none" aria-label="Attendance overview chart">${grid}${lines}${xLabels}</svg>`;
  }
  function leaveDistribution() {
    return `<div class="donut-area"><div class="donut-chart"><div class="donut-center"><small>Total</small><strong>124</strong></div></div><div class="donut-legend"><div><i class="dot blue"></i><span>Annual Leave</span><b>48</b></div><div><i class="dot orange"></i><span>Sick Leave</span><b>32</b></div><div><i class="dot green"></i><span>Casual Leave</span><b>20</b></div><div><i class="dot red"></i><span>Maternity Leave</span><b>8</b></div><div><i class="dot violet"></i><span>Other</span><b>16</b></div></div></div>`;
  }
  function avatarColorFor(person) { return state.employees.indexOf(person) < 0 ? 0 : state.employees.indexOf(person); }

  function renderDashboard() {
    const pending = state.requests.filter(request => request.status === 'Pending');
    const recentRequests = state.requests.slice(0, 4).map(request => {
      const person = employee(request.employeeId) || { name: 'Sarah Johnson' };
      return `<tr><td><div class="table-person">${avatar(person.name, avatarColorFor(person))}<strong>${escapeHtml(person.name)}</strong></div></td><td>${escapeHtml(request.type)}</td><td>${request.days} ${request.days === 1 ? 'day' : 'days'} <small>(${fmtDate(request.startDate)} – ${fmtDate(request.endDate)})</small></td><td>${badge(request.status)}</td><td><button class="row-action" type="button" data-action="request-actions" data-id="${request.id}" aria-label="Review leave request">${icon('more', 15)}</button></td></tr>`;
    }).join('');
    return `<section class="dashboard-page">
      <div class="dashboard-heading"><div><h1>Good Morning, Sarah! <span class="wave">👋</span></h1><p>Here's what's happening in your organization today.</p></div><div class="date-display">${fullDate()} <span class="date-icon">${icon('calendar', 15)}</span></div></div>
      <div class="metrics-grid">
        ${metricCard('Total Employees', new Intl.NumberFormat('en-US').format(state.headcount), 'vs. last month', 'people', 'blue', '↑ 12%')}
        ${metricCard('On Leave Today', '37', 'vs. last week', 'calendar', 'green', '↑ 5%')}
        ${metricCard('Pending Approvals', String(Math.max(state.summary.pendingApprovals, pending.length)), 'vs. last week', 'clock', 'orange', '- 3%')}
        ${metricCard('New Hires (This Month)', '8', 'vs. last month', 'star', 'violet', '↑ 33%')}
      </div>
      <div class="dashboard-chart-grid">
        <section class="panel chart-panel"><div class="panel-header"><div><h2>Attendance Overview</h2><p>Daily attendance trend across your organization.</p></div><div class="panel-meta"><span class="legend-item"><i class="dot blue"></i>Present</span><span class="legend-item"><i class="dot green"></i>Absent</span><span class="legend-item"><i class="dot orange"></i>Half Day</span><span class="chart-range">${fmtDate(addDaysISO(-6))} – ${fmtDate(localISO())}, ${new Date().getFullYear()} <span>${icon('calendar', 12)}</span></span></div></div><div class="chart-container">${attendanceChart()}</div></section>
        <section class="panel chart-panel leave-distribution-panel"><div class="panel-header"><div><h2>Leave Type Distribution</h2><p>Requests by leave category this month.</p></div><button class="row-action" type="button" data-page="timeoff" aria-label="Open leave management">${icon('more', 16)}</button></div>${leaveDistribution()}</section>
      </div>
      <div class="dashboard-bottom-grid">
        <section class="panel table-panel"><div class="panel-header"><div><h2>Recent Leave Requests</h2><p>Latest requests from your team.</p></div><button class="text-link" type="button" data-page="timeoff">View all ${icon('right', 12)}</button></div>${table(['Employee', 'Leave Type', 'Duration', 'Status', 'Action'], recentRequests, 'compact-table')}</section>
        <section class="panel birthdays-panel"><div class="panel-header"><div><h2>Upcoming Birthdays</h2><p>Celebrate the people behind the work.</p></div><button class="text-link" type="button" data-page="people">View all ${icon('right', 12)}</button></div><div class="birthday-list">${state.birthdays.map((item, index) => `<div class="birthday-row">${avatar(item.name, index)}<div class="birthday-copy"><strong>${escapeHtml(item.name)}</strong><small>${fmtDate(item.date, { month: 'short', day: 'numeric' })}</small></div><span class="birthday-label ${index === 1 ? 'tomorrow' : index === 2 ? 'upcoming' : ''}">${item.label}</span></div>`).join('')}</div></section>
      </div>
    </section>`;
  }

  function filteredEmployees() {
    const query = state.peopleQuery.trim().toLowerCase();
    return state.employees.filter(person => {
      const matchesQuery = !query || [person.name, person.code, person.department, person.title, person.email].some(value => String(value || '').toLowerCase().includes(query));
      const matchesDepartment = state.departmentFilter === 'All Departments' || person.department === state.departmentFilter;
      const matchesStatus = state.employeeStatusFilter === 'All Status' || person.status === state.employeeStatusFilter;
      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }
  function employeeRow(person) {
    const index = state.employees.indexOf(person);
    return `<tr><td>${escapeHtml(person.code || 'EMP-0000')}</td><td><div class="table-person">${avatar(person.name, index)}<div class="person-cell-copy"><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.email)}</small></div></div></td><td>${escapeHtml(person.department)}</td><td>${escapeHtml(person.title)}</td><td>${badge(person.status)}</td><td class="action-cell"><button class="row-action blue-action" type="button" data-action="edit-employee" data-id="${person.id}" aria-label="Edit ${escapeHtml(person.name)}">${icon('edit', 14)}</button><button class="row-action" type="button" data-action="delete-employee" data-id="${person.id}" aria-label="More actions for ${escapeHtml(person.name)}">${icon('more', 15)}</button></td></tr>`;
  }
  function peopleTotalLabel(people) {
    const isUnfiltered = !state.peopleQuery && state.departmentFilter === 'All Departments' && state.employeeStatusFilter === 'All Status';
    return isUnfiltered ? new Intl.NumberFormat('en-US').format(state.headcount) : String(people.length);
  }
  function renderPeople() {
    const people = filteredEmployees();
    const pageSize = 6;
    const pages = Math.max(1, Math.ceil(people.length / pageSize));
    const page = Math.min(state.employeePage, pages);
    const visible = people.slice((page - 1) * pageSize, page * pageSize);
    const actions = `<button class="button-primary" type="button" data-action="add-employee">${icon('plus', 14)} Add Employee</button>`;
    return `${pageHeading('Employees', 'Manage your employee records and organizational information.', actions)}
      <div class="filter-toolbar"><label class="search-field">${icon('search', 14)}<input id="people-search" value="${escapeHtml(state.peopleQuery)}" type="search" placeholder="Search by name, employee id, department..." aria-label="Search employees" /></label><select id="department-filter" class="filter-select" aria-label="Filter department">${selectOptions(['All Departments', ...allDepartmentNames()], state.departmentFilter)}</select><select id="employee-status-filter" class="filter-select" aria-label="Filter status">${selectOptions(['All Status', 'Active', 'Inactive', 'On Leave'], state.employeeStatusFilter)}</select></div>
      <section class="panel table-panel directory-panel">${table(['Employee ID', 'Name', 'Department', 'Position', 'Status', 'Actions'], visible.map(employeeRow).join(''), 'compact-table')}<div class="table-footer"><span id="employee-count">Showing ${people.length ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, people.length)} of ${peopleTotalLabel(people)} employees</span><div class="pagination"><button type="button" data-action="employee-page" data-page-number="${Math.max(1, page - 1)}" aria-label="Previous page">‹</button>${Array.from({ length: Math.min(3, pages) }, (_, i) => `<button type="button" class="${page === i + 1 ? 'current' : ''}" data-action="employee-page" data-page-number="${i + 1}">${i + 1}</button>`).join('')}<button type="button" data-action="employee-page" data-page-number="${Math.min(pages, page + 1)}" aria-label="Next page">›</button></div></div></section>`;
  }

  function attendanceRow(person) {
    const row = state.attendance[person.id] || { status: 'Present', checkIn: '09:00', checkOut: '17:30' };
    return `<tr><td><div class="table-person">${avatar(person.name, state.employees.indexOf(person))}<div class="person-cell-copy"><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.code)}</small></div></div></td><td>${escapeHtml(person.department)}</td><td>${escapeHtml(row.checkIn || '—')}</td><td>${escapeHtml(row.checkOut || '—')}</td><td>${badge(row.status)}</td></tr>`;
  }
  function renderAttendance() {
    const actions = `<button class="button-secondary" type="button" data-action="clock-toggle">${icon('clock', 14)} ${state.clockStatus === 'in' ? 'Clock Out' : 'Clock In'}</button><button class="button-primary" type="button" data-action="export-attendance">${icon('download', 14)} Export</button>`;
    const stats = state.summary.attendance;
    const attendancePeople = state.employees.slice(0, 8).filter(person => state.attendanceFilter === 'All Status' || (state.attendance[person.id]?.status || 'Present') === state.attendanceFilter);
    const rows = attendancePeople.map(attendanceRow).join('');
    return `${pageHeading('Attendance', 'Monitor daily attendance, late arrivals, and leave.', actions)}
      <div class="attendance-toolbar"><button class="date-range-button" type="button" data-action="attendance-date">${icon('calendar', 14)} ${fmtDate(addDaysISO(-7))} – ${fmtDate(localISO())}</button><span class="toolbar-caption">Showing attendance summary for selected date range</span></div>
      <div class="metrics-grid attendance-metrics">${metricCard('Present', new Intl.NumberFormat('en-US').format(stats.present), `${Math.round(stats.present / state.headcount * 100)}% of employees`, 'check', 'green', '')}${metricCard('Absent', new Intl.NumberFormat('en-US').format(stats.absent), `${Math.round(stats.absent / state.headcount * 100)}% of employees`, 'close', 'red', '')}${metricCard('Late', new Intl.NumberFormat('en-US').format(stats.late), `${Math.round(stats.late / state.headcount * 100)}% of employees`, 'clock', 'orange', '')}${metricCard('Half Day', new Intl.NumberFormat('en-US').format(stats.halfDay), `${Math.round(stats.halfDay / state.headcount * 100)}% of employees`, 'calendar', 'violet', '')}</div>
      <section class="panel table-panel"><div class="panel-header"><div><h2>Employee Attendance</h2><p>Check-in and check-out records for today.</p></div><select class="filter-select" id="attendance-status-filter" aria-label="Attendance status">${selectOptions(['All Status', 'Present', 'Absent', 'Late', 'Half Day'], state.attendanceFilter)}</select></div>${table(['Employee', 'Department', 'Check In', 'Check Out', 'Status'], rows, 'compact-table')}<div class="table-footer"><span>Showing 1–${Math.min(8, state.employees.length)} of ${new Intl.NumberFormat('en-US').format(state.headcount)} employees</span><button class="text-link" type="button" data-action="attendance-date">View complete attendance ${icon('right', 12)}</button></div></section>`;
  }

  function leaveRow(request) {
    const person = employee(request.employeeId) || { name: USER.name };
    return `<tr><td><div class="table-person">${avatar(person.name, Math.max(0, state.employees.indexOf(person)))}<strong>${escapeHtml(person.name)}</strong></div></td><td>${escapeHtml(request.type)}</td><td>${fmtDate(request.startDate)} – ${fmtDate(request.endDate)} <small>(${request.days} ${request.days === 1 ? 'day' : 'days'})</small></td><td>${badge(request.status)}</td><td class="action-cell">${request.status === 'Pending' ? `<button class="text-link" type="button" data-action="approve-request" data-id="${request.id}">Approve</button><button class="row-action" type="button" data-action="reject-request" data-id="${request.id}" aria-label="Decline request">${icon('close', 13)}</button>` : `<button class="row-action" type="button" data-action="leave-details" data-id="${request.id}" aria-label="View request">${icon('eye', 14)}</button>`}</td></tr>`;
  }
  function renderTimeOff() {
    let requests = [...state.requests];
    if (state.leaveTab === 'My Requests') requests = requests.filter(request => request.employeeId === 'emp-1031');
    if (state.leaveTab === 'Team Requests') requests = requests.filter(request => request.status === 'Pending');
    if (state.leaveTypeFilter !== 'All Leave Types') requests = requests.filter(request => request.type === state.leaveTypeFilter);
    if (state.leaveStatusFilter !== 'All Status') requests = requests.filter(request => request.status === state.leaveStatusFilter);
    const actions = `<button class="button-primary" type="button" data-action="add-request">${icon('plus', 14)} Apply Leave</button>`;
    return `${pageHeading('Leave Management', 'Manage leave requests, approvals, and employee balances.', actions)}
      ${tabs(['My Requests', 'Team Requests', 'All Requests'], state.leaveTab, 'leave-tab')}
      <div class="filter-toolbar leave-filters"><select id="leave-type-filter" class="filter-select">${selectOptions(['All Leave Types', ...LEAVE_TYPES], state.leaveTypeFilter)}</select><select id="leave-status-filter" class="filter-select">${selectOptions(['All Status', 'Pending', 'Approved', 'Declined'], state.leaveStatusFilter)}</select><div class="toolbar-spacer"></div><span class="toolbar-caption">${requests.length} request${requests.length === 1 ? '' : 's'}</span></div>
      <section class="panel table-panel">${table(['Employee', 'Leave Type', 'Duration', 'Status', 'Actions'], requests.map(leaveRow).join(''), 'compact-table')}<div class="table-footer"><span>Leave balance is updated after approval.</span><span class="leave-footnote">✨ Rest is part of the job description.</span></div></section>`;
  }

  const payrollTabs = ['Overview', 'Salary Structure', 'Payslips', 'Deductions & Benefits'];
  function renderPayroll() {
    const actions = `<button class="button-primary" type="button" data-action="run-payroll">${icon('plus', 14)} Generate Payroll</button>`;
    let body = '';
    if (state.payrollTab === 'Overview') {
      const payRows = state.employees.slice(0, 5).map((person, index) => `<tr><td><div class="table-person">${avatar(person.name, index)}<strong>${escapeHtml(person.name)}</strong></div></td><td>${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date())}</td><td>${money(person.salary - Math.round(person.salary * .08))}</td><td>${badge(state.payrollHistory.length ? 'Generated' : 'Processed')}</td><td><button class="row-action" data-action="payslip" data-id="${person.id}" aria-label="View payslip">${icon('eye', 14)}</button></td></tr>`).join('');
      body = `<div class="payroll-stat-grid"><div class="payroll-stat"><span>Total Payroll (LKR)</span><strong>18,742,650</strong><small>↑ 3.2% from last month</small></div><div class="payroll-stat"><span>Total Employees</span><strong>${new Intl.NumberFormat('en-US').format(state.headcount)}</strong><small>Active in payroll</small></div><div class="payroll-stat"><span>Processed</span><strong>1,200</strong><small>96.2% complete</small></div><div class="payroll-stat"><span>Pending</span><strong>48</strong><small>Awaiting review</small></div></div><section class="panel table-panel"><div class="panel-header"><div><h2>Recent Payslips</h2><p>Latest payroll records for employees.</p></div><button class="text-link" data-action="export-payroll">View all ${icon('right', 12)}</button></div>${table(['Employee', 'Pay Period', 'Net Salary', 'Status', 'Actions'], payRows, 'compact-table')}<div class="table-footer"><span>Showing 1–5 of ${new Intl.NumberFormat('en-US').format(state.headcount)} employees</span><button class="text-link" data-action="export-payroll">View all payslips ${icon('right', 12)}</button></div></section>`;
    } else if (state.payrollTab === 'Salary Structure') {
      body = `<section class="panel table-panel">${table(['Department', 'Employees', 'Average Salary', 'Monthly Total'], DEPARTMENTS.slice(0, 6).map((department, i) => `<tr><td>${department}</td><td>${[420, 85, 120, 160, 190, 145][i]}</td><td>${money([485000, 335000, 360000, 315000, 290000, 380000][i])}</td><td>${money([203700000, 28475000, 43200000, 50400000, 55100000, 55100000][i])}</td></tr>`).join(''), 'compact-table')}</section>`;
    } else if (state.payrollTab === 'Payslips') {
      body = `<section class="panel table-panel">${table(['Employee', 'Pay Period', 'Gross Salary', 'Net Salary', 'Status', 'Actions'], state.employees.slice(0, 8).map((person, i) => `<tr><td>${escapeHtml(person.name)}</td><td>${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date())}</td><td>${money(person.salary)}</td><td>${money(person.salary - Math.round(person.salary * .08))}</td><td>${badge('Generated')}</td><td><button class="row-action" data-action="payslip" data-id="${person.id}">${icon('download', 14)}</button></td></tr>`).join(''), 'compact-table')}</section>`;
    } else {
      body = `<div class="payroll-settings-grid"><section class="panel settings-card"><h2>Statutory Deductions</h2><p>Configure recurring payroll deductions.</p><div class="setting-line"><span>EPF contribution</span><strong>8% employee · 12% employer</strong></div><div class="setting-line"><span>ETF contribution</span><strong>3% employer</strong></div><div class="setting-line"><span>APIT tax</span><strong>Enabled</strong></div></section><section class="panel settings-card"><h2>Benefits</h2><p>Company-provided benefits and allowances.</p><div class="setting-line"><span>Medical coverage</span><strong>Included</strong></div><div class="setting-line"><span>Transport allowance</span><strong>Per role</strong></div><div class="setting-line"><span>Meal allowance</span><strong>Monthly</strong></div></section></div>`;
    }
    return `${pageHeading('Payroll', 'Manage payroll processing and employee compensation.', actions)}${tabs(payrollTabs, state.payrollTab, 'payroll-tab')}<div class="payroll-content">${body}<div class="safe-note">${icon('shield', 14)} <span><strong>Demo payroll:</strong> preview calculations only. No payments, tax filings, or bank transfers are initiated.</span></div></div>`;
  }

  const hiringTabs = ['Job Posts', 'Applications', 'Interviews', 'Offers', 'Hired'];
  function renderHiring() {
    const actions = `<button class="button-primary" type="button" data-action="add-job">${icon('plus', 14)} Add Job</button>`;
    let rows = '';
    if (state.hiringTab === 'Job Posts') {
      const visibleJobs = state.jobs.filter(job => (!state.hiringQuery || `${job.title} ${job.department}`.toLowerCase().includes(state.hiringQuery.toLowerCase())) && (state.jobDepartmentFilter === 'All Departments' || job.department === state.jobDepartmentFilter) && (state.jobStatusFilter === 'All Status' || job.status === state.jobStatusFilter));
      rows = visibleJobs.map(job => `<tr><td><strong>${escapeHtml(job.title)}</strong><small class="sub-cell">${escapeHtml(job.location)}</small></td><td>${escapeHtml(job.department)}</td><td>${job.applications}</td><td>${badge(job.status)}</td><td class="action-cell"><button class="row-action blue-action" data-action="edit-job" data-id="${job.id}" aria-label="Edit job">${icon('edit', 14)}</button><button class="row-action" data-action="job-more" data-id="${job.id}" aria-label="More job actions">${icon('more', 15)}</button></td></tr>`).join('');
    } else {
      const stage = { Applications: null, Interviews: 'Interview', Offers: 'Offer', Hired: 'Hired' }[state.hiringTab];
      const candidates = stage ? state.candidates.filter(candidate => candidate.stage === stage) : state.candidates;
      rows = candidates.map(candidate => `<tr><td><div class="table-person">${avatar(candidate.name, state.candidates.indexOf(candidate))}<div class="person-cell-copy"><strong>${escapeHtml(candidate.name)}</strong><small>${escapeHtml(candidate.email)}</small></div></div></td><td>${escapeHtml(candidate.title)}</td><td>${escapeHtml(candidate.source)}</td><td>${badge(candidate.stage)}</td><td><button class="button-link" type="button" data-action="advance-candidate" data-id="${candidate.id}">${candidate.stage === 'Offer' ? 'Mark hired' : 'Move forward'} ${icon('right', 11)}</button></td></tr>`).join('');
    }
    const headers = state.hiringTab === 'Job Posts' ? ['Job Title', 'Department', 'Applications', 'Status', 'Actions'] : ['Applicant', 'Applied For', 'Source', 'Stage', 'Next Step'];
    return `${pageHeading('Recruitment (ATS)', 'Track openings, candidates, and hiring progress.', actions)}${tabs(hiringTabs, state.hiringTab, 'hiring-tab')}<div class="filter-toolbar"><label class="search-field">${icon('search', 14)}<input id="hiring-search" type="search" value="${escapeHtml(state.hiringQuery)}" placeholder="Search title, department..." /></label><select class="filter-select" id="job-department-filter">${selectOptions(['All Departments', ...allDepartmentNames()], state.jobDepartmentFilter)}</select><select class="filter-select" id="job-status-filter">${selectOptions(['All Status', 'Open', 'Closed'], state.jobStatusFilter)}</select></div><section class="panel table-panel">${table(headers, rows, 'compact-table')}<div class="table-footer"><span>Showing ${state.hiringTab === 'Job Posts' ? state.jobs.length : state.candidates.length} records</span><span>Updated just now</span></div></section>`;
  }

  const performanceTabs = ['Goals', 'Reviews', 'KPIs', 'Feedback'];
  function renderPerformance() {
    const actions = `<button class="button-primary" type="button" data-action="create-review">${icon('plus', 14)} Create Review</button>`;
    let rows = '';
    if (state.performanceTab === 'Goals') {
      const visibleGoals = state.goals.filter(goal => state.performanceDepartmentFilter === 'All Departments' || goal.department === state.performanceDepartmentFilter);
      rows = visibleGoals.map(goal => {
        const person = employee(goal.employeeId) || { name: 'Employee' };
        return `<tr><td><div class="table-person">${avatar(person.name, state.employees.indexOf(person))}<strong>${escapeHtml(person.name)}</strong></div></td><td>${escapeHtml(goal.title)}</td><td><div class="progress-cell"><span class="progress-track"><i style="width:${goal.progress}%"></i></span><b>${goal.progress}%</b></div></td><td>${badge(goal.status)}</td><td><button class="button-link" type="button" data-action="goal-checkin" data-id="${goal.id}">Update</button></td></tr>`;
      }).join('');
    } else if (state.performanceTab === 'Reviews') {
      rows = state.reviews.map(review => `<tr><td><div class="table-person">${avatar(employeeName(review.employeeId), Math.max(0, state.employees.findIndex(person => person.id === review.employeeId)))}<strong>${escapeHtml(employeeName(review.employeeId))}</strong></div></td><td>Quarterly performance review</td><td>${escapeHtml(review.period)}</td><td>${badge(review.status)}</td><td><button class="button-link" data-action="review-status" data-id="${review.id}">${review.status === 'Completed' ? 'View review' : 'Complete review'}</button></td></tr>`).join('');
    } else if (state.performanceTab === 'KPIs') {
      rows = state.goals.slice(0, 6).map(goal => `<tr><td>${escapeHtml(employeeName(goal.employeeId))}</td><td>${escapeHtml(goal.title)}</td><td>${goal.progress}%</td><td>${badge(goal.status)}</td></tr>`).join('');
    } else {
      rows = state.employees.slice(0, 5).map((person, index) => `<tr><td><div class="table-person">${avatar(person.name, index)}<strong>${escapeHtml(person.name)}</strong></div></td><td>Quarterly check-in feedback</td><td>${index < 2 ? 'Manager feedback received' : 'Waiting for feedback'}</td><td>${badge(index < 2 ? 'Completed' : 'Pending')}</td></tr>`).join('');
    }
    const headers = state.performanceTab === 'Goals' ? ['Employee', 'Goal', 'Progress', 'Status', 'Actions'] : state.performanceTab === 'Reviews' ? ['Employee', 'Review', 'Period', 'Status', 'Actions'] : state.performanceTab === 'KPIs' ? ['Employee', 'KPI', 'Progress', 'Status'] : ['Employee', 'Feedback', 'Summary', 'Status'];
    return `${pageHeading('Performance Management', 'Track goals, reviews, and employee development.', actions)}${tabs(performanceTabs, state.performanceTab, 'performance-tab')}<div class="filter-toolbar"><select class="filter-select" id="performance-department-filter">${selectOptions(['All Departments', ...allDepartmentNames()], state.performanceDepartmentFilter)}</select><select class="filter-select">${selectOptions(['This Year', 'This Quarter', 'Last Year'], 'This Year')}</select><div class="toolbar-spacer"></div><span class="toolbar-caption">${state.goals.length} active goals · ${state.goals.filter(goal => goal.status === 'Completed').length} completed</span></div><section class="panel table-panel">${table(headers, rows, 'compact-table')}<div class="table-footer"><span>Review cycle: Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}</span><button class="text-link" type="button" data-action="add-goal">+ Add goal</button></div></section>`;
  }

  function renderOrganization() {
    const departments = Object.entries(state.headcountByDepartment).map(([name, count], index) => `<button class="department-card" type="button" data-action="view-department" data-department="${escapeHtml(name)}"><span class="department-icon dept-${index % 6}">${icon(index % 2 ? 'people' : 'building', 17)}</span><span><strong>${escapeHtml(name)}</strong><small>${count} employees</small></span><span class="department-arrow">›</span></button>`).join('');
    return `${pageHeading('Organization', 'Explore teams, reporting lines, and the shape of your organization.', `<button class="button-primary" type="button" data-action="add-department">${icon('plus', 14)} Add Department</button>`)}
      <div class="org-summary"><div class="org-lead"><span class="org-avatar">SJ</span><div><strong>Sarah Johnson</strong><small>HR Administrator · Organization owner</small></div></div><div class="org-connector"></div><div class="org-department-grid">${departments}</div></div>
      <div class="org-footnote">Showing 12 sample employee records across 9 departments · Organization headcount: <strong>${new Intl.NumberFormat('en-US').format(state.headcount)}</strong></div>`;
  }

  function renderDocuments() {
    const search = state.documentQuery.toLowerCase();
    let docs = state.documents.filter(doc => (!search || `${doc.name} ${doc.category} ${employeeName(doc.employeeId)}`.toLowerCase().includes(search)) && (state.documentsTab === 'All Documents' || (state.documentsTab === 'Employee Documents' ? doc.category !== 'Company Policies' : doc.category === 'Company Policies')));
    if (state.documentCategory !== 'All Categories') docs = docs.filter(doc => doc.category === state.documentCategory);
    const rows = docs.map(doc => `<tr><td><div class="doc-name">${icon('fileText', 17)}<span><strong>${escapeHtml(doc.name)}</strong><small>${escapeHtml(doc.size || '—')}</small></span></div></td><td>${escapeHtml(doc.category)}</td><td>${doc.employeeId ? escapeHtml(employeeName(doc.employeeId)) : 'Company'}</td><td>${fmtDate(doc.uploaded, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td class="action-cell"><button class="row-action" data-action="preview-document" data-id="${doc.id}" aria-label="Preview document">${icon('eye', 14)}</button><button class="row-action" data-action="download-document" data-id="${doc.id}" aria-label="Download document">${icon('download', 14)}</button></td></tr>`).join('');
    return `${pageHeading('Documents', 'Securely organize employee files, forms, and company policies.', `<button class="button-primary" type="button" data-action="upload-document">${icon('upload', 14)} Upload Document</button>`)}${tabs(['All Documents', 'Employee Documents', 'Company Policies'], state.documentsTab, 'documents-tab')}<div class="filter-toolbar"><label class="search-field">${icon('search', 14)}<input id="document-search" type="search" value="${escapeHtml(state.documentQuery)}" placeholder="Search documents..." /></label><select class="filter-select" id="document-category-filter">${selectOptions(['All Categories', 'Contracts', 'Employee Documents', 'Company Policies', 'Medical', 'Performance', 'Payroll'], state.documentCategory)}</select><div class="toolbar-spacer"></div><span class="toolbar-caption">${docs.length} documents</span></div><section class="panel table-panel">${table(['Name', 'Category', 'Employee', 'Uploaded On', 'Actions'], rows, 'compact-table')}<div class="table-footer"><span>Document access is limited to authorized HR roles.</span><span>Storage used: 64.8 MB</span></div></section>`;
  }

  function renderReports() {
    const reports = [
      { title: 'Employee Report', subtitle: 'Headcount, joiners, exits, and demographics.', iconName: 'people', color: 'blue' },
      { title: 'Training Report', subtitle: 'Training sessions and completion status.', iconName: 'star', color: 'green' },
      { title: 'Leave Report', subtitle: 'Leave types, balances, and team coverage.', iconName: 'calendar', color: 'orange' },
      { title: 'Payroll Report', subtitle: 'Payroll totals, deductions, and payslips.', iconName: 'wallet', color: 'violet' },
      { title: 'Recruitment Report', subtitle: 'Job posts, applications, and hiring funnel.', iconName: 'briefcase', color: 'violet' },
      { title: 'Performance Report', subtitle: 'Reviews, goals, and performance trends.', iconName: 'target', color: 'red' },
    ];
    const bars = [78, 53, 48, 32, 24, 68, 40, 92, 54].map((height, index) => `<i style="height:${height}%;animation-delay:${index * 60}ms"></i>`).join('');
    return `${pageHeading('Reports & Analytics', 'Turn HR data into a clear view of your organization.', `<button class="button-primary" type="button" data-action="export-report">${icon('download', 14)} Export Report</button>`)}<div class="report-shortcuts">${reports.map(report => `<button class="report-shortcut" type="button" data-action="download-report" data-report="${escapeHtml(report.title)}"><span class="report-icon ${report.color}">${icon(report.iconName, 17)}</span><strong>${report.title}</strong><small>${report.subtitle}</small><span class="shortcut-download">${icon('download', 13)} Download</span></button>`).join('')}</div><div class="reports-charts"><section class="panel report-chart-panel"><div class="panel-header"><div><h2>Employee Distribution</h2><p>Headcount by department.</p></div><select class="filter-select">${selectOptions(['This Year', 'This Quarter'], 'This Year')}</select></div><div class="employee-distribution"><div class="report-donut"><div class="donut-center"><small>Total</small><strong>${new Intl.NumberFormat('en-US').format(state.headcount)}</strong></div></div><div class="report-legend">${Object.entries(state.headcountByDepartment).slice(0, 6).map(([name, count], i) => `<div><i class="dot ${['blue','orange','green','red','violet','teal'][i]}"></i><span>${escapeHtml(name)}</span><b>${count}</b></div>`).join('')}</div></div></section><section class="panel report-chart-panel"><div class="panel-header"><div><h2>Department-wise Headcount</h2><p>Employee distribution across teams.</p></div><button class="row-action" data-action="export-report" aria-label="Export headcount report">${icon('download', 14)}</button></div><div class="headcount-chart">${Object.entries(state.headcountByDepartment).slice(0, 7).map(([name, count], i) => `<div class="headcount-col"><span style="height:${[81,42,37,28,58,48,25][i]}%"></span><small>${name.split(' ')[0].slice(0,3)}</small><b>${count}</b></div>`).join('')}</div></section></div>`;
  }

  function renderAudit() {
    const logs = state.auditLogs.filter(log => state.auditFilter === 'All Modules' || log.entity === state.auditFilter);
    const rows = logs.map(log => `<tr><td>${fmtDateTime(log.date)}</td><td>${escapeHtml(log.user)}</td><td><span class="audit-action ${escapeHtml(log.action.toLowerCase())}">${escapeHtml(log.action)}</span></td><td>${escapeHtml(log.entity)}</td><td>${escapeHtml(log.details)}</td></tr>`).join('');
    return `${pageHeading('Audit Logs', 'Review important activity across your HRMS workspace.', `<button class="button-primary" type="button" data-action="export-audit">${icon('download', 14)} Export</button>`)}<div class="filter-toolbar"><select id="audit-filter" class="filter-select">${selectOptions(['All Modules', 'Employee', 'Leave Request', 'Payroll', 'Document', 'Recruitment', 'Settings'], state.auditFilter)}</select><button class="date-range-button" type="button" data-action="audit-date">${icon('calendar', 14)} Last 30 days</button><span class="toolbar-spacer"></span><span class="toolbar-caption">${logs.length} entries</span></div><section class="panel table-panel">${table(['Date & Time', 'User', 'Action', 'Entity', 'Details'], rows, 'compact-table audit-table')}<div class="table-footer"><span>Audit records are retained for 12 months.</span><span>Most recent first</span></div></section>`;
  }

  const settingsTabs = ['General', 'Security', 'Roles & Permissions', 'System'];
  function renderSettings() {
    let content = '';
    if (state.settingsTab === 'General') {
      content = `<section class="panel settings-panel"><div class="settings-section"><h2>Company Information</h2><p>Manage your organization details and regional preferences.</p><div class="settings-form-grid"><label>Company Name<input id="company-name" value="${escapeHtml(state.organization.name)}" /></label><label>Company Email<input id="company-email" value="${escapeHtml(state.organization.email)}" /></label><label>Country<select id="company-country">${selectOptions(['Sri Lanka', 'India'], state.organization.country)}</select></label><label>Time Zone<select id="company-timezone">${selectOptions(['(UTC+05:30) Asia/Colombo'], state.organization.timezone)}</select></label><label>Default Language<select id="company-language">${selectOptions(['English', 'Sinhala', 'Tamil'], state.organization.language)}</select></label><label>Currency<select id="company-currency">${selectOptions(['LKR — Sri Lankan Rupee'], state.organization.currency)}</select></label></div><button class="button-primary" data-action="save-settings">Save Changes</button></div><div class="settings-section"><h2>Notifications</h2><p>Choose which workspace notifications you receive.</p>${settingToggle('weeklyDigest', 'Weekly HR digest', 'Get a summary of changes each Friday.')}${settingToggle('approvalAlerts', 'Approval alerts', 'Receive a notification when an approval is waiting.')}</div></section>`;
    } else if (state.settingsTab === 'Security') {
      content = `<section class="panel settings-panel"><div class="settings-section"><h2>Security Settings</h2><p>Manage account security and access controls.</p>${settingToggle('twoFactor', 'Two-factor authentication', 'Require a second verification step at sign in.')}${settingToggle('publicProfiles', 'Employee profile visibility', 'Allow employees to see basic coworker profiles.')}${settingToggle('backupEnabled', 'Automatic data backup', 'Create a secure daily workspace backup.')}</div><div class="settings-section"><h2>Session Security</h2><div class="settings-form-grid"><label>Session timeout<select><option>60 minutes</option><option>30 minutes</option><option>15 minutes</option></select></label><label>Password policy<select><option>Strong — 12 characters required</option></select></label></div></div></section>`;
    } else if (state.settingsTab === 'Roles & Permissions') {
      content = `<section class="panel table-panel"><div class="panel-header"><div><h2>User Roles</h2><p>Control who can view and manage HRMS data.</p></div><button class="button-primary button-small" data-action="add-role">${icon('plus', 13)} Add Role</button></div>${table(['Role Name', 'Description', 'Users', 'Actions'], [['Super Admin','Full system access','2'],['HR Admin','HR and employee management','12'],['Manager','Team management and approvals','48'],['Employee','Own profile and leave','1,186']].map(row => `<tr><td><strong>${row[0]}</strong></td><td>${row[1]}</td><td>${row[2]}</td><td><button class="row-action" data-action="edit-role" aria-label="Edit ${row[0]}">${icon('edit', 14)}</button></td></tr>`).join(''))}</section>`;
    } else {
      content = `<section class="panel settings-panel"><div class="settings-section"><h2>System Preferences</h2><p>Configure system-level behavior for the workspace.</p>${settingToggle('backupEnabled', 'Automatic backups', 'Daily encrypted backups are stored for recovery.')}${settingToggle('approvalAlerts', 'Approval reminders', 'Remind approvers about requests older than 48 hours.')}</div><div class="settings-section"><h2>Data &amp; Privacy</h2><p>All sample changes are stored only in this browser.</p><button class="button-secondary" data-action="reset-demo">Reset Demo Data</button></div></section>`;
    }
    return `${pageHeading('Settings', 'Manage organization preferences, security, and access.', '')}${tabs(settingsTabs, state.settingsTab, 'settings-tab')}<div class="settings-content">${content}</div>`;
  }
  function settingToggle(key, title, detail) { return `<div class="setting-row"><span><strong>${title}</strong><small>${detail}</small></span><button class="switch ${state.settings[key] ? 'on' : ''}" role="switch" aria-checked="${state.settings[key]}" data-action="toggle-setting" data-key="${key}" aria-label="${title}"></button></div>`; }

  const renderers = { overview: renderDashboard, people: renderPeople, organization: renderOrganization, attendance: renderAttendance, timeoff: renderTimeOff, payroll: renderPayroll, hiring: renderHiring, performance: renderPerformance, documents: renderDocuments, reports: renderReports, audit: renderAudit, settings: renderSettings };
  function render() {
    pageRoot.innerHTML = (renderers[state.currentPage] || renderDashboard)();
    document.querySelectorAll('.nav-item[data-page]').forEach(button => button.classList.toggle('is-active', button.dataset.page === state.currentPage));
    const count = document.getElementById('people-nav-count'); if (count) count.textContent = new Intl.NumberFormat('en-US').format(state.headcount);
    const leaveCount = document.getElementById('leave-nav-count'); if (leaveCount) leaveCount.textContent = String(state.requests.filter(request => request.status === 'Pending').length);
  }
  function navigate(page) {
    if (!PAGE_LABELS[page]) return;
    state.currentPage = page; save(); render();
    document.getElementById('sidebar')?.classList.remove('is-open'); document.body.classList.remove('sidebar-open');
    document.getElementById('notification-popover')?.setAttribute('hidden', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function modalShell(title, subtitle, body, footer, narrow = false) {
    return `<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal-card ${narrow ? 'modal-narrow' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close', 15)}</button></header><div class="modal-body">${body}</div><footer class="modal-footer">${footer}</footer></section></div>`;
  }
  function closeModal() { modalRoot.innerHTML = ''; document.body.classList.remove('modal-open'); }
  function openModal(type, id = '') {
    let html = '';
    if (type === 'employee') {
      const person = state.employees.find(item => item.id === id);
      const item = person || { name: '', code: `EMP-${Math.floor(1200 + Math.random() * 300)}`, email: '', department: 'Engineering', title: '', status: 'Active', location: 'Colombo', startDate: localISO(), salary: '' };
      html = modalShell(person ? 'Edit Employee' : 'Add Employee', 'Enter employee details below.', `<form id="modal-form" data-form-type="employee" data-id="${escapeHtml(id)}"><div class="form-grid"><label>Full Name<input name="name" required value="${escapeHtml(item.name)}" placeholder="Employee name" /></label><label>Employee ID<input name="code" required value="${escapeHtml(item.code)}" /></label><label>Work Email<input name="email" type="email" required value="${escapeHtml(item.email)}" placeholder="name@company.lk" /></label><label>Department<select name="department">${selectOptions(allDepartmentNames(), item.department)}</select></label><label>Position<input name="title" required value="${escapeHtml(item.title)}" /></label><label>Status<select name="status">${selectOptions(['Active', 'Inactive', 'On Leave'], item.status)}</select></label><label>Location<input name="location" value="${escapeHtml(item.location)}" /></label><label>Monthly Salary (LKR)<input name="salary" type="number" min="0" value="${escapeHtml(item.salary)}" /></label><label>Joining Date<input name="startDate" type="date" value="${escapeHtml(item.startDate)}" /></label></div></form>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button>${person ? `<button class="button-danger" type="button" data-action="delete-employee" data-id="${id}">Delete</button>` : ''}<button class="button-primary" type="submit" form="modal-form">${person ? 'Save Changes' : 'Add Employee'}</button>`);
    } else if (type === 'request') {
      html = modalShell('Apply for Leave', 'Send a leave request to your manager for approval.', `<form id="modal-form" data-form-type="leave"><div class="form-grid"><label>Employee<select name="employeeId">${state.employees.map(person => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join('')}</select></label><label>Leave Type<select name="type">${selectOptions(LEAVE_TYPES, 'Annual Leave')}</select></label><label>From Date<input name="startDate" type="date" required value="${addDaysISO(1)}" /></label><label>To Date<input name="endDate" type="date" required value="${addDaysISO(1)}" /></label><label class="full-field">Reason<textarea name="note" placeholder="Add a short note for your manager."></textarea></label></div></form>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Submit Request</button>`, true);
    } else if (type === 'job') {
      const job = state.jobs.find(item => item.id === id) || { title: '', department: 'Engineering', applications: 0, status: 'Open', location: 'Colombo' };
      html = modalShell(id ? 'Edit Job Post' : 'Add Job Post', 'Create or update a job opening.', `<form id="modal-form" data-form-type="job" data-id="${id}"><div class="form-grid"><label>Job Title<input name="title" required value="${escapeHtml(job.title)}" placeholder="e.g. Senior Frontend Developer" /></label><label>Department<select name="department">${selectOptions(allDepartmentNames(), job.department)}</select></label><label>Location<input name="location" value="${escapeHtml(job.location)}" /></label><label>Status<select name="status">${selectOptions(['Open', 'Closed'], job.status)}</select></label></div></form>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Save Job</button>`, true);
    } else if (type === 'document') {
      html = modalShell('Upload Document', 'Add a document to the secure HR library.', `<form id="modal-form" data-form-type="document"><div class="form-grid"><label>Document Name<input name="name" required placeholder="e.g. Employee contract.pdf" /></label><label>Category<select name="category">${selectOptions(['Contracts', 'Employee Documents', 'Company Policies', 'Medical', 'Performance', 'Payroll'], 'Employee Documents')}</select></label><label>Employee<select name="employeeId"><option value="">Company document</option>${state.employees.map(person => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join('')}</select></label><label>Choose File<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" /></label></div><p class="form-help">For this browser-only demo, only the file name and metadata are stored.</p></form>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Upload Document</button>`, true);
    } else if (type === 'goal') {
      html = modalShell('Add Performance Goal', 'Set a clear goal and assign an owner.', `<form id="modal-form" data-form-type="goal"><div class="form-grid"><label>Employee<select name="employeeId">${state.employees.map(person => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join('')}</select></label><label>Department<select name="department">${selectOptions(allDepartmentNames(), 'Engineering')}</select></label><label class="full-field">Goal<input name="title" required placeholder="e.g. Complete certification" /></label></div></form>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Add Goal</button>`, true);
    } else if (type === 'review') {
      html = modalShell('Create Performance Review', 'Start a review cycle for an employee.', `<form id="modal-form" data-form-type="review"><div class="form-grid"><label>Employee<select name="employeeId">${state.employees.map(person => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join('')}</select></label><label>Review Period<select name="period"><option>Current Quarter</option><option>Annual Review</option><option>Probation Review</option></select></label></div></form>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Create Review</button>`, true);
    } else if (type === 'payroll') {
      html = modalShell('Generate Payroll?', 'Review before generating the current payroll batch.', `<div class="confirm-box"><strong>Payroll preview summary</strong><p>${new Intl.NumberFormat('en-US').format(state.headcount)} employees · LKR 18,742,650 estimated gross payroll.</p><p>This prototype records a demo run only. No payments, taxes, or bank transfers are initiated.</p></div><label class="confirm-check"><input id="payroll-confirm-check" type="checkbox" /> I confirm the sample payroll information has been reviewed.</label>`, `<button class="button-secondary" type="button" data-action="close-modal">Cancel</button><button id="confirm-payroll" class="button-primary" type="button" data-action="confirm-payroll" disabled>Generate Payroll</button>`, true);
    } else if (type === 'profile') {
      html = modalShell('Sarah Johnson', 'HR Administrator · Northstar Technologies', `<div class="profile-modal"><span class="user-avatar large">SJ</span><div><strong>${USER.email}</strong><p>Last sign in: Today at ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}</p></div></div><div class="confirm-box">Your profile and workspace preferences can be managed from Settings.</div>`, `<button class="button-secondary" data-action="close-modal">Close</button><button class="button-primary" data-action="open-settings">Open Settings</button>`, true);
    } else if (type === 'request-details') {
      const req = state.requests.find(item => item.id === id);
      if (!req) return;
      html = modalShell('Leave Request Details', employeeName(req.employeeId), `<div class="details-grid"><span>Leave type</span><strong>${escapeHtml(req.type)}</strong><span>Duration</span><strong>${fmtDate(req.startDate)} – ${fmtDate(req.endDate)} (${req.days} days)</strong><span>Status</span><strong>${badge(req.status)}</strong><span>Reason</span><strong>${escapeHtml(req.note || 'No reason provided')}</strong></div>`, `<button class="button-secondary" type="button" data-action="close-modal">Close</button>${req.status === 'Pending' ? `<button class="button-primary" type="button" data-action="approve-request" data-id="${req.id}">Approve Request</button>` : ''}`, true);
    } else if (type === 'reset') {
      html = modalShell('Reset demo data?', 'This restores the original sample workspace.', `<div class="confirm-box">Your locally saved changes will be removed. No server or real HR data is affected.</div>`, `<button class="button-secondary" data-action="close-modal">Cancel</button><button class="button-danger" data-action="confirm-reset">Reset Data</button>`, true);
    } else if (type === 'department') {
      html = modalShell('Add Department', 'Create a team in the organization structure.', `<form id="modal-form" data-form-type="department"><div class="form-grid"><label>Department Name<input name="name" required placeholder="e.g. Customer Success" /></label><label>Initial Headcount<input name="headcount" type="number" min="0" value="0" /></label></div></form>`, `<button class="button-secondary" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Add Department</button>`, true);
    } else if (type === 'role') {
      html = modalShell('Add a Role', 'Create a workspace permission group.', `<form id="modal-form" data-form-type="role"><div class="form-grid"><label>Role Name<input name="name" required placeholder="e.g. Department Manager" /></label><label>Description<input name="description" required placeholder="Describe this role" /></label></div></form>`, `<button class="button-secondary" data-action="close-modal">Cancel</button><button class="button-primary" type="submit" form="modal-form">Save Role</button>`, true);
    }
    if (!html) return;
    modalRoot.innerHTML = html;
    document.body.classList.add('modal-open');
    setTimeout(() => modalRoot.querySelector('input:not([type=checkbox]), select, button')?.focus(), 20);
  }

  function toast(title, message = '', celebrate = false) {
    const node = document.createElement('div'); node.className = 'toast';
    node.innerHTML = `${celebrate ? '<i class="confetti"></i><i class="confetti"></i><i class="confetti"></i>' : ''}<span class="toast-check">${icon('check', 14)}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(message)}</small></span>`;
    toastRoot.appendChild(node); setTimeout(() => { node.classList.add('leaving'); setTimeout(() => node.remove(), 240); }, 3300);
  }
  function exportCSV(filename, headers, rows) {
    const q = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const text = [headers.map(q).join(','), ...rows.map(row => row.map(q).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
    toast('Export ready', `${filename} downloaded.`);
  }
  function exportEmployees() { exportCSV('hrms-employees.csv', ['Employee ID','Name','Department','Position','Email','Status','Salary LKR'], state.employees.map(person => [person.code,person.name,person.department,person.title,person.email,person.status,person.salary])); }
  function exportAttendance() { exportCSV('hrms-attendance.csv', ['Employee','Department','Check in','Check out','Status'], state.employees.map(person => { const item = state.attendance[person.id] || {}; return [person.name,person.department,item.checkIn,item.checkOut,item.status]; })); }
  function exportLeaves() { exportCSV('hrms-leave.csv', ['Employee','Type','Start','End','Days','Status'], state.requests.map(request => [employeeName(request.employeeId),request.type,request.startDate,request.endDate,request.days,request.status])); }
  function exportAudit() { exportCSV('hrms-audit-logs.csv', ['Date','User','Action','Entity','Details'], state.auditLogs.map(log => [log.date,log.user,log.action,log.entity,log.details])); }
  function renderSearchResults(query) {
    const value = query.trim().toLowerCase();
    const people = state.employees.filter(person => !value || `${person.name} ${person.code} ${person.department} ${person.title}`.toLowerCase().includes(value)).slice(0, 5).map(person => ({ type: 'employee', id: person.id, title: person.name, subtitle: `${person.code} · ${person.department}`, color: state.employees.indexOf(person) }));
    const pages = Object.entries(PAGE_LABELS).filter(([key, label]) => !value || `${key} ${label}`.toLowerCase().includes(value)).slice(0, 5).map(([id, title]) => ({ type: 'page', id, title, subtitle: 'HRMS module' }));
    searchEntries = [...people, ...pages]; searchIndex = Math.min(searchIndex, Math.max(0, searchEntries.length - 1));
    const root = document.getElementById('search-results');
    if (!searchEntries.length) { root.innerHTML = '<div class="search-empty">No results found. Try another name or module.</div>'; return; }
    root.innerHTML = `${people.length ? `<div class="search-section-label">Employees</div>${people.map((item, index) => searchResult(item, index)).join('')}` : ''}${pages.length ? `<div class="search-section-label">Modules</div>${pages.map(item => searchResult(item, searchEntries.indexOf(item))).join('')}` : ''}`;
  }
  function searchResult(item, index) { return `<button class="search-result ${index === searchIndex ? 'selected' : ''}" data-action="search-result" data-type="${item.type}" data-id="${item.id}">${item.type === 'employee' ? avatar(item.title, item.color) : `<span class="result-icon">${icon('overview', 15)}</span>`}<span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span><i>${item.type === 'employee' ? 'Employee' : 'Module'}</i></button>`; }
  function openSearch() { searchOverlay.classList.add('is-open'); searchOverlay.setAttribute('aria-hidden', 'false'); searchInput.value = ''; searchIndex = 0; renderSearchResults(''); setTimeout(() => searchInput.focus(), 10); }
  function closeSearch() { searchOverlay.classList.remove('is-open'); searchOverlay.setAttribute('aria-hidden', 'true'); }
  function toggleNotifications() {
    const panel = document.getElementById('notification-popover');
    if (!panel.hidden) { panel.hidden = true; return; }
    const pending = state.requests.filter(request => request.status === 'Pending').length;
    panel.innerHTML = `<div class="notification-head"><strong>Notifications</strong><button data-action="mark-read">Mark all read</button></div><div class="notification-item"><span class="notification-symbol">${icon('calendar', 14)}</span><span><strong>${pending} leave requests need review</strong><small>Review your team’s latest requests.</small><time>Just now</time></span></div><div class="notification-item"><span class="notification-symbol">${icon('briefcase', 14)}</span><span><strong>8 new employees this month</strong><small>Your onboarding checklist is ready.</small><time>Today</time></span></div>`;
    panel.hidden = false;
  }
  function clockToggle() { state.clockStatus = state.clockStatus === 'in' ? 'out' : 'in'; state.clockStartedAt = state.clockStatus === 'in' ? new Date().toISOString() : state.clockStartedAt; recordAudit(state.clockStatus === 'in' ? 'Clock In' : 'Clock Out', 'Attendance', `${USER.name} ${state.clockStatus === 'in' ? 'clocked in' : 'clocked out'}`); save(); render(); toast(state.clockStatus === 'in' ? 'Clocked in' : 'Clocked out', 'Attendance entry saved in this browser.', true); }
  function approveRequest(id, approved) { const request = state.requests.find(item => item.id === id); if (!request) return; request.status = approved ? 'Approved' : 'Declined'; state.summary.pendingApprovals = Math.max(0, state.summary.pendingApprovals - 1); recordAudit(approved ? 'Approve' : 'Decline', 'Leave Request', `${approved ? 'Approved' : 'Declined'} leave for ${employeeName(request.employeeId)}`); save(); closeModal(); render(); toast(approved ? 'Leave approved' : 'Request declined', `${employeeName(request.employeeId)} has been updated.`, approved); }
  function runPayroll() { closeModal(); toast('Payroll is processing', 'Calculating the sample payroll run.'); document.body.classList.add('is-processing'); clearTimeout(payrollTimer); payrollTimer = setTimeout(() => { state.payrollHistory.unshift({ date: localISO(), total: 18742650 }); recordAudit('Generate', 'Payroll', 'Generated a sample monthly payroll batch'); save(); document.body.classList.remove('is-processing'); render(); toast('Payroll complete', 'Sample payroll generated. No payments were sent.', true); }, 1500); }

  function handleAction(action, target, event) {
    const id = target.dataset.id || '';
    switch (action) {
      case 'open-sidebar': document.getElementById('sidebar').classList.add('is-open'); document.body.classList.add('sidebar-open'); break;
      case 'close-sidebar': document.getElementById('sidebar').classList.remove('is-open'); document.body.classList.remove('sidebar-open'); break;
      case 'open-search': openSearch(); break;
      case 'close-search': closeSearch(); break;
      case 'toggle-notifications': toggleNotifications(); break;
      case 'mark-read': state.notificationsRead = true; save(); document.getElementById('notification-popover').hidden = true; document.querySelector('.notification-dot').classList.add('is-read'); toast('All caught up', 'Notifications marked as read.'); break;
      case 'profile-menu': openModal('profile'); break;
      case 'open-settings': closeModal(); navigate('settings'); break;
      case 'help': openModal('profile'); break;
      case 'add-employee': openModal('employee'); break;
      case 'edit-employee': openModal('employee', id); break;
      case 'delete-employee':
        if (modalRoot.innerHTML) { const person = employee(id); if (person) { state.employees = state.employees.filter(item => item.id !== id); delete state.attendance[id]; state.requests = state.requests.filter(item => item.employeeId !== id); state.goals = state.goals.filter(item => item.employeeId !== id); state.reviews = state.reviews.filter(item => item.employeeId !== id); state.headcount = Math.max(0, state.headcount - 1); state.headcountByDepartment[person.department] = Math.max(0, (state.headcountByDepartment[person.department] || 0) - 1); recordAudit('Delete', 'Employee', `Deleted ${person.code} ${person.name}`); save(); closeModal(); render(); toast('Employee removed', `${person.name} removed from the demo directory.`); } }
        else openModal('employee', id);
        break;
      case 'employee-page': state.employeePage = Number(target.dataset.pageNumber) || 1; render(); break;
      case 'leave-tab': state.leaveTab = target.dataset.tab; render(); break;
      case 'payroll-tab': state.payrollTab = target.dataset.tab; render(); break;
      case 'hiring-tab': state.hiringTab = target.dataset.tab; render(); break;
      case 'performance-tab': state.performanceTab = target.dataset.tab; render(); break;
      case 'documents-tab': state.documentsTab = target.dataset.tab; render(); break;
      case 'settings-tab': state.settingsTab = target.dataset.tab; render(); break;
      case 'add-request': openModal('request'); break;
      case 'approve-request': approveRequest(id, true); break;
      case 'reject-request': approveRequest(id, false); break;
      case 'leave-details': openModal('request-details', id); break;
      case 'request-actions': openModal('request-details', id); break;
      case 'clock-toggle': clockToggle(); break;
      case 'attendance-date': toast('Attendance date range', `${fmtDate(addDaysISO(-7))} – ${fmtDate(localISO())}`); break;
      case 'payslip': { const person = employee(id); if (person) { modalRoot.innerHTML = modalShell('Employee Payslip', `${person.code} · ${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date())}`, `<div class="details-grid"><span>Employee</span><strong>${escapeHtml(person.name)}</strong><span>Gross salary</span><strong>${money(person.salary)}</strong><span>EPF / deductions</span><strong>${money(Math.round(person.salary * .08))}</strong><span>Net salary</span><strong>${money(person.salary - Math.round(person.salary * .08))}</strong></div><div class="safe-note">${icon('shield', 14)} Demo payslip preview only.</div>`, `<button class="button-secondary" data-action="close-modal">Close</button><button class="button-primary" data-action="export-payroll">Export CSV</button>`, true); document.body.classList.add('modal-open'); } break; }
      case 'export-attendance': exportAttendance(); break;
      case 'export-employees': exportEmployees(); break;
      case 'export-payroll': exportCSV('hrms-payslips.csv', ['Employee','Pay Period','Monthly Salary LKR'], state.employees.map(person => [person.name,fullDate(),person.salary])); break;
      case 'run-payroll': openModal('payroll'); break;
      case 'confirm-payroll': runPayroll(); break;
      case 'advance-candidate': {
        const candidate = state.candidates.find(item => item.id === id); if (!candidate) break;
        const stages = ['Applied','Screening','Interview','Offer','Hired']; const index = stages.indexOf(candidate.stage); if (candidate.stage === 'Hired') { toast('Already hired', `${candidate.name} is already on the team.`); break; } candidate.stage = stages[Math.min(stages.length - 1, index + 1)];
        recordAudit('Update', 'Recruitment', `Moved ${candidate.name} to ${candidate.stage}`); save(); render(); toast('Candidate updated', `${candidate.name} moved to ${candidate.stage}.`, true); break;
      }
      case 'add-job': openModal('job'); break;
      case 'edit-job': openModal('job', id); break;
      case 'job-more': { const job = state.jobs.find(item => item.id === id); if (job) { job.status = job.status === 'Open' ? 'Closed' : 'Open'; recordAudit('Update', 'Recruitment', `${job.status} job post ${job.title}`); save(); render(); toast(`Job ${job.status.toLowerCase()}`, job.title); } break; }
      case 'create-review': openModal('review'); break;
      case 'add-goal': openModal('goal'); break;
      case 'goal-checkin': { const goal = state.goals.find(item => item.id === id); if (goal) { goal.progress = Math.min(100, goal.progress + 10); goal.status = goal.progress === 100 ? 'Completed' : 'On Track'; recordAudit('Update', 'Performance', `Updated goal progress for ${employeeName(goal.employeeId)}`); save(); render(); toast('Progress updated', 'Small steps add up.', true); } break; }
      case 'add-department': openModal('department'); break;
      case 'review-status': { const review = state.reviews.find(item => item.id === id); if (review) { review.status = review.status === 'Completed' ? 'Pending' : 'Completed'; recordAudit('Update', 'Performance', `Set ${employeeName(review.employeeId)} review to ${review.status}`); save(); render(); toast('Review updated', `${employeeName(review.employeeId)} · ${review.status}`); } break; }
      case 'view-department': state.departmentFilter = target.dataset.department; state.peopleQuery = ''; state.employeeStatusFilter = 'All Status'; navigate('people'); break;
      case 'upload-document': openModal('document'); break;
      case 'preview-document': { const doc = state.documents.find(item => item.id === id); if (doc) { modalRoot.innerHTML = modalShell('Document Preview', escapeHtml(doc.name), `<div class="document-preview">${icon('fileText', 40)}<strong>${escapeHtml(doc.name)}</strong><span>${escapeHtml(doc.category)} · ${escapeHtml(doc.size)}</span><p>Preview mode: document metadata is available in this demo workspace.</p></div>`, `<button class="button-secondary" data-action="close-modal">Close</button><button class="button-primary" data-action="download-document" data-id="${id}">Download</button>`, true); document.body.classList.add('modal-open'); } break; }
      case 'download-document': { const doc = state.documents.find(item => item.id === id); if (doc) { const blob = new Blob([`HRMS document preview\n${doc.name}\nCategory: ${doc.category}\nEmployee: ${employeeName(doc.employeeId)}\n`], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = doc.name.replace(/\.[^.]+$/, '') + '.txt'; a.click(); URL.revokeObjectURL(url); toast('Document downloaded', 'Demo metadata file created.'); } break; }
      case 'delete-document': { state.documents = state.documents.filter(doc => doc.id !== id); recordAudit('Delete', 'Document', `Deleted document ${id}`); save(); render(); toast('Document removed'); break; }
      case 'export-report': exportCSV('hrms-analytics-summary.csv', ['Metric','Value'], [['Employees',state.headcount],['Attendance present',state.summary.attendance.present],['Leave requests',state.requests.length],['Open jobs',state.jobs.filter(job=>job.status==='Open').length]]); break;
      case 'download-report': exportCSV(`${target.dataset.report.toLowerCase().replaceAll(' ','-')}.csv`, ['Employee ID','Name','Department','Position'], state.employees.map(person => [person.code,person.name,person.department,person.title])); break;
      case 'export-audit': exportAudit(); break;
      case 'audit-date': toast('Audit date filter', 'Showing the latest 30 days of workspace activity.'); break;
      case 'toggle-setting': state.settings[target.dataset.key] = !state.settings[target.dataset.key]; recordAudit('Update', 'Settings', `Changed ${target.dataset.key} preference`); save(); render(); toast('Setting saved', 'Your workspace preference has been updated.'); break;
      case 'save-settings': { state.organization = { name: document.getElementById('company-name')?.value || state.organization.name, email: document.getElementById('company-email')?.value || state.organization.email, country: document.getElementById('company-country')?.value || state.organization.country, timezone: document.getElementById('company-timezone')?.value || state.organization.timezone, language: document.getElementById('company-language')?.value || state.organization.language, currency: document.getElementById('company-currency')?.value || state.organization.currency }; recordAudit('Update', 'Settings', 'Updated company information'); save(); render(); toast('Settings saved', 'Company preferences updated.'); break; }
      case 'add-role': openModal('role'); break;
      case 'edit-role': toast('Role permissions', 'Role details are ready to review.'); break;
      case 'reset-demo': openModal('reset'); break;
      case 'confirm-reset': state = seedState(); save(); closeModal(); render(); toast('Demo data reset', 'The original sample workspace is back.', true); break;
      case 'search-result': { const entry = searchEntries.find(item => item.id === id && item.type === target.dataset.type); if (!entry) break; closeSearch(); if (entry.type === 'page') navigate(entry.id); else { state.peopleQuery = employee(id)?.name || ''; state.departmentFilter = 'All Departments'; state.employeeStatusFilter = 'All Status'; navigate('people'); } break; }
      case 'modal-backdrop': if (event && event.target === target) closeModal(); break;
      case 'close-modal': closeModal(); break;
      default: break;
    }
  }

  document.addEventListener('click', event => {
    const pageLink = event.target.closest('[data-page-link]');
    if (pageLink) { event.preventDefault(); navigate(pageLink.dataset.pageLink); return; }
    const page = event.target.closest('[data-page]');
    if (page) { navigate(page.dataset.page); return; }
    const action = event.target.closest('[data-action]');
    if (action) handleAction(action.dataset.action, action, event);
    else { const notification = document.getElementById('notification-popover'); if (notification && !notification.hidden && !event.target.closest('.notification-wrap')) notification.hidden = true; }
  });

  document.addEventListener('submit', event => {
    const form = event.target.closest('#modal-form'); if (!form) return;
    event.preventDefault(); if (!form.reportValidity()) return;
    const data = new FormData(form); const type = form.dataset.formType; const id = form.dataset.id;
    if (type === 'employee') {
      const existing = employee(id);
      const record = { id: existing?.id || `emp-${Date.now()}`, code: String(data.get('code') || '').trim(), name: String(data.get('name') || '').trim(), email: String(data.get('email') || '').trim(), department: String(data.get('department') || 'Engineering'), title: String(data.get('title') || '').trim(), status: String(data.get('status') || 'Active'), location: String(data.get('location') || 'Colombo'), startDate: String(data.get('startDate') || localISO()), salary: Number(data.get('salary')) || 0 };
      if (existing) {
        if (existing.department !== record.department) { state.headcountByDepartment[existing.department] = Math.max(0, (state.headcountByDepartment[existing.department] || 0) - 1); state.headcountByDepartment[record.department] = (state.headcountByDepartment[record.department] || 0) + 1; }
        state.employees = state.employees.map(person => person.id === id ? record : person);
      } else { state.employees.unshift(record); state.attendance[record.id] = { status: 'Present', checkIn: '09:00', checkOut: '17:30' }; state.headcount += 1; state.headcountByDepartment[record.department] = (state.headcountByDepartment[record.department] || 0) + 1; }
      recordAudit(existing ? 'Update' : 'Create', 'Employee', `${existing ? 'Updated' : 'Added'} ${record.code} ${record.name}`); save(); closeModal(); render(); toast(existing ? 'Employee updated' : 'Employee added', `${record.name} saved successfully.`, !existing);
    } else if (type === 'leave') {
      const startDate = String(data.get('startDate')); const endDate = String(data.get('endDate'));
      if (dateObj(endDate) < dateObj(startDate)) { form.querySelector('[name="endDate"]').setCustomValidity('End date must be on or after the start date.'); form.querySelector('[name="endDate"]').reportValidity(); form.querySelector('[name="endDate"]').setCustomValidity(''); return; }
      const request = { id: `leave-${Date.now()}`, employeeId: String(data.get('employeeId')), type: String(data.get('type')), startDate, endDate, days: Math.max(1, Math.round((dateObj(endDate) - dateObj(startDate)) / 86400000) + 1), note: String(data.get('note') || '').trim(), status: 'Pending', requestedAt: localISO() };
      state.requests.unshift(request); state.summary.pendingApprovals += 1; recordAudit('Create', 'Leave Request', `New ${request.type} request from ${employeeName(request.employeeId)}`); save(); closeModal(); render(); toast('Leave request submitted', 'Your request has been sent for approval.', true);
    } else if (type === 'job') {
      const job = { id: id || `job-${Date.now()}`, title: String(data.get('title')).trim(), department: String(data.get('department')), location: String(data.get('location') || 'Colombo'), status: String(data.get('status') || 'Open'), applications: id ? state.jobs.find(item => item.id === id)?.applications || 0 : 0 };
      if (id) state.jobs = state.jobs.map(item => item.id === id ? job : item); else state.jobs.unshift(job);
      recordAudit(id ? 'Update' : 'Create', 'Recruitment', `${id ? 'Updated' : 'Created'} job post ${job.title}`); save(); closeModal(); render(); toast(id ? 'Job post updated' : 'Job posted', `${job.title} is ${job.status.toLowerCase()}.`, true);
    } else if (type === 'document') {
      const file = data.get('file'); const fileName = file && file.name ? file.name : '';
      const doc = { id: `doc-${Date.now()}`, name: fileName || String(data.get('name')).trim(), category: String(data.get('category')), employeeId: String(data.get('employeeId') || ''), uploaded: localISO(), size: file && file.size ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Metadata only' };
      state.documents.unshift(doc); recordAudit('Create', 'Document', `Uploaded ${doc.name}`); save(); closeModal(); render(); toast('Document uploaded', `${doc.name} has been added to the library.`, true);
    } else if (type === 'goal') {
      const goal = { id: `goal-${Date.now()}`, employeeId: String(data.get('employeeId')), title: String(data.get('title')).trim(), department: String(data.get('department')), progress: 0, status: 'On Track' };
      state.goals.unshift(goal); recordAudit('Create', 'Performance', `Created goal for ${employeeName(goal.employeeId)}`); save(); closeModal(); render(); toast('Goal created', 'The new goal is on the performance board.', true);
    } else if (type === 'review') {
      const employeeId = String(data.get('employeeId')); const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
      state.reviews.unshift({ id: `review-${Date.now()}`, employeeId, period: String(data.get('period')) === 'Current Quarter' ? quarter : String(data.get('period')), status: 'Pending' });
      recordAudit('Create', 'Performance', `Started review for ${employeeName(employeeId)}`); save(); closeModal(); render(); toast('Review created', 'The performance review is ready to complete.', true);
    } else if (type === 'department') {
      const name = String(data.get('name') || '').trim(); const headcount = Math.max(0, Number(data.get('headcount')) || 0);
      if (name && !Object.prototype.hasOwnProperty.call(state.headcountByDepartment, name)) { state.headcountByDepartment[name] = headcount; recordAudit('Create', 'Organization', `Created department ${name}`); save(); closeModal(); render(); toast('Department created', `${name} is now part of the organization.`, true); }
    } else if (type === 'role') {
      recordAudit('Create', 'Settings', `Created role ${String(data.get('name'))}`); save(); closeModal(); toast('Role added', `${String(data.get('name'))} is ready to configure.`);
    }
  });

  document.addEventListener('input', event => {
    if (event.target === searchInput) { searchIndex = 0; renderSearchResults(searchInput.value); }
    if (event.target.id === 'people-search') {
      state.peopleQuery = event.target.value; state.employeePage = 1;
      const body = document.querySelector('.directory-panel tbody'); const count = document.getElementById('employee-count');
      const people = filteredEmployees();
      if (body) body.innerHTML = people.slice(0, 6).map(employeeRow).join('') || `<tr><td class="empty-cell" colspan="6">No employees match your search.</td></tr>`;
      if (count) count.textContent = `Showing ${Math.min(people.length, 6)} of ${peopleTotalLabel(people)} employees`;
    }
    if (event.target.id === 'hiring-search') { state.hiringQuery = event.target.value; const cursor = event.target.selectionStart; render(); const input = document.getElementById('hiring-search'); input?.focus(); input?.setSelectionRange(cursor, cursor); }
    if (event.target.id === 'document-search') { state.documentQuery = event.target.value; const cursor = event.target.selectionStart; render(); const input = document.getElementById('document-search'); input?.focus(); input?.setSelectionRange(cursor, cursor); }
    if (event.target.id === 'confirm-check') { const button = document.getElementById('confirm-payroll'); if (button) button.disabled = !event.target.checked; }
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'department-filter') { state.departmentFilter = event.target.value; state.employeePage = 1; save(); render(); }
    if (event.target.id === 'attendance-status-filter') { state.attendanceFilter = event.target.value; render(); }
    if (event.target.id === 'job-department-filter') { state.jobDepartmentFilter = event.target.value; render(); }
    if (event.target.id === 'job-status-filter') { state.jobStatusFilter = event.target.value; render(); }
    if (event.target.id === 'performance-department-filter') { state.performanceDepartmentFilter = event.target.value; render(); }
    if (event.target.id === 'employee-status-filter') { state.employeeStatusFilter = event.target.value; state.employeePage = 1; save(); render(); }
    if (event.target.id === 'leave-type-filter') { state.leaveTypeFilter = event.target.value; render(); }
    if (event.target.id === 'leave-status-filter') { state.leaveStatusFilter = event.target.value; render(); }
    if (event.target.id === 'document-category-filter') { state.documentCategory = event.target.value; render(); }
    if (event.target.id === 'audit-filter') { state.auditFilter = event.target.value; render(); }
    if (event.target.id === 'payroll-confirm-check') { const button = document.getElementById('confirm-payroll'); if (button) button.disabled = !event.target.checked; }
    if (event.target.id === 'file-input') { /* file name is captured on form submit */ }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') { if (searchOverlay.classList.contains('is-open')) closeSearch(); else if (modalRoot.innerHTML) closeModal(); else { document.getElementById('sidebar')?.classList.remove('is-open'); document.body.classList.remove('sidebar-open'); } }
    if (searchOverlay.classList.contains('is-open') && event.target === searchInput) {
      if (event.key === 'ArrowDown') { event.preventDefault(); searchIndex = Math.min(searchEntries.length - 1, searchIndex + 1); renderSearchResults(searchInput.value); }
      if (event.key === 'ArrowUp') { event.preventDefault(); searchIndex = Math.max(0, searchIndex - 1); renderSearchResults(searchInput.value); }
      if (event.key === 'Enter') { event.preventDefault(); const entry = searchEntries[searchIndex]; if (entry) handleAction('search-result', { dataset: { type: entry.type, id: entry.id } }); }
    }
  });
  document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon, 17); });
  render();
  save();
})();
