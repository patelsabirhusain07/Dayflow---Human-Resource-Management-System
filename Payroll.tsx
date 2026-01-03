import React, { useState, useEffect } from 'react';
import { User, UserRole, SalaryStructure, Payroll as PayrollHistory } from '../types';
import { payrollService } from '../services/mockBackend';

const Payroll: React.FC<{ user: User }> = ({ user }) => {
  const isAdmin = user.role === UserRole.HR;
  
  // State for Admin View
  const [allStructures, setAllStructures] = useState<(SalaryStructure & { userName: string, employeeId: string })[]>([]);
  const [selectedStruct, setSelectedStruct] = useState<SalaryStructure & { userName: string } | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<boolean>(isAdmin);
  
  // State for Employee View
  const [myStructure, setMyStructure] = useState<SalaryStructure | null>(null);
  const [history, setHistory] = useState<PayrollHistory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [adminViewMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (adminViewMode) {
        const data = await payrollService.getAllStructures();
        setAllStructures(data);
      } else {
        const [struct, logs] = await Promise.all([
          payrollService.getStructure(user.id),
          payrollService.getHistory(user.id)
        ]);
        setMyStructure(struct);
        setHistory(logs);
      }
    } catch (err) {
      console.error('Failed to load payroll info', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleUpdateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStruct) return;
    
    try {
      await payrollService.updateStructure(selectedStruct.userId, selectedStruct);
      setSelectedStruct(null);
      loadData();
      alert('Salary structure updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update structure');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-600">Loading payroll data...</div>;

  // --- HR ADMIN VIEW ---
  if (adminViewMode) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Payroll Management (Admin)</h2>
            <p className="text-gray-500">View and adjust employee salary components. <span className="text-indigo-600 font-medium">HR records are hidden.</span></p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setAdminViewMode(false)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
            >
              View My Payslips
            </button>
          )}
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Basic</th>
                  <th className="px-6 py-4">Allowances</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4 font-bold">Monthly Net</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {allStructures.length > 0 ? allStructures.map(s => (
                  <tr key={s.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{s.userName}</p>
                      <p className="text-xs text-gray-500">{s.employeeId}</p>
                    </td>
                    <td className="px-6 py-4">{formatINR(s.basicSalary)}</td>
                    <td className="px-6 py-4">{formatINR(s.allowances + s.hra)}</td>
                    <td className="px-6 py-4 text-red-600">-{formatINR(s.deductions)}</td>
                    <td className="px-6 py-4 font-bold text-indigo-700">{formatINR(s.netSalary)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedStruct(s)}
                        className="px-3 py-1 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 font-semibold transition"
                      >
                        Edit Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No regular employees found for payroll management.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Management Modal */}
        {selectedStruct && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-200 text-gray-800">
              <h3 className="text-xl font-bold mb-2 text-slate-900">Manage Salary</h3>
              <p className="text-gray-500 text-sm mb-6">Editing structure for <strong>{selectedStruct.userName}</strong></p>
              
              <form onSubmit={handleUpdateStructure} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight">Basic Salary</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedStruct.basicSalary}
                      onChange={e => setSelectedStruct({...selectedStruct, basicSalary: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight">HRA</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedStruct.hra}
                      onChange={e => setSelectedStruct({...selectedStruct, hra: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight">Other Allowances</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedStruct.allowances}
                      onChange={e => setSelectedStruct({...selectedStruct, allowances: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight">Deductions (PF/Tax)</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedStruct.deductions}
                      onChange={e => setSelectedStruct({...selectedStruct, deductions: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center mt-6">
                  <span className="font-bold text-indigo-900">Final Net Pay</span>
                  <span className="text-2xl font-black text-indigo-700">
                    {formatINR((selectedStruct.basicSalary || 0) + (selectedStruct.hra || 0) + (selectedStruct.allowances || 0) - (selectedStruct.deductions || 0))}
                  </span>
                </div>

                <div className="flex gap-3 pt-6">
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition"
                  >
                    Save Structure
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedStruct(null)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EMPLOYEE VIEW ---
  return (
    <div className="space-y-8 text-slate-900">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Compensation</h2>
          <p className="text-gray-500">Detailed breakdown of your earnings and historical payslips.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setAdminViewMode(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            Manage Staff Payroll
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Salary Breakdown Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-6 border-b pb-4 text-slate-900">Monthly Structure</h3>
            {myStructure ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Basic Salary</span>
                  <span className="font-medium text-gray-800">{formatINR(myStructure.basicSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HRA</span>
                  <span className="font-medium text-gray-800">{formatINR(myStructure.hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Allowances</span>
                  <span className="font-medium text-gray-800">{formatINR(myStructure.allowances)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-red-600">
                  <span>Deductions</span>
                  <span className="font-medium">-{formatINR(myStructure.deductions)}</span>
                </div>
                <div className="pt-4 mt-2 border-t-2 border-dashed border-indigo-100 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Take Home (Net)</span>
                  <span className="text-xl font-bold text-indigo-600">{formatINR(myStructure.netSalary)}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 italic text-center">
                  Last revised on {new Date(myStructure.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 italic">No structure defined yet.</p>
            )}
          </div>

          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100">
             <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Annual CTC</p>
             <p className="text-3xl font-black">{formatINR((user.salary || 0))}</p>
             <p className="text-xs mt-2 opacity-70">Calculated on current net monthly structure.</p>
          </div>
        </div>

        {/* Payout History */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-lg text-slate-900">Payout History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4">Net Paid</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                {history.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.month}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{formatINR(p.netPay)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-tight">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-indigo-600 font-semibold text-xs hover:underline"
                        onClick={() => alert(`Downloading payslip for ${p.month}...`)}
                      >
                        Download Slip
                      </button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No payment history available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;