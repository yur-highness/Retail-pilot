
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface StockBatch {
  id: string;
  date: string; // ISO date string
  quantity: number;
  cost: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStockLevel: number;
  supplier: string;
  batches?: StockBatch[]; // Track historical stock entries for valuation
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  balanceDue: number;
  lastPaymentDate?: string;
  dueDate?: string;
}

export enum TransactionType {
  SALE = 'Sale',
  EXPENSE = 'Expense',
  PURCHASE = 'Purchase'
}

export enum PaymentMode {
  CASH = 'Cash',
  CARD = 'Card',
  UPI = 'UPI',
  CREDIT = 'Credit'
}

export interface Transaction {
  id: string;
  date: string; // ISO date string
  type: TransactionType;
  amount: number;
  description: string;
  paymentMode: PaymentMode;
  partyName?: string; // Customer or Supplier
  category?: string;
  status: 'Completed' | 'Pending';
  receiptUrl?: string; // For expense receipts
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  loyaltyPoints: number;
  creditBalance: number;
  segment: 'New' | 'Regular' | 'VIP';
}

// --- CRM Specific Types ---

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  value: number;
  stage: LeadStage;
  source: string;
  createdAt: string;
}

export interface CRMTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  relatedTo?: string; // Name of lead or customer
}

export interface DocumentVersion {
  id: string;
  version: number;
  dateUploaded: string;
  size: string;
  url: string;
  note?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'Invoice' | 'Contract' | 'Manual' | 'Other';
  dateUploaded: string; // Represents latest version date
  size: string; // Represents latest version size
  url?: string; // Represents latest version url
  versions: DocumentVersion[];
}

export interface DashboardStats {
  totalSales: number;
  netProfit: number;
  totalOrders: number;
  lowStockCount: number;
}
