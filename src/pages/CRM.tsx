
import React, { useState } from 'react';
import { 
  Search, Plus, Trash2, Edit2,  User as UserIcon, 
  ShoppingBag, X, Calendar,  LayoutGrid,CheckSquare, 
   DollarSign, 
} from 'lucide-react';
import type{ Customer, Transaction,  Lead, CRMTask, LeadStage } from '../types';
import { TransactionType } from '../types';

interface CRMProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  transactions: Transaction[];
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks: CRMTask[];
  setTasks: React.Dispatch<React.SetStateAction<CRMTask[]>>;
}

export const CRM: React.FC<CRMProps> = ({ 
  customers, setCustomers, transactions, 
  leads, setLeads, tasks, setTasks 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'pipeline' | 'customers' | 'tasks'>('overview');
  
  // -- Customers State --
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState('All');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<{
    name: string;
    email: string;
    phone: string;
    segment: Customer['segment'];
    creditBalance: number;
  }>({ name: '', email: '', phone: '', segment: 'New', creditBalance: 0 });

  // -- Pipeline State --
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({ stage: 'New', value: 0 });
  
  // -- Task State --
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // -------------------------
  // CUSTOMER LOGIC
  // -------------------------
  const filteredCustomers = customers.filter(c => {
    const matchesSegment = customerSegmentFilter === 'All' || c.segment === customerSegmentFilter;
    const searchLower = customerSearch.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchLower) || c.email.toLowerCase().includes(searchLower) || c.phone.includes(searchLower);
    return matchesSegment && matchesSearch;
  });

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...customerForm } : c));
    } else {
      setCustomers(prev => [{ id: Date.now().toString(), ...customerForm, totalSpent: 0, loyaltyPoints: 0 }, ...prev]);
    }
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustomerForm({ name: '', email: '', phone: '', segment: 'New', creditBalance: 0 });
  };

  const getCustomerTransactions = (name: string) => {
    return transactions.filter(t => t.type === TransactionType.SALE && t.partyName?.toLowerCase() === name.toLowerCase());
  };

  // -------------------------
  // PIPELINE LOGIC
  // -------------------------
  const stages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  
  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: Date.now().toString(),
      name: leadForm.name || 'New Lead',
      company: leadForm.company || '',
      email: leadForm.email || '',
      phone: leadForm.phone || '',
      value: Number(leadForm.value) || 0,
      stage: leadForm.stage || 'New',
      source: 'Manual',
      createdAt: new Date().toISOString()
    };
    setLeads([...leads, newLead]);
    setShowLeadModal(false);
    setLeadForm({ stage: 'New', value: 0 });
  };

  const moveLeadStage = (leadId: string, direction: 'next' | 'prev') => {
    setLeads(leads.map(lead => {
      if (lead.id !== leadId) return lead;
      const currentIndex = stages.indexOf(lead.stage);
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= stages.length) newIndex = stages.length - 1;
      return { ...lead, stage: stages[newIndex] };
    }));
  };

  // -------------------------
  // TASK LOGIC
  // -------------------------
  const handleTaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: CRMTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: new Date().toISOString(),
      priority: 'Medium',
      status: 'Pending'
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' } : t));
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">CRM System</h2>
          <p className="text-slate-500 mt-1">Manage relationships, sales pipeline, and tasks.</p>
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'pipeline', label: 'Pipeline', icon: DollarSign },
            { id: 'customers', label: 'Customers', icon: UserIcon },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${activeSubTab === tab.id ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <tab.icon size={16} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* OVERVIEW TAB */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto p-1">
            <div className="md:col-span-2 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-sm text-slate-500 mb-1">Total Leads Value</p>
                   <h3 className="text-2xl font-bold text-slate-900">
                     ${leads.reduce((sum, l) => sum + l.value, 0).toLocaleString()}
                   </h3>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-sm text-slate-500 mb-1">Total Customers</p>
                   <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-sm text-slate-500 mb-1">Open Tasks</p>
                   <h3 className="text-2xl font-bold text-orange-500">{tasks.filter(t => t.status === 'Pending').length}</h3>
                 </div>
               </div>

               {/* Pipeline Funnel Summary */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4">Pipeline Distribution</h3>
                 <div className="space-y-3">
                   {stages.map(stage => {
                     const count = leads.filter(l => l.stage === stage).length;
                     const total = leads.length || 1;
                     const pct = (count / total) * 100;
                     return (
                       <div key={stage}>
                         <div className="flex justify-between text-sm mb-1">
                           <span className="text-slate-600 font-medium">{stage}</span>
                           <span className="text-slate-400">{count} Leads</span>
                         </div>
                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: `${pct}%`}}></div>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
            </div>

            {/* Quick Tasks */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-bold text-slate-900 mb-4">Priority Tasks</h3>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'Pending').slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <button onClick={() => toggleTaskStatus(task.id)} className="mt-0.5 text-slate-400 hover:text-green-500">
                      <CheckSquare size={18} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'Pending').length === 0 && (
                   <p className="text-sm text-slate-500 text-center py-4">No pending tasks. Great job!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PIPELINE TAB */}
        {activeSubTab === 'pipeline' && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                 <div className="text-sm text-slate-500">Drag and drop functionality coming soon.</div>
              </div>
              <button 
                onClick={() => setShowLeadModal(true)}
                className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} /> Add Lead
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
              <div className="flex gap-4 h-full min-w-max">
                {stages.map(stage => (
                  <div key={stage} className="w-72 flex flex-col bg-slate-100 rounded-xl p-3 border border-slate-200">
                    <div className="flex justify-between items-center mb-3 px-1">
                      <h4 className="font-bold text-slate-700">{stage}</h4>
                      <span className="text-xs bg-white px-2 py-0.5 rounded text-slate-500 font-medium">
                        {leads.filter(l => l.stage === stage).length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {leads.filter(l => l.stage === stage).map(lead => (
                        <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                           <div className="flex justify-between items-start mb-2">
                             <h5 className="font-semibold text-slate-900 truncate">{lead.name}</h5>
                             <span className="text-xs font-mono font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                               ${lead.value.toLocaleString()}
                             </span>
                           </div>
                           <p className="text-xs text-slate-500 mb-3">{lead.company}</p>
                           
                           <div className="flex justify-between items-center border-t border-slate-100 pt-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => moveLeadStage(lead.id, 'prev')}
                               disabled={stage === 'New'}
                               className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                             >
                               ←
                             </button>
                             <button 
                               onClick={() => moveLeadStage(lead.id, 'next')}
                               disabled={stage === 'Won' || stage === 'Lost'}
                               className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                             >
                               →
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeSubTab === 'customers' && (
          <div className="h-full flex flex-col overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
             {/* Toolbar */}
             <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search customers..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                   {['All', 'New', 'Regular', 'VIP'].map(seg => (
                      <button
                        key={seg}
                        onClick={() => setCustomerSegmentFilter(seg)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                          ${customerSegmentFilter === seg ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {seg}
                      </button>
                   ))}
                   <button 
                      onClick={() => { setEditingCustomer(null); setCustomerForm({ name: '', email: '', phone: '', segment: 'New', creditBalance: 0 }); setShowCustomerModal(true); }}
                      className="ml-auto bg-primary hover:bg-blue-700 text-white p-2 rounded-lg"
                   >
                     <Plus size={18} />
                   </button>
                </div>
             </div>

             {/* Table */}
             <div className="flex-1 overflow-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 sticky top-0 z-10">
                   <tr>
                     <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                     <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                     <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Segment</th>
                     <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Loyalty Pts</th>
                     <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredCustomers.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50/50">
                       <td className="px-6 py-3">
                         <div className="font-medium text-slate-900">{c.name}</div>
                       </td>
                       <td className="px-6 py-3 text-sm text-slate-600">
                         <div>{c.email}</div>
                         <div className="text-xs text-slate-400">{c.phone}</div>
                       </td>
                       <td className="px-6 py-3">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600`}>
                           {c.segment}
                         </span>
                       </td>
                       <td className="px-6 py-3 text-right font-mono text-indigo-600">{c.loyaltyPoints}</td>
                       <td className="px-6 py-3 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setHistoryCustomer(c)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded">
                             <ShoppingBag size={16} />
                           </button>
                           <button onClick={() => { setEditingCustomer(c); setCustomerForm(c); setShowCustomerModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded">
                             <Edit2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeSubTab === 'tasks' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Task Management</h3>
            
            <form onSubmit={handleTaskAdd} className="flex gap-4 mb-8">
              <input 
                type="text" 
                placeholder="Add a new task..." 
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Add Task
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3">
              {tasks.map(task => (
                <div key={task.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${task.status === 'Completed' ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-200'}`}>
                  <button 
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                      ${task.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-500 text-transparent'}`}
                  >
                    <CheckSquare size={14} fill="currentColor" />
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(task.dueDate).toLocaleDateString()}</span>
                      {task.relatedTo && <span className="flex items-center gap-1"><UserIcon size={12}/> {task.relatedTo}</span>}
                      <span className={`uppercase font-bold ${task.priority === 'High' ? 'text-red-500' : 'text-slate-400'}`}>{task.priority}</span>
                    </div>
                  </div>
                  <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && <div className="text-center text-slate-400 py-10">No tasks yet.</div>}
            </div>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* Add/Edit Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'New Customer'}</h3>
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <input 
                className="w-full border p-2 rounded" placeholder="Name" required 
                value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} 
              />
              <input 
                className="w-full border p-2 rounded" placeholder="Email" type="email" required
                value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} 
              />
              <input 
                className="w-full border p-2 rounded" placeholder="Phone" required
                value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} 
              />
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Add New Lead</h3>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input 
                className="w-full border p-2 rounded" placeholder="Lead Name" required 
                value={leadForm.name || ''} onChange={e => setLeadForm({...leadForm, name: e.target.value})} 
              />
              <input 
                className="w-full border p-2 rounded" placeholder="Company" 
                value={leadForm.company || ''} onChange={e => setLeadForm({...leadForm, company: e.target.value})} 
              />
              <input 
                className="w-full border p-2 rounded" placeholder="Estimated Value ($)" type="number"
                value={leadForm.value || ''} onChange={e => setLeadForm({...leadForm, value: parseFloat(e.target.value)})} 
              />
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowLeadModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-xl font-bold">History: {historyCustomer.name}</h3>
              <button onClick={() => setHistoryCustomer(null)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {getCustomerTransactions(historyCustomer.name).map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded border flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-green-600">${t.amount.toFixed(2)}</p>
                </div>
              ))}
              {getCustomerTransactions(historyCustomer.name).length === 0 && <p className="text-center text-slate-500">No transactions found.</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
