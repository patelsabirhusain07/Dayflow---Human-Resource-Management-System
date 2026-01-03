
import React, { useState, useEffect } from 'react';
import { User, UserRole, Attendance, LeaveRequest, LeaveStatus } from '../types';
import { attendanceService, leaveService, employeeService } from '../services/mockBackend';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    presentToday: 0
  });

  useEffect(() => {
    const loadData = async () => {
      if (user.role === UserRole.HR) {
        const [allUsers, allLeaves, allAttendance] = await Promise.all([
          employeeService.getAll(),
          leaveService.getAll(),
          attendanceService.getAll()
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        setStats({
          totalEmployees: allUsers.length,
          pendingLeaves: allLeaves.filter(l => l.status === LeaveStatus.PENDING).length,
          presentToday: allAttendance.filter(a => a.date === today).length
        });
        setLeaves(allLeaves.filter(l => l.status === LeaveStatus.PENDING).slice(0, 5));
      } else {
        const [userAttendance, userLeaves] = await Promise.all([
          attendanceService.getForUser(user.id),
          leaveService.getForUser(user.id)
        ]);
        setAttendances(userAttendance);
        setLeaves(userLeaves.slice(0, 5));
      }
    };
    loadData();
  }, [user]);

  const isAdmin = user.role === UserRole.HR;

  return (
    <div className="text-slate-900">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}</h2>
        <p className="text-slate-600">Here's what's happening today at Dayflow.</p>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isAdmin ? (
          <>
            <StatCard title="Total Employees" value={stats.totalEmployees} subtitle="Active workforce" color="blue" />
            <StatCard title="Pending Leaves" value={stats.pendingLeaves} subtitle="Awaiting review" color="amber" />
            <StatCard title="Present Today" value={stats.presentToday} subtitle="Current attendance" color="green" />
          </>
        ) : (
          <>
            <StatCard title="Total Present" value={attendances.length} subtitle="Days worked this year" color="blue" />
            <StatCard title="Paid Leave Balance" value={user.paidLeaveRemaining} subtitle="Days available" color="purple" />
            <StatCard title="Pending Requests" value={leaves.filter(l => l.status === LeaveStatus.PENDING).length} subtitle="In review" color="amber" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{user.name}</h3>
              <p className="text-slate-500">{user.jobTitle || 'N/A'} • {user.employeeId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-slate-500 mb-1">Department</p>
              <p className="font-semibold text-slate-900">{user.department || 'Not Assigned'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-slate-500 mb-1">Date Joined</p>
              <p className="font-semibold text-slate-900">{user.joiningDate || 'Unknown'}</p>
            </div>
          </div>
        </div>

        {/* Recent Alerts / Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-slate-900">
            {isAdmin ? 'Awaiting Approvals' : 'Recent Leave History'}
          </h3>
          <div className="space-y-3">
            {leaves.length > 0 ? (
              leaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{isAdmin ? leave.userName : `${leave.type} Leave`}</p>
                    <p className="text-xs text-slate-500">{leave.startDate} to {leave.endDate}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    leave.status === LeaveStatus.APPROVED ? 'bg-green-100 text-green-700' :
                    leave.status === LeaveStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">No recent requests.</p>
            )}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
            View All
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; color: string }> = ({ title, value, subtitle, color }) => {
  const colors: Record<string, string> = {
    blue: 'border-blue-100',
    amber: 'border-amber-100',
    green: 'border-green-100',
    purple: 'border-purple-100'
  };

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${colors[color] || colors.blue} bg-white transition-transform hover:scale-[1.02]`}>
      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{title}</h4>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900">{value}</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
};

export default Dashboard;
