
import  { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { CRM } from './pages/CRM';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import type{ User, Product, Transaction,  Customer, Document, Supplier, Lead, CRMTask } from './types';
import { TransactionType, PaymentMode,UserRole,  } from './types';
// Mock Data
const MOCK_USER: User = {
  id: '1',
  name: 'Alex Johnson',
  role: UserRole.MANAGER,
  avatar: 'https://picsum.photos/200'
};

const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Premium Wireless Headset', 
    sku: 'WH-001', 
    category: 'Electronics', 
    price: 149.99, 
    cost: 80.00, 
    stock: 45, 
    minStockLevel: 10, 
    supplier: 'TechDistro Inc',
    batches: [
      { id: 'b1', date: '2023-08-01', quantity: 15, cost: 70.00 },
      { id: 'b2', date: '2023-09-15', quantity: 20, cost: 75.00 },
      { id: 'b3', date: '2023-10-20', quantity: 30, cost: 82.00 }
    ]
  },
  { 
    id: '2', 
    name: 'Ergonomic Office Chair', 
    sku: 'FUR-022', 
    category: 'Furniture', 
    price: 299.99, 
    cost: 150.00, 
    stock: 5, 
    minStockLevel: 8, 
    supplier: 'OfficeSupplies Co',
    batches: [
      { id: 'b4', date: '2023-07-01', quantity: 10, cost: 140.00 },
      { id: 'b5', date: '2023-09-01', quantity: 10, cost: 155.00 }
    ]
  },
  { 
    id: '3', 
    name: 'Mechanical Keyboard RGB', 
    sku: 'KB-104', 
    category: 'Electronics', 
    price: 129.50, 
    cost: 75.00, 
    stock: 12, 
    minStockLevel: 15, 
    supplier: 'KeyMasters',
    batches: [
      { id: 'b6', date: '2023-10-01', quantity: 50, cost: 75.00 }
    ]
  },
  { 
    id: '4', 
    name: 'USB-C Docking Station', 
    sku: 'ACC-055', 
    category: 'Accessories', 
    price: 89.99, 
    cost: 45.00, 
    stock: 2, 
    minStockLevel: 5, 
    supplier: 'TechDistro Inc' 
  },
  { 
    id: '5', 
    name: '27-inch 4K Monitor', 
    sku: 'MON-4K', 
    category: 'Electronics', 
    price: 450.00, 
    cost: 300.00, 
    stock: 20, 
    minStockLevel: 5, 
    supplier: 'ViewMax',
    batches: [
      { id: 'b7', date: '2023-05-15', quantity: 10, cost: 280.00 },
      { id: 'b8', date: '2023-08-20', quantity: 15, cost: 310.00 }
    ]
  },
  {
    id: '6',
    name: 'Bluetooth Speaker',
    sku: 'SPK-BT',
    category: 'Electronics',
    price: 59.99,
    cost: 30.00,
    stock: 25,
    minStockLevel: 8,
    supplier: 'TechDistro Inc'
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '101', date: new Date(Date.now() - 86400000 * 2).toISOString(), type: TransactionType.SALE, amount: 149.99, description: 'Sale: Wireless Headset', paymentMode: PaymentMode.CARD, status: 'Completed', partyName: 'John Doe' },
  { id: '102', date: new Date(Date.now() - 86400000 * 1).toISOString(), type: TransactionType.SALE, amount: 299.99, description: 'Sale: Office Chair', paymentMode: PaymentMode.UPI, status: 'Completed', partyName: 'Jane Smith' },
  { id: '103', date: new Date().toISOString(), type: TransactionType.EXPENSE, amount: 1200.00, description: 'Monthly Shop Rent', paymentMode: PaymentMode.CREDIT, status: 'Completed' },
  { id: '104', date: new Date().toISOString(), type: TransactionType.SALE, amount: 450.00, description: 'Sale: 4K Monitor', paymentMode: PaymentMode.CASH, status: 'Completed', partyName: 'John Doe' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1 555-0101', totalSpent: 1250.50, loyaltyPoints: 450, creditBalance: 0, segment: 'VIP' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 555-0102', totalSpent: 350.00, loyaltyPoints: 120, creditBalance: 50.00, segment: 'Regular' },
  { id: '3', name: 'Robert Brown', email: 'robert@example.com', phone: '+1 555-0103', totalSpent: 89.99, loyaltyPoints: 25, creditBalance: 0, segment: 'New' },
];

const INITIAL_LEADS: Lead[] = [
  { id: 'l1', name: 'Alice Corp', company: 'Alice Industries', email: 'alice@corp.com', phone: '+1 555-1001', value: 5000, stage: 'Qualified', source: 'Website', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'l2', name: 'Bob Enterprise', company: 'Bob Global', email: 'contact@bob.com', phone: '+1 555-1002', value: 12000, stage: 'Proposal', source: 'Referral', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'l3', name: 'Charlie Ltd', company: 'Charlie Co', email: 'info@charlie.com', phone: '+1 555-1003', value: 2500, stage: 'New', source: 'LinkedIn', createdAt: new Date().toISOString() },
];

const INITIAL_TASKS: CRMTask[] = [
  { id: 't1', title: 'Follow up with Alice Corp', dueDate: new Date(Date.now() + 86400000).toISOString(), priority: 'High', status: 'Pending', relatedTo: 'Alice Corp' },
  { id: 't2', title: 'Send proposal to Bob', dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), priority: 'Medium', status: 'Pending', relatedTo: 'Bob Enterprise' },
];

const INITIAL_DOCUMENTS: Document[] = [
  { 
    id: '1', 
    name: 'Store Lease Agreement 2024', 
    type: 'Contract', 
    dateUploaded: new Date(Date.now() - 86400000 * 30).toISOString(), 
    size: '2.4 MB', 
    url: '#',
    versions: [
      { id: 'v1', version: 1, dateUploaded: new Date(Date.now() - 86400000 * 30).toISOString(), size: '2.4 MB', url: '#', note: 'Initial upload' }
    ]
  },
  { 
    id: '2', 
    name: 'Q3 Supplier Invoices', 
    type: 'Invoice', 
    dateUploaded: new Date(Date.now() - 86400000 * 5).toISOString(), 
    size: '850 KB', 
    url: '#',
    versions: [
      { id: 'v1', version: 1, dateUploaded: new Date(Date.now() - 86400000 * 5).toISOString(), size: '850 KB', url: '#', note: 'Consolidated PDF' }
    ]
  },
  { 
    id: '3', 
    name: 'Employee Handbook', 
    type: 'Manual', 
    dateUploaded: new Date(Date.now() - 86400000 * 60).toISOString(), 
    size: '1.2 MB', 
    url: '#',
    versions: [
       { id: 'v1', version: 1, dateUploaded: new Date(Date.now() - 86400000 * 120).toISOString(), size: '1.0 MB', url: '#', note: 'Draft' },
       { id: 'v2', version: 2, dateUploaded: new Date(Date.now() - 86400000 * 60).toISOString(), size: '1.2 MB', url: '#', note: 'Final Version' }
    ]
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { 
    id: '1', 
    name: 'TechDistro Inc', 
    contact: '+1 555-0201', 
    email: 'accounts@techdistro.com', 
    balanceDue: 1500.00, 
    lastPaymentDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString()
  },
  { 
    id: '2', 
    name: 'OfficeSupplies Co', 
    contact: '+1 555-0202', 
    email: 'billing@officesupplies.com', 
    balanceDue: 0, 
    lastPaymentDate: new Date(Date.now() - 86400000 * 45).toISOString() 
  },
  {
    id: '3',
    name: 'KeyMasters',
    contact: '+1 555-0203',
    email: 'sales@keymasters.com',
    balanceDue: 450.50,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString()
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>(INITIAL_TASKS);

  // Helper to add transaction
  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} products={products} />;
      case 'inventory':
        return <Inventory products={products} setProducts={setProducts} />;
      case 'finance':
        return (
          <Finance 
            transactions={transactions} 
            addTransaction={addTransaction} 
            suppliers={suppliers}
            setSuppliers={setSuppliers}
          />
        );
      case 'crm':
        return (
          <CRM 
            customers={customers} 
            setCustomers={setCustomers} 
            transactions={transactions}
            leads={leads}
            setLeads={setLeads}
            tasks={crmTasks}
            setTasks={setCrmTasks}
          />
        );
      case 'documents':
        return <Documents documents={documents} setDocuments={setDocuments} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard transactions={transactions} products={products} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onNavigate={setActiveTab} user={MOCK_USER}>
      {renderContent()}
    </Layout>
  );
}

export default App;
