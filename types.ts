
export enum UserRole {
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE'
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  HALFDAY = 'Half-Day',
  LEAVE = 'Leave'
}

export enum LeaveType {
  PAID = 'Paid',
  SICK = 'Sick',
  UNPAID = 'Unpaid'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  salary?: number; // Annual CTC
  phone?: string;
  address?: string;
  joiningDate?: string;
  paidLeaveRemaining: number; // New field for balance tracking
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workHours?: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string;
  status: LeaveStatus;
  adminComment?: string;
}

// New/Enhanced Payroll types
export interface SalaryStructure {
  userId: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  lastUpdated: string;
}

export interface Payroll {
  id: string;
  userId: string;
  userName?: string;
  month: string;
  baseSalary: number; // For the specific month
  bonus: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Pending';
}
