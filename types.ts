export type DocType = 'presupuesto' | 'entrega';

export interface CompanySettings {
  name: string;
  rif: string;
  address: string;
  phone: string;
  logoUrl: string;
  email: string;
  terms: string;
  paymentConditions: string;
  nextBudgetNumber: number;
  nextDeliveryNumber: number;
  defaultTaxRate: number;
  currencySymbol: string;
  logoPosition: 'left' | 'center' | 'right';
  primaryColor: string; // Nuevo campo para el color
}

export interface Client {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
}

export interface Product {
  id: string;
  code: string;
  description: string;
  price: number;
  stock: number;
  unit: string;
}

export interface DocItem {
  id: string; // Product ID (optional if custom item)
  rowId: string; // Unique UI ID for React keys
  description: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Document {
  id: string;
  number: string; // The formatted number e.g. MS000303
  type: DocType;
  date: string;
  time: string;
  dueDate?: string;
  
  // Client Info
  clientName: string;
  clientRif: string;
  clientAddress: string;
  clientPhone: string;
  description: string; // General description of work

  // Items
  items: DocItem[];

  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  status: 'draft' | 'final';
}