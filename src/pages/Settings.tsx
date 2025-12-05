import  { useState } from 'react';
import { Save, Store, Bell, Shield, Database, Mail, Globe, User } from 'lucide-react';

export const Settings = () => {
  const [storeName, setStoreName] = useState('RetailPilot Store');
  const [email, setEmail] = useState('admin@retailpilot.com');
  const [currency, setCurrency] = useState('USD');
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);

  const handleSave = () => {
    // Mock save
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your store preferences and account settings.</p>
      </div>

      {/* Store Profile Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-primary rounded-lg">
              <Store size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Store Profile</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Store Address</label>
              <textarea 
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                placeholder="123 Retail St, Business District, NY"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Globe size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Regional & Currency</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none">
                <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                <option>(GMT+00:00) London</option>
                <option>(GMT+05:30) Mumbai, New Delhi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Bell size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Low Stock Alerts</p>
                <p className="text-sm text-slate-500">Get notified when products fall below minimum stock level.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={lowStockAlert} onChange={() => setLowStockAlert(!lowStockAlert)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Daily Sales Report</p>
                <p className="text-sm text-slate-500">Receive a daily summary of sales and expenses via email.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={dailyReport} onChange={() => setDailyReport(!dailyReport)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Security & Data</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">
              <User size={18} />
              Manage Users
             </button>
             <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">
              <Database size={18} />
              Export Data
             </button>
             <button className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium ml-auto">
              Reset Application Data
             </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
};