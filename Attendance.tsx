
import React, { useState, useEffect } from 'react';
import { User, Attendance, UserRole } from '../types';
import { attendanceService } from '../services/mockBackend';

const AttendancePage: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user.role === UserRole.HR;

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      let data;
      if (isAdmin) {
        data = await attendanceService.getAll();
      } else {
        data = await attendanceService.getForUser(user.id);
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = data.find(r => r.date === today);
        setIsCheckedIn(!!(todayRecord && !todayRecord.checkOut));
      }
      setLogs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    try {
      await attendanceService.checkIn(user.id);
      await loadAttendance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError('');
    try {
      await attendanceService.checkOut(user.id);
      await loadAttendance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Log</h2>
          <p className="text-gray-500">View and manage daily work hours.</p>
        </div>
        
        {!isAdmin && (
          <div className="flex gap-2">
            {!isCheckedIn ? (
              <button 
                onClick={handleCheckIn}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50"
              >
                Check In
              </button>
            ) : (
              <button 
                onClick={handleCheckOut}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 shadow-sm disabled:opacity-50"
              >
                Check Out
              </button>
            )}
          </div>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Date</th>
              {isAdmin && <th className="px-6 py-4">Employee ID</th>}
              <th className="px-6 py-4">Check In</th>
              <th className="px-6 py-4">Check Out</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {logs.length > 0 ? logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{log.date}</td>
                {isAdmin && <td className="px-6 py-4 font-mono text-xs">{log.userId}</td>}
                <td className="px-6 py-4">{log.checkIn || '-'}</td>
                <td className="px-6 py-4">{log.checkOut || (log.checkIn ? <span className="text-amber-500 animate-pulse">Active</span> : '-')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    log.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4">{log.workHours ? `${log.workHours}h` : '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendancePage;
