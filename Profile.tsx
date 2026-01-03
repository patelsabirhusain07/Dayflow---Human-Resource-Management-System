import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { employeeService } from '../services/mockBackend';

const Profile: React.FC<{ user: User }> = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    address: user.address || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // HACK: Simulating update delay
      await new Promise(r => setTimeout(r, 600));
      const updated = await employeeService.update(user.id, formData);
      setUser(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-900">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-indigo-600 relative">
          <div className="absolute -bottom-12 left-8 border-4 border-white rounded-full bg-indigo-100 w-24 h-24 flex items-center justify-center text-3xl font-bold text-indigo-700 shadow-md">
            {user.name.charAt(0)}
          </div>
        </div>
        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-gray-500 font-medium">{user.jobTitle} • {user.department}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition font-medium shadow-sm"
              >
                {isEditing ? 'Cancel' : 'Edit Contact Info'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal & Contact Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-slate-900 border-b pb-4">Personal Details</h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Work Email</label>
              <p className="text-gray-800 font-medium py-1">{user.email}</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Employee ID</label>
              <p className="text-gray-800 font-medium py-1">{user.employeeId}</p>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Phone Number</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                />
              ) : (
                <p className="text-gray-800 font-medium py-1">{user.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Residential Address</label>
              {isEditing ? (
                <textarea 
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                />
              ) : (
                <p className="text-gray-800 font-medium py-1">{user.address || 'Not provided'}</p>
              )}
            </div>

            {isEditing && (
              <button 
                type="submit" disabled={saving}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 hover:bg-indigo-700 transition mt-4"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Work & Financial Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-slate-900 border-b pb-4">Employment Info</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Status</p>
                <p className="text-indigo-900 font-bold">Active Full-time</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-400 font-bold uppercase mb-1">Tenure</p>
                <p className="text-green-900 font-bold">1.2 Years</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Current CTC</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{formatINR(user.salary || 0)}
                  </span>
                  <span className="text-gray-400 text-sm">/ year</span>
                </div>
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-1 rounded font-medium">Read-only field. Contact HR for revisions.</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Reporting Manager</label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Robert Manager</p>
                    <p className="text-xs text-gray-500">VP of Engineering</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;