import React, { useState, useRef, useMemo } from 'react';
import { Plus, Download, FileText, Camera, X, PieChart as PieChartIcon, TrendingUp, BarChart2, Users, DollarSign,  UploadCloud, Sparkles, Edit2, Bell, Mail } from 'lucide-react';
import type{ Transaction,  Supplier } from '../types';
import { PaymentMode,TransactionType, } from '../types';
import { parseReceiptImage } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface FinanceProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
}

export const Finance: React.FC<FinanceProps> = ({ transactions, addTransaction, suppliers, setSuppliers }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics' | 'suppliers'>('transactions');
  const [isScanning, setIsScanning] = useState(false);
  
  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showPaySupplierModal, setShowPaySupplierModal] = useState(false);
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Reminder State
  const [sendingReminders, setSendingReminders] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [expenseForm, setExpenseForm] = useState<{
    description: string;
    amount: string;
    category: string;
    date: string;
    paymentMode: PaymentMode;
  }>({
    description: '',
    amount: '',
    category: 'Operational',
    date: new Date().toISOString().split('T')[0],
    paymentMode: PaymentMode.CASH
  });

  // New state for modal receipt upload
  const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
  const [isAnalyzingModal, setIsAnalyzingModal] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    email: '',
    dueDate: ''
  });

  const [billForm, setBillForm] = useState({
    amount: '',
    dueDate: '',
    description: ''
  });

  const [paymentForm, setPaymentForm] = useState<{
    amount: string;
    mode: PaymentMode;
  }>({
    amount: '',
    mode: PaymentMode.CASH
  });

  const expenseCategories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Inventory Purchase',
    'Marketing',
    'Maintenance',
    'Office Supplies',
    'Operational',
    'Other'
  ];

  // --- Chart Data Preparation ---
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  const { expenseByCategoryData, monthlyCashflowData } = useMemo(() => {
    // 1. Expense by Category (Pie Chart)
    const categoryMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const cat = t.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
      });

    const expenseByCategoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 2. Monthly Income vs Expense (Bar Chart)
    const monthlyMap: Record<string, { name: string; income: number; expense: number; sortKey: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const sortKey = date.getTime();
      
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          name: date.toLocaleString('default', { month: 'short' }),
          income: 0,
          expense: 0,
          sortKey
        };
      }

      if (t.type === TransactionType.SALE) {
        monthlyMap[key].income += t.amount;
      } else if (t.type === TransactionType.EXPENSE) {
        monthlyMap[key].expense += t.amount;
      }
    });

    const monthlyCashflowData = Object.values(monthlyMap).sort((a, b) => a.sortKey - b.sortKey);

    return { expenseByCategoryData, monthlyCashflowData };
  }, [transactions]);

  // --- Logic for Reminders ---
  const suppliersNeedingReminder = useMemo(() => {
    return suppliers.filter(s => {
      if (!s.dueDate || s.balanceDue <= 0) return false;
      const due = new Date(s.dueDate);
      const today = new Date();
      // Calculate difference in days
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      // Include if overdue or due within next 7 days
      return diffDays <= 7; 
    });
  }, [suppliers]);

  // --- Handlers ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const receiptData = await parseReceiptImage(base64Data);
          
          const newTx: Transaction = {
            id: Date.now().toString(),
            date: receiptData.date || new Date().toISOString(),
            type: TransactionType.EXPENSE,
            amount: receiptData.total,
            description: `Auto-scan: ${receiptData.merchant} - ${receiptData.items?.join(', ')}`,
            paymentMode: PaymentMode.CARD, 
            category: 'Operational',
            status: 'Completed',
            receiptUrl: URL.createObjectURL(file)
          };
          
          addTransaction(newTx);
          alert(`Successfully scanned receipt from ${receiptData.merchant}!`);
        } catch (err) {
          console.error(err);
          alert("Could not extract data from image. Please try a clearer image.");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {

      console.error(e);
      setIsScanning(false);
    }
  };

  const handleModalReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExpenseReceiptFile(file);
    setIsAnalyzingModal(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const receiptData = await parseReceiptImage(base64Data);
          setExpenseForm(prev => ({
            ...prev,
            amount: receiptData.total.toString(),
            date: receiptData.date || prev.date,
            description: `${receiptData.merchant} - ${receiptData.items?.slice(0, 3).join(', ')}`
          }));
        } catch (err) {
          console.error("AI Extraction failed", err);
          // Don't alert blocking error, just let user fill manually
        } finally {
          setIsAnalyzingModal(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsAnalyzingModal(false);
    }
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      date: expenseForm.date,
      type: TransactionType.EXPENSE,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      category: expenseForm.category,
      paymentMode: expenseForm.paymentMode as PaymentMode,
      status: 'Completed',
      receiptUrl: expenseReceiptFile ? URL.createObjectURL(expenseReceiptFile) : undefined
    };

    addTransaction(newTx);
    setShowAddExpenseModal(false);
    setExpenseForm({
      description: '',
      amount: '',
      category: 'Operational',
      date: new Date().toISOString().split('T')[0],
      paymentMode: PaymentMode.CASH
    });
    setExpenseReceiptFile(null);
  };

  const openAddSupplierModal = () => {
    setEditingSupplierId(null);
    setSupplierForm({ name: '', contact: '', email: '', dueDate: '' });
    setShowAddSupplierModal(true);
  };

  const openEditSupplierModal = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      dueDate: supplier.dueDate ? supplier.dueDate.split('T')[0] : ''
    });
    setShowAddSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSupplierId) {
      setSuppliers(suppliers.map(s => s.id === editingSupplierId ? {
        ...s,
        name: supplierForm.name,
        contact: supplierForm.contact,
        email: supplierForm.email,
        dueDate: supplierForm.dueDate || undefined
      } : s));
    } else {
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        name: supplierForm.name,
        contact: supplierForm.contact,
        email: supplierForm.email,
        balanceDue: 0,
        dueDate: supplierForm.dueDate || undefined
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    
    setShowAddSupplierModal(false);
    setEditingSupplierId(null);
    setSupplierForm({ name: '', contact: '', email: '', dueDate: '' });
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amount = parseFloat(billForm.amount);
    const updatedSupplier = {
      ...selectedSupplier,
      balanceDue: selectedSupplier.balanceDue + amount,
      dueDate: billForm.dueDate || selectedSupplier.dueDate
    };

    setSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? updatedSupplier : s));
    setShowAddBillModal(false);
    setBillForm({ amount: '', dueDate: '', description: '' });
    setSelectedSupplier(null);
  };

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amount = parseFloat(paymentForm.amount);
    
    // Create transaction
    const newTx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: TransactionType.EXPENSE,
      amount: amount,
      description: `Payment to ${selectedSupplier.name}`,
      category: 'Inventory Purchase',
      paymentMode: paymentForm.mode,
      partyName: selectedSupplier.name,
      status: 'Completed'
    };
    addTransaction(newTx);

    // Update Supplier Balance
    const updatedSupplier = {
      ...selectedSupplier,
      balanceDue: Math.max(0, selectedSupplier.balanceDue - amount),
      lastPaymentDate: new Date().toISOString()
    };
    
    setSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? updatedSupplier : s));
    setShowPaySupplierModal(false);
    setPaymentForm({ amount: '', mode: PaymentMode.CASH });
    setSelectedSupplier(null);
  };

  const handleSendReminders = () => {
    if (suppliersNeedingReminder.length === 0) return;
    setSendingReminders(true);
    
    // Simulate sending emails
    setTimeout(() => {
      alert(`Automated reminders sent to ${suppliersNeedingReminder.length} suppliers: ${suppliersNeedingReminder.map(s => s.name).join(', ')}.`);
      setSendingReminders(false);
    }, 1500);
  };

  const handleSingleReminder = (supplier: Supplier) => {
      alert(`Payment reminder sent to ${supplier.name} at ${supplier.email}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Finance & Cashflow</h2>
          <p className="text-slate-500 mt-1">Track income, expenses, and automated P&L.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'suppliers' ? (
             <button 
              onClick={openAddSupplierModal}
              className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={18} />
              Add Supplier
            </button>
          ) : (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                {isScanning ? (
                  <span className="animate-pulse">Scanning...</span>
                ) : (
                  <>
                    <Camera size={18} />
                    <span>Scan Receipt (AI)</span>
                  </>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => {
                  setExpenseForm({
                    description: '',
                    amount: '',
                    category: 'Operational',
                    date: new Date().toISOString().split('T')[0],
                    paymentMode: PaymentMode.CASH
                  });
                  setExpenseReceiptFile(null);
                  setShowAddExpenseModal(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} />
                Add Expense
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-success">
            ${transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-danger">
            ${transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Net Cashflow</p>
          <p className="text-2xl font-bold text-primary">
            ${(transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.amount, 0) - 
               transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0)).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Supplier Dues</p>
          <p className="text-2xl font-bold text-orange-500">
            ${suppliers.reduce((acc, s) => acc + s.balanceDue, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button 
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('transactions')}
          >
            <div className="flex items-center gap-2">
              <FileText size={16} />
              Recent Transactions
            </div>
          </button>
          <button 
             className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}
             onClick={() => setActiveTab('analytics')}
          >
            <div className="flex items-center gap-2">
              <BarChart2 size={16} />
              Analytics & Reports
            </div>
          </button>
          <button 
             className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'suppliers' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}
             onClick={() => setActiveTab('suppliers')}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              Suppliers & Dues
            </div>
          </button>
        </div>

        {activeTab === 'transactions' && (
          <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Mode</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {t.description}
                      {t.category && (
                        <div className="text-xs text-slate-500 mt-0.5">{t.category}</div>
                      )}
                       {t.receiptUrl && (
                        <a href={t.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
                          <FileText size={10} /> View Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${t.type === 'Sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{t.paymentMode}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'Sale' ? 'text-success' : 'text-slate-900'}`}>
                      {t.type === 'Sale' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                         {t.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Cashflow Chart */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" />
                  Monthly Cashflow
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyCashflowData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <RechartsTooltip 
                        contentStyle={{border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Breakdown Chart */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <PieChartIcon size={20} className="text-primary" />
                  Expense Breakdown
                </h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseByCategoryData.map((index:any) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                         formatter={(value: number) => `$${value.toFixed(2)}`}
                         contentStyle={{border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Downloads Section */}
            <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
              <FileText size={40} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">Export Reports</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">Download detailed financial statements for tax filing and audits.</p>
              <div className="flex justify-center gap-4">
                <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-medium">
                  <Download size={16} /> Export PDF
                </button>
                <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-medium">
                  <Download size={16} /> Export Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300 p-4">
            
            {/* Reminder Alert Section */}
            {suppliersNeedingReminder.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Payment Reminders</h4>
                    <p className="text-sm text-slate-600">
                      {suppliersNeedingReminder.length} suppliers have payments due soon or overdue.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleSendReminders}
                  disabled={sendingReminders}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
                >
                  {sendingReminders ? 'Sending Emails...' : 'Send Automated Reminders'}
                  {!sendingReminders && <Mail size={16} />}
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Supplier Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Balance Due</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.contact}</td>
                    <td className="px-6 py-4">
                      {s.balanceDue > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ${s.balanceDue.toFixed(2)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {s.dueDate ? (
                        <span className={new Date(s.dueDate) < new Date() && s.balanceDue > 0 ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                          {new Date(s.dueDate).toLocaleDateString()}
                          {new Date(s.dueDate) < new Date() && s.balanceDue > 0 && <span>(Overdue)</span>}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {s.balanceDue > 0 && (
                          <button
                            onClick={() => handleSingleReminder(s)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Send Email Reminder"
                          >
                             <Mail size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditSupplierModal(s)}
                          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit2 size={16} />
                        </button>
                         <button 
                          onClick={() => { setSelectedSupplier(s); setShowAddBillModal(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Plus size={14} /> Bill
                        </button>
                        {s.balanceDue > 0 && (
                          <button 
                            onClick={() => { setSelectedSupplier(s); setShowPaySupplierModal(true); setPaymentForm(prev => ({...prev, amount: s.balanceDue.toString()})) }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          >
                            <DollarSign size={14} /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {suppliers.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Users size={40} className="mx-auto text-slate-300 mb-3" />
                <p>No suppliers added yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add New Expense</h3>
              <button 
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              
               {/* Receipt Upload Section */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-center relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleModalReceiptUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isAnalyzingModal}
                />
                {isAnalyzingModal ? (
                   <div className="flex flex-col items-center justify-center py-2 text-primary">
                     <Sparkles className="animate-spin mb-2" size={24} />
                     <p className="text-sm font-medium">Analyzing Receipt...</p>
                   </div>
                ) : expenseReceiptFile ? (
                   <div className="flex flex-col items-center justify-center py-2 text-green-600">
                     <FileText className="mb-2" size={24} />
                     <p className="text-sm font-medium truncate max-w-[200px]">{expenseReceiptFile.name}</p>
                     <p className="text-xs text-slate-500 mt-1">Click to replace</p>
                   </div>
                ) : (
                   <div className="flex flex-col items-center justify-center py-2 text-slate-400">
                     <UploadCloud className="mb-2" size={24} />
                     <p className="text-sm font-medium">Upload Receipt (Optional)</p>
                     <p className="text-xs mt-1">AI will auto-fill details</p>
                   </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                  placeholder="e.g. Office Rent September"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    {expenseCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                    value={expenseForm.paymentMode}
                    onChange={e => setExpenseForm({...expenseForm, paymentMode: e.target.value as PaymentMode})}
                  >
                    {Object.values(PaymentMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 text-slate-900">
              {editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>
            <form onSubmit={handleSaveSupplier} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input 
                  type="tel" 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={supplierForm.contact}
                  onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={supplierForm.email}
                  onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Due Date (Optional)</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={supplierForm.dueDate}
                  onChange={e => setSupplierForm({...supplierForm, dueDate: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  {editingSupplierId ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBillModal && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Add Bill from {selectedSupplier.name}</h3>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bill Amount ($)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={billForm.amount}
                  onChange={e => setBillForm({...billForm, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={billForm.dueDate}
                  onChange={e => setBillForm({...billForm, dueDate: e.target.value})}
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. Invoice #9988"
                  value={billForm.description}
                  onChange={e => setBillForm({...billForm, description: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Record Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPaySupplierModal && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-slate-900">Record Payment</h3>
            <p className="text-sm text-slate-500 mb-6">To {selectedSupplier.name} (Due: ${selectedSupplier.balanceDue})</p>
            <form onSubmit={handlePaySupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Amount ($)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  max={selectedSupplier.balanceDue}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                    value={paymentForm.mode}
                    onChange={e => setPaymentForm({...paymentForm, mode: e.target.value as PaymentMode})}
                  >
                    {Object.values(PaymentMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPaySupplierModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};