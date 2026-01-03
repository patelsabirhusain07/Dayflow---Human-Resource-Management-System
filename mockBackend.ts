
import { User, UserRole, Attendance, LeaveRequest, AttendanceStatus, LeaveStatus, SalaryStructure, Payroll, LeaveType } from '../types';

// Storage keys
const USERS_KEY = 'dayflow_users';
const ATTENDANCE_KEY = 'dayflow_attendance';
const LEAVES_KEY = 'dayflow_leaves';
const SESSION_KEY = 'dayflow_session';
const SALARY_STRUCTURES_KEY = 'dayflow_salaries';
const PAYROLL_HISTORY_KEY = 'dayflow_payroll_history';

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Seed Data Logic
if (!localStorage.getItem(USERS_KEY)) {
  const seedUsers: User[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      name: 'John HR Admin',
      email: 'admin@dayflow.com',
      role: UserRole.HR,
      jobTitle: 'HR Director',
      department: 'Human Resources',
      salary: 1200000, 
      joiningDate: '2023-01-15',
      paidLeaveRemaining: 15 // Admins get 15
    },
    {
      id: '2',
      employeeId: 'EMP002',
      name: 'Sarah Smith',
      email: 'sarah@dayflow.com',
      role: UserRole.EMPLOYEE,
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      salary: 900000,
      joiningDate: '2023-06-10',
      phone: '555-0123',
      address: '123 Tech Lane, San Francisco',
      paidLeaveRemaining: 12 // Default 12
    }
  ];
  saveToStorage(USERS_KEY, seedUsers);
  
  const structures: SalaryStructure[] = seedUsers.map(u => ({
    userId: u.id,
    basicSalary: Math.floor((u.salary || 0) * 0.5 / 12),
    hra: Math.floor((u.salary || 0) * 0.2 / 12),
    allowances: Math.floor((u.salary || 0) * 0.3 / 12),
    deductions: 2500,
    netSalary: 0,
    lastUpdated: new Date().toISOString()
  })).map(s => ({
    ...s,
    netSalary: s.basicSalary + s.hra + s.allowances - s.deductions
  }));
  saveToStorage(SALARY_STRUCTURES_KEY, structures);
}

export const authService = {
  login: async (email: string, pass: string): Promise<{ user: User; token: string }> => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    
    const token = 'mock-jwt-token-' + Math.random();
    saveToStorage(SESSION_KEY, { user, token });
    return { user, token };
  },
  
  signup: async (data: Partial<User>): Promise<User> => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    if (users.find(u => u.email === data.email || u.employeeId === data.employeeId)) {
      throw new Error('User or Employee ID already exists');
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: data.employeeId || '',
      name: data.name || '',
      email: data.email || '',
      role: data.role || UserRole.EMPLOYEE,
      salary: data.salary || 0,
      paidLeaveRemaining: 12, // Starting balance for new hires
      ...data
    } as User;
    
    users.push(newUser);
    saveToStorage(USERS_KEY, users);

    const structures = getFromStorage<SalaryStructure[]>(SALARY_STRUCTURES_KEY, []);
    structures.push({
      userId: newUser.id,
      basicSalary: 0,
      hra: 0,
      allowances: 0,
      deductions: 0,
      netSalary: 0,
      lastUpdated: new Date().toISOString()
    });
    saveToStorage(SALARY_STRUCTURES_KEY, structures);

    return newUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = getFromStorage<any>(SESSION_KEY, null);
    return session ? session.user : null;
  }
};

export const employeeService = {
  getAll: async (): Promise<User[]> => {
    return getFromStorage<User[]>(USERS_KEY, []);
  },
  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Employee not found');
    users[idx] = { ...users[idx], ...updates };
    saveToStorage(USERS_KEY, users);
    
    const session = getFromStorage<any>(SESSION_KEY, null);
    if (session && session.user.id === id) {
      session.user = users[idx];
      saveToStorage(SESSION_KEY, session);
    }
    
    return users[idx];
  }
};

export const leaveService = {
  getForUser: async (userId: string): Promise<LeaveRequest[]> => {
    const all = getFromStorage<LeaveRequest[]>(LEAVES_KEY, []);
    return all.filter(l => l.userId === userId);
  },
  getAll: async (): Promise<LeaveRequest[]> => {
    return getFromStorage<LeaveRequest[]>(LEAVES_KEY, []);
  },
  create: async (userId: string, userName: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const all = getFromStorage<LeaveRequest[]>(LEAVES_KEY, []);
    const newRequest: LeaveRequest = { id: Math.random().toString(36).substr(2, 9), userId, userName, type: data.type || ('' as any), startDate: data.startDate || '', endDate: data.endDate || '', remarks: data.remarks || '', status: LeaveStatus.PENDING } as LeaveRequest;
    all.push(newRequest);
    saveToStorage(LEAVES_KEY, all);
    return newRequest;
  },
  updateStatus: async (id: string, status: LeaveStatus, adminComment?: string): Promise<LeaveRequest> => {
    const allLeaves = getFromStorage<LeaveRequest[]>(LEAVES_KEY, []);
    const users = getFromStorage<User[]>(USERS_KEY, []);
    
    const leaveIdx = allLeaves.findIndex(l => l.id === id);
    if (leaveIdx === -1) throw new Error('Request not found');
    
    const leave = allLeaves[leaveIdx];
    const userIdx = users.findIndex(u => u.id === leave.userId);
    
    if (userIdx === -1) throw new Error('User associated with leave not found');

    // BUSINESS LOGIC: Deduct balance if approving a Paid leave
    if (status === LeaveStatus.APPROVED && leave.type === LeaveType.PAID) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start and end

      if (users[userIdx].paidLeaveRemaining < diffDays) {
        throw new Error(`Insufficient leave balance. User only has ${users[userIdx].paidLeaveRemaining} days left.`);
      }

      // Deduct days
      users[userIdx].paidLeaveRemaining -= diffDays;
      saveToStorage(USERS_KEY, users);
      
      // Update session if the modified user is currently logged in (for immediate UI feedback)
      const session = getFromStorage<any>(SESSION_KEY, null);
      if (session && session.user.id === leave.userId) {
        session.user = users[userIdx];
        saveToStorage(SESSION_KEY, session);
      }
    }

    allLeaves[leaveIdx].status = status;
    allLeaves[leaveIdx].adminComment = adminComment;
    saveToStorage(LEAVES_KEY, allLeaves);
    
    return allLeaves[leaveIdx];
  }
};

// ... Rest of services (attendance, payroll) remain the same ...
export const payrollService = {
  getStructure: async (userId: string): Promise<SalaryStructure> => {
    const structures = getFromStorage<SalaryStructure[]>(SALARY_STRUCTURES_KEY, []);
    const found = structures.find(s => s.userId === userId);
    if (!found) throw new Error('Salary structure not found');
    return found;
  },
  getAllStructures: async (): Promise<(SalaryStructure & { userName: string, employeeId: string })[]> => {
    const structures = getFromStorage<SalaryStructure[]>(SALARY_STRUCTURES_KEY, []);
    const users = getFromStorage<User[]>(USERS_KEY, []);
    return structures
      .map(s => {
        const user = users.find(u => u.id === s.userId);
        return {
          ...s,
          userName: user?.name || 'Unknown',
          employeeId: user?.employeeId || 'N/A',
          userRole: user?.role
        };
      })
      .filter(s => s.userRole === UserRole.EMPLOYEE);
  },
  updateStructure: async (userId: string, data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === UserRole.HR) throw new Error('Access Denied');
    const structures = getFromStorage<SalaryStructure[]>(SALARY_STRUCTURES_KEY, []);
    const idx = structures.findIndex(s => s.userId === userId);
    if (idx === -1) throw new Error('Structure not found');
    const updated = { ...structures[idx], ...data, lastUpdated: new Date().toISOString() };
    updated.netSalary = (updated.basicSalary || 0) + (updated.hra || 0) + (updated.allowances || 0) - (updated.deductions || 0);
    structures[idx] = updated;
    saveToStorage(SALARY_STRUCTURES_KEY, structures);
    return updated;
  },
  getHistory: async (userId: string): Promise<Payroll[]> => {
    const history = getFromStorage<Payroll[]>(PAYROLL_HISTORY_KEY, [
      { id: 'p1', userId: '2', month: 'October 2024', baseSalary: 37500, bonus: 2000, deductions: 2500, netPay: 37000, status: 'Paid' }
    ]);
    return history.filter(p => p.userId === userId);
  }
};

export const attendanceService = {
  getForUser: async (userId: string): Promise<Attendance[]> => {
    const all = getFromStorage<Attendance[]>(ATTENDANCE_KEY, []);
    return all.filter(a => a.userId === userId);
  },
  getAll: async (): Promise<Attendance[]> => {
    return getFromStorage<Attendance[]>(ATTENDANCE_KEY, []);
  },
  checkIn: async (userId: string): Promise<Attendance> => {
    const all = getFromStorage<Attendance[]>(ATTENDANCE_KEY, []);
    const today = new Date().toISOString().split('T')[0];
    const existing = all.find(a => a.userId === userId && a.date === today);
    if (existing) throw new Error('Already checked in');
    const entry: Attendance = { id: Math.random().toString(36).substr(2, 9), userId, date: today, checkIn: new Date().toLocaleTimeString(), status: AttendanceStatus.PRESENT };
    all.push(entry);
    saveToStorage(ATTENDANCE_KEY, all);
    return entry;
  },
  checkOut: async (userId: string): Promise<Attendance> => {
    const all = getFromStorage<Attendance[]>(ATTENDANCE_KEY, []);
    const today = new Date().toISOString().split('T')[0];
    const idx = all.findIndex(a => a.userId === userId && a.date === today);
    if (idx === -1) throw new Error('No check-in');
    all[idx].checkOut = new Date().toLocaleTimeString();
    all[idx].workHours = 8.5; 
    saveToStorage(ATTENDANCE_KEY, all);
    return all[idx];
  }
};
