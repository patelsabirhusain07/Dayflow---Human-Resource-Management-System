
import React, { useState, useEffect } from 'react';
import { User, UserRole, LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { leaveService } from '../services/mockBackend';

const Leaves: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: LeaveType.PAID,
    startDate: '',
    endDate: '',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = user.role === UserRole.HR;

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    const data = isAdmin ? await leaveService.getAll() : await leaveService.getForUser(user.id);
    setRequests(data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      // Basic client side day calculation
      if (formData.type === LeaveType.PAID) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diff > user.paidLeaveRemaining) {
          throw new Error(`You only have ${user.paidLeaveRemaining} paid leaves left.`);
        }
      }

      await leaveService.create(user.id, user.name, formData);
      setShowForm(false);
      setFormData({ type: LeaveType.PAID, startDate: '', endDate: '', remarks: '' });
      await loadLeaves();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: LeaveStatus) => {
    const comment = prompt(`Add a comment for this ${status.toLowerCase()} request:`) || '';
    try {
      await leaveService.updateStatus(id, status, comment);
      await loadLeaves();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leave Management</h2>
          <p className="text-slate-500">Request and monitor time-off status.</p>
        </div>
        {!isAdmin && (
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={() => {
                setShowForm(!showForm);
                setErrorMessage('');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition"
            >
              {showForm ? 'Cancel Request' : 'New Leave Request'}
            </button>
            {!showForm && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                Remaining Balance: {user.paidLeaveRemaining} Days
              </span>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-indigo-900">Apply for Leave</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${user.paidLeaveRemaining < 3 ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
              Available Paid Leaves: {user.paidLeaveRemaining}
            </span>
          </div>
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Leave Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as LeaveType})}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                <option value={LeaveType.PAID}>Paid Leave</option>
                <option value={LeaveType.SICK}>Sick Leave</option>
                <option value={LeaveType.UNPAID}>Unpaid Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
              <input 
                type="date" required
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
              <input 
                type="date" required
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-slate-700 mb-1">Remarks / Reason</label>
              <textarea 
                rows={3}
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                placeholder="Briefly explain the reason for leave..."
              />
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit" disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-indigo-700 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Type</th>
                {isAdmin && <th className="px-6 py-4">Employee</th>}
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Admin Comment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-slate-800">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{req.startDate}</p>
                    <p className="text-xs text-slate-500">to {req.endDate}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{req.type}</td>
                  {isAdmin && <td className="px-6 py-4 font-bold text-indigo-900">{req.userName}</td>}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      req.status === LeaveStatus.APPROVED ? 'bg-green-100 text-green-700' :
                      req.status === LeaveStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic">
                    {req.adminComment || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && req.status === LeaveStatus.PENDING ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAction(req.id, LeaveStatus.APPROVED)}
                          className="px-3 py-1 bg-green-50 text-green-600 rounded-md hover:bg-green-100 text-xs font-black uppercase tracking-tight"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, LeaveStatus.REJECTED)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-xs font-black uppercase tracking-tight"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
