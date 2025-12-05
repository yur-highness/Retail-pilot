import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { TrendingUp, AlertTriangle, Package, DollarSign, Sparkles } from 'lucide-react';
import type{ Product, Transaction } from '../types';
import { analyzeBusinessHealth } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="text-success font-medium flex items-center">
        <TrendingUp size={16} className="mr-1" /> {trend}
      </span>
      <span className="text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ transactions, products }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Derived Stats
  const totalSales = transactions
    .filter(t => t.type === 'Sale')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const lowStock = products.filter(p => p.stock <= p.minStockLevel).length;
  
  // Prepare Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const salesData = last7Days.map(date => ({
    date,
    sales: transactions
      .filter(t => t.type === 'Sale' && t.date.startsWith(date))
      .reduce((acc, curr) => acc + curr.amount, 0)
  }));

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const insight = await analyzeBusinessHealth(transactions, products);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-primary rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-300" />
              RetailPilot AI Assistant
            </h2>
            <p className="text-indigo-100 mt-1 max-w-2xl">
              Get real-time insights on your inventory health, sales trends, and cashflow optimization powered by Gemini.
            </p>
          </div>
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingAi}
            className="px-6 py-2.5 bg-white text-primary font-semibold rounded-lg shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingAi ? 'Analyzing Data...' : 'Generate Daily Report'}
          </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      {aiInsight && (
        <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
           <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-500" />
            AI Executive Summary
           </h3>
           <div className="prose prose-indigo text-slate-600 leading-relaxed whitespace-pre-line">
             {aiInsight}
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalSales.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12.5%" 
          color="bg-primary"
        />
        <StatCard 
          title="Inventory Items" 
          value={products.length} 
          icon={Package} 
          trend="+4.3%" 
          color="bg-blue-500"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStock} 
          icon={AlertTriangle} 
          trend="-2" 
          color="bg-orange-500"
        />
        <StatCard 
          title="Net Profit" 
          value="$12,450" 
          icon={TrendingUp} 
          trend="+8.1%" 
          color="bg-emerald-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Sales Overview</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Profit Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#64748b', fontSize: 12}}
                   tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};