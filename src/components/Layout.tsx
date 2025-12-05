
import React,{type ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  Users, 
  FileText, 
  Settings, 
  Menu,
  LogOut,
  Bell
} from 'lucide-react';
import type{ User  } from '../types';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  user: User;
}

interface SidebarItemProps {
  icon: any;
  label: string;
  id: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-1
      ${isActive 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-100">
          <div className="bg-primary p-2 rounded-lg">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">RetailPilot</span>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <img 
              src={user.avatar} 
              alt="User" 
              className="w-10 h-10 rounded-full bg-slate-200 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={24} />
            </button>
            <span className="ml-3 font-bold text-lg text-slate-900">RetailPilot</span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-slate-800 capitalize">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white w-64 h-full shadow-xl p-4" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-primary">RetailPilot</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <LogOut size={20} className="text-slate-400"/>
                </button>
               </div>
               <nav>
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeTab === item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
