import { CompanySettings, Document, Product, Client } from '../types';

const KEYS = {
  SETTINGS: 'casticel_settings',
  DOCUMENTS: 'casticel_documents',
  INVENTORY: 'casticel_inventory',
  CLIENTS: 'casticel_clients',
};

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'Casticel C.A.',
  rif: 'J-31348693-0',
  address: 'Av. 5 de Diciembre, al lado del Banco Industrial. Acarigua 3303, Portuguesa.',
  phone: '0416-6367466',
  logoUrl: 'https://picsum.photos/100/100', // Placeholder
  email: 'contacto@casticel.com',
  terms: '* Precios sujetos a cambio sin previo aviso.\n* Validez de la oferta: 5 días.',
  paymentConditions: '80% de anticipo, saldo contra valuaciones parciales.',
  nextBudgetNumber: 1,
  nextDeliveryNumber: 1,
  defaultTaxRate: 16,
  currencySymbol: '$',
  logoPosition: 'left',
  primaryColor: '#0369a1', // Color azul corporativo por defecto
};

// --- Settings ---
export const getSettings = (): CompanySettings => {
  const saved = localStorage.getItem(KEYS.SETTINGS);
  return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: CompanySettings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// --- Documents ---
export const getDocuments = (): Document[] => {
  const saved = localStorage.getItem(KEYS.DOCUMENTS);
  return saved ? JSON.parse(saved) : [];
};

export const saveDocument = (doc: Document) => {
  const docs = getDocuments();
  const existingIndex = docs.findIndex(d => d.id === doc.id);
  
  if (existingIndex >= 0) {
    docs[existingIndex] = doc;
  } else {
    docs.push(doc);
  }
  
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
};

export const deleteDocument = (id: string) => {
  const docs = getDocuments().filter(d => d.id !== id);
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
};

// --- Inventory ---
export const getInventory = (): Product[] => {
  const saved = localStorage.getItem(KEYS.INVENTORY);
  return saved ? JSON.parse(saved) : [];
};

export const saveProduct = (product: Product) => {
  const items = getInventory();
  const index = items.findIndex(p => p.id === product.id);
  if (index >= 0) {
    items[index] = product;
  } else {
    items.push(product);
  }
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
};

export const deleteProduct = (id: string) => {
  const items = getInventory().filter(p => p.id !== id);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
};

// --- Clients ---
export const getClients = (): Client[] => {
  const saved = localStorage.getItem(KEYS.CLIENTS);
  return saved ? JSON.parse(saved) : [];
};

export const saveClient = (client: Client) => {
  const items = getClients();
  const index = items.findIndex(c => c.id === client.id);
  if (index >= 0) {
    items[index] = client;
  } else {
    items.push(client);
  }
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(items));
};

export const deleteClient = (id: string) => {
  const items = getClients().filter(c => c.id !== id);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(items));
};