import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  Package, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Edit,
  Copy,
  Users,
  X,
  Search,
  Menu,
  Eye,
  ZoomIn,
  ZoomOut,
  Monitor,
  ChevronRight,
  Palette
} from 'lucide-react';
import { CompanySettings, Document, DocItem, Product, DocType, Client } from './types';
import * as storage from './services/storage';
import { PrintTemplate } from './components/PrintTemplate';
import { Dashboard } from './components/Dashboard';

// --- Helper Components ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-1 w-full">
    {props.label && <label className="text-xs font-semibold text-slate-400 uppercase">{props.label}</label>}
    <input 
      {...props} 
      className={`bg-dark-bg border border-dark-border text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporate-500 placeholder-slate-600 ${props.className}`} 
    />
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger', size?: 'sm' | 'md' }) => {
  const base = "rounded font-medium flex items-center gap-2 transition-colors justify-center";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2"
  };
  const variants = {
    primary: "bg-corporate-600 text-white hover:bg-corporate-700",
    secondary: "bg-dark-surface border border-dark-border text-slate-300 hover:bg-dark-hover hover:text-white",
    danger: "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className || ''}`} {...props}>{children}</button>;
};

const Modal = ({ title, children, onClose }: { title: string, children?: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 print:hidden">
        <div className="bg-dark-surface border border-dark-border rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg sticky top-0 z-10">
                <h3 className="text-white font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded"><X size={20}/></button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);

const ColorPicker = ({ value, onChange }: { value: string, onChange: (c: string) => void }) => {
    const presets = ['#0369a1', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#000000'];
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                <Palette size={14}/> Color del Documento
            </label>
            <div className="flex flex-wrap gap-2 items-center">
                {presets.map(c => (
                    <button 
                        key={c} 
                        onClick={() => onChange(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${value === c ? 'border-white ring-2 ring-corporate-500' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
                <div className="relative ml-2">
                    <input 
                        type="color" 
                        value={value} 
                        onChange={e => onChange(e.target.value)}
                        className="w-8 h-8 p-0 border-0 rounded overflow-hidden cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  // Navigation & UI State
  const [view, setView] = useState<'dashboard' | 'editor' | 'history' | 'inventory' | 'clients' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [settings, setSettings] = useState<CompanySettings>(storage.getSettings());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Editor State
  const [currentDoc, setCurrentDoc] = useState<Partial<Document>>({
    items: [],
    taxRate: 16,
    subtotal: 0,
    taxAmount: 0,
    total: 0
  });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Prompts State
  const [pendingProduct, setPendingProduct] = useState<Partial<Product> | null>(null);
  const [pendingClient, setPendingClient] = useState<Partial<Client> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Load Initial Data
  useEffect(() => {
    setDocuments(storage.getDocuments());
    setInventory(storage.getInventory());
    setClients(storage.getClients());
  }, []);

  // --- Preview Logic ---
  useEffect(() => {
    if (showPreviewModal) {
        const handleResize = () => {
            const width = window.innerWidth;
            const docWidth = 794;
            const padding = 40;
            let scale = (width - padding) / docWidth;
            scale = Math.min(Math.max(scale, 0.3), 1.0); // Clamp scale
            setPreviewScale(scale);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [showPreviewModal]);

  const handleZoomIn = () => setPreviewScale(p => Math.min(p + 0.1, 1.5));
  const handleZoomOut = () => setPreviewScale(p => Math.max(p - 0.1, 0.3));

  // --- Core Actions ---

  const handleCreateNew = () => {
    const today = new Date();
    setCurrentDoc({
      id: crypto.randomUUID(),
      type: 'presupuesto',
      date: today.toLocaleDateString('es-VE'),
      time: today.toLocaleTimeString('es-VE'),
      items: [],
      taxRate: settings.defaultTaxRate,
      status: 'draft',
      clientName: '',
      clientRif: '',
      clientAddress: '',
      clientPhone: '',
      description: '',
      subtotal: 0,
      taxAmount: 0,
      total: 0
    });
    setView('editor');
    setMobileMenuOpen(false);
  };

  const handleSaveDocument = () => {
    if (!currentDoc.clientName) return alert('El cliente es obligatorio');
    
    let docNumber = currentDoc.number;
    // Generate number if new
    if (!docNumber) {
        const isBudget = currentDoc.type === 'presupuesto';
        const prefix = isBudget ? 'PRE-' : 'NE-';
        const nextNum = isBudget ? settings.nextBudgetNumber : settings.nextDeliveryNumber;
        docNumber = `${prefix}${String(nextNum).padStart(6, '0')}`;
        
        // Update settings counter
        const newSettings = { 
            ...settings, 
            [isBudget ? 'nextBudgetNumber' : 'nextDeliveryNumber']: nextNum + 1 
        };
        storage.saveSettings(newSettings);
        setSettings(newSettings);
    }

    const finalDoc = { ...currentDoc, number: docNumber, status: 'final' } as Document;
    storage.saveDocument(finalDoc);
    setDocuments(storage.getDocuments());
    setCurrentDoc(finalDoc);
    
    // Inventory deduction if Delivery Note
    if (finalDoc.type === 'entrega' && !currentDoc.number) {
        const newInv = [...inventory];
        finalDoc.items.forEach(item => {
            if (item.id) {
                const p = newInv.find(p => p.id === item.id);
                if (p) p.stock -= item.quantity;
            }
        });
        setInventory(newInv);
        newInv.forEach(p => storage.saveProduct(p));
    }

    alert('Documento guardado con éxito');
  };

  const calculateTotals = (items: DocItem[], rate: number) => {
      const sub = items.reduce((acc, i) => acc + i.total, 0);
      const tax = sub * (rate / 100);
      return { subtotal: sub, taxAmount: tax, total: sub + tax };
  };

  // --- Sub-Components Renders ---

  const renderSidebar = () => {
    const links = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
        { id: 'editor', icon: FilePlus, label: 'Nuevo Doc' },
        { id: 'history', icon: History, label: 'Historial' },
        { id: 'inventory', icon: Package, label: 'Inventario' },
        { id: 'clients', icon: Users, label: 'Clientes' },
        { id: 'settings', icon: SettingsIcon, label: 'Config' },
    ];
    return (
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-surface border-r border-dark-border transform transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h1 className="text-xl font-bold text-white tracking-tight">Casticel<span className="text-corporate-500">Manager</span></h1>
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400"><X /></button>
            </div>
            <nav className="p-4 space-y-1">
                {links.map(l => (
                    <button 
                        key={l.id}
                        onClick={() => {
                            if (l.id === 'editor') handleCreateNew();
                            else setView(l.id as any);
                            setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === l.id ? 'bg-corporate-600 text-white' : 'text-slate-400 hover:bg-dark-hover hover:text-white'}`}
                    >
                        <l.icon size={20} />
                        <span className="font-medium">{l.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
  };

  const renderInventory = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-surface p-4 rounded-lg border border-dark-border">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Package className="text-corporate-500"/> Inventario</h2>
              <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                      <input 
                        className="w-full bg-dark-bg border border-dark-border rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-corporate-500"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <Button onClick={() => setEditingProduct({} as Product)}><Plus size={18}/> Nuevo</Button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <div key={p.id} className="bg-dark-surface p-4 rounded-lg border border-dark-border shadow hover:border-corporate-500 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                          <span className="bg-dark-bg text-xs px-2 py-1 rounded text-slate-400 font-mono">{p.code}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingProduct(p)} className="p-1 hover:bg-corporate-600 rounded text-slate-300 hover:text-white"><Edit size={16}/></button>
                              <button onClick={() => { if(confirm('Borrar?')) {storage.deleteProduct(p.id); setInventory(storage.getInventory())} }} className="p-1 hover:bg-red-500 rounded text-slate-300 hover:text-white"><Trash2 size={16}/></button>
                          </div>
                      </div>
                      <h3 className="font-bold text-white mb-1 truncate" title={p.description}>{p.description}</h3>
                      <div className="flex justify-between items-end mt-4">
                          <div>
                              <p className="text-xs text-slate-500 uppercase">Precio</p>
                              <p className="text-lg font-bold text-corporate-400">{settings.currencySymbol}{p.price}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase">Stock</p>
                              <p className={`text-lg font-bold ${p.stock < 5 ? 'text-red-500' : 'text-white'}`}>{p.stock} {p.unit}</p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          {editingProduct && (
              <Modal title={editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'} onClose={() => setEditingProduct(null)}>
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const prod = { ...editingProduct, id: editingProduct.id || crypto.randomUUID() } as Product;
                      storage.saveProduct(prod);
                      setInventory(storage.getInventory());
                      setEditingProduct(null);
                  }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Código" value={editingProduct.code || ''} onChange={e => setEditingProduct({...editingProduct, code: e.target.value})} required />
                        <Input label="Stock" type="number" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} required />
                      </div>
                      <Input label="Descripción" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} required />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Precio" type="number" step="0.01" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} required />
                        <Input label="Unidad" value={editingProduct.unit || 'und'} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} required />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="secondary" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                          <Button type="submit">Guardar</Button>
                      </div>
                  </form>
              </Modal>
          )}
      </div>
  );

  const renderClients = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-surface p-4 rounded-lg border border-dark-border">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="text-corporate-500"/> Clientes</h2>
            <Button onClick={() => setEditingClient({} as Client)}><Plus size={18}/> Nuevo</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {clients.map(c => (
                 <div key={c.id} className="bg-dark-surface p-4 rounded-lg border border-dark-border relative group">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingClient(c)} className="p-1 hover:bg-corporate-600 rounded text-slate-300 hover:text-white"><Edit size={16}/></button>
                            <button onClick={() => { if(confirm('Borrar?')) {storage.deleteClient(c.id); setClients(storage.getClients())} }} className="p-1 hover:bg-red-500 rounded text-slate-300 hover:text-white"><Trash2 size={16}/></button>
                      </div>
                      <h3 className="font-bold text-white text-lg mb-1">{c.name}</h3>
                      <p className="text-slate-400 text-sm mb-3">{c.rif}</p>
                      <div className="space-y-1 text-sm text-slate-300">
                          <p>📞 {c.phone}</p>
                          <p>📍 {c.address}</p>
                      </div>
                 </div>
             ))}
        </div>
        {editingClient && (
            <Modal title="Cliente" onClose={() => setEditingClient(null)}>
                <form onSubmit={e => {
                    e.preventDefault();
                    const c = { ...editingClient, id: editingClient.id || crypto.randomUUID() } as Client;
                    storage.saveClient(c);
                    setClients(storage.getClients());
                    setEditingClient(null);
                }} className="space-y-4">
                    <Input label="Nombre / Razón Social" value={editingClient.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} required />
                    <Input label="RIF / CI" value={editingClient.rif || ''} onChange={e => setEditingClient({...editingClient, rif: e.target.value})} required />
                    <Input label="Teléfono" value={editingClient.phone || ''} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} />
                    <Input label="Dirección" value={editingClient.address || ''} onChange={e => setEditingClient({...editingClient, address: e.target.value})} />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setEditingClient(null)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </Modal>
        )}
    </div>
  );

  const renderHistory = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="bg-dark-surface p-4 rounded-lg border border-dark-border">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4"><History className="text-corporate-500"/> Historial de Documentos</h2>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="text-slate-400 border-b border-dark-border text-sm uppercase">
                              <th className="p-3">Número</th>
                              <th className="p-3">Fecha</th>
                              <th className="p-3">Cliente</th>
                              <th className="p-3">Total</th>
                              <th className="p-3 text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {documents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(doc => (
                              <tr key={doc.id} className="border-b border-dark-border hover:bg-dark-bg transition-colors">
                                  <td className="p-3 font-mono text-corporate-400">{doc.number}</td>
                                  <td className="p-3 text-slate-300">{doc.date}</td>
                                  <td className="p-3 text-white font-medium">{doc.clientName}</td>
                                  <td className="p-3 text-white">{settings.currencySymbol}{doc.total.toFixed(2)}</td>
                                  <td className="p-3 flex justify-end gap-2">
                                      <button title="Editar" onClick={() => { setCurrentDoc(doc); setView('editor'); }} className="p-1.5 hover:bg-corporate-600 rounded text-slate-400 hover:text-white"><Edit size={16}/></button>
                                      <button title="Copiar" onClick={() => { 
                                          const copy = { ...doc, id: crypto.randomUUID(), number: '', date: new Date().toLocaleDateString('es-VE') };
                                          setCurrentDoc(copy); setView('editor');
                                      }} className="p-1.5 hover:bg-corporate-600 rounded text-slate-400 hover:text-white"><Copy size={16}/></button>
                                      <button title="Eliminar" onClick={() => { if(confirm('¿Eliminar?')) { storage.deleteDocument(doc.id); setDocuments(storage.getDocuments()); } }} className="p-1.5 hover:bg-red-500 rounded text-slate-400 hover:text-white"><Trash2 size={16}/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-white">Configuración de Empresa</h2>
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                      <Input label="Nombre de Empresa" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
                      <Input label="RIF" value={settings.rif} onChange={e => setSettings({...settings, rif: e.target.value})} />
                      <Input label="Dirección" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                       <Input label="Teléfono" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
                       <Input label="Logo URL" value={settings.logoUrl} onChange={e => setSettings({...settings, logoUrl: e.target.value})} />
                       <ColorPicker value={settings.primaryColor || '#0369a1'} onChange={c => setSettings({...settings, primaryColor: c})} />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dark-border pt-4">
                   <Input label="Próx. Presupuesto" type="number" value={settings.nextBudgetNumber} onChange={e => setSettings({...settings, nextBudgetNumber: Number(e.target.value)})} />
                   <Input label="Próx. Entrega" type="number" value={settings.nextDeliveryNumber} onChange={e => setSettings({...settings, nextDeliveryNumber: Number(e.target.value)})} />
                   <Input label="Valor IVA (%)" type="number" step="0.01" value={settings.defaultTaxRate} onChange={e => setSettings({...settings, defaultTaxRate: Number(e.target.value)})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-dark-border pt-4">
                  <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase">Condiciones de Pago</label>
                      <textarea 
                          className="w-full bg-dark-bg border border-dark-border text-white rounded p-3 mt-1 h-32 focus:ring-2 focus:ring-corporate-500 outline-none" 
                          value={settings.paymentConditions} 
                          onChange={e => setSettings({...settings, paymentConditions: e.target.value})} 
                      />
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase">Términos Generales</label>
                      <textarea 
                          className="w-full bg-dark-bg border border-dark-border text-white rounded p-3 mt-1 h-32 focus:ring-2 focus:ring-corporate-500 outline-none" 
                          value={settings.terms} 
                          onChange={e => setSettings({...settings, terms: e.target.value})} 
                      />
                  </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={() => {storage.saveSettings(settings); alert('Configuración guardada')}}><Save size={18}/> Guardar Cambios</Button>
              </div>
          </div>
      </div>
  );

  const renderEditor = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-dark-surface p-4 rounded-lg shadow-lg border border-dark-border gap-4 sticky top-0 z-20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {currentDoc.number ? currentDoc.number : 'Nuevo Documento'}
            <span className={`text-xs px-2 py-1 rounded border ${currentDoc.type === 'presupuesto' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-green-900/30 text-green-300 border-green-800'}`}>
                {currentDoc.type?.toUpperCase()}
            </span>
        </h2>
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
            <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => setShowPreviewModal(true)}><Eye size={18}/> <span className="md:hidden">Previsualizar</span><span className="hidden md:inline">Vista Previa</span></Button>
            <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => setView('dashboard')}>Cancelar</Button>
            <Button className="flex-1 md:flex-none" onClick={handleSaveDocument}><Save size={18}/> Guardar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Form */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* General & Client Card */}
            <div className="bg-dark-surface p-6 rounded-lg border border-dark-border space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo</label>
                        <div className="flex gap-2 p-1 bg-dark-bg rounded border border-dark-border">
                            <button onClick={() => setCurrentDoc({...currentDoc, type: 'presupuesto'})} className={`flex-1 py-1 text-sm rounded ${currentDoc.type === 'presupuesto' ? 'bg-corporate-600 text-white' : 'text-slate-400'}`}>Presupuesto</button>
                            <button onClick={() => setCurrentDoc({...currentDoc, type: 'entrega'})} className={`flex-1 py-1 text-sm rounded ${currentDoc.type === 'entrega' ? 'bg-corporate-600 text-white' : 'text-slate-400'}`}>Entrega</button>
                        </div>
                    </div>
                    <Input label="Fecha" type="date" value={currentDoc.date?.split('/').reverse().join('-') || ''} onChange={e => setCurrentDoc({...currentDoc, date: new Date(e.target.value).toLocaleDateString('es-VE')})} />
                </div>
                
                <div className="border-t border-dark-border pt-4">
                    <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2"><Users size={16}/> Datos Cliente</h3>
                    <div className="space-y-4">
                        <div className="relative">
                            <Input 
                                label="Nombre / Razón Social" 
                                list="clientList" 
                                value={currentDoc.clientName || ''} 
                                onChange={e => {
                                    const val = e.target.value;
                                    const match = clients.find(c => c.name === val);
                                    if(match) setCurrentDoc({ ...currentDoc, clientName: match.name, clientRif: match.rif, clientAddress: match.address, clientPhone: match.phone });
                                    else setCurrentDoc({ ...currentDoc, clientName: val });
                                }}
                                onBlur={() => {
                                    if(currentDoc.clientName && !clients.find(c => c.name === currentDoc.clientName)) {
                                        setPendingClient({ 
                                            name: currentDoc.clientName,
                                            rif: currentDoc.clientRif || '',
                                            phone: currentDoc.clientPhone || '',
                                            address: currentDoc.clientAddress || ''
                                        });
                                    }
                                }}
                            />
                            <datalist id="clientList">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="RIF / CI" value={currentDoc.clientRif || ''} onChange={e => setCurrentDoc({...currentDoc, clientRif: e.target.value})} />
                            <Input label="Teléfono" value={currentDoc.clientPhone || ''} onChange={e => setCurrentDoc({...currentDoc, clientPhone: e.target.value})} />
                        </div>
                        <Input label="Dirección" value={currentDoc.clientAddress || ''} onChange={e => setCurrentDoc({...currentDoc, clientAddress: e.target.value})} />
                    </div>
                </div>

                {/* New Section for Description */}
                <div className="border-t border-dark-border pt-4">
                     <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">Descripción del Servicio / Trabajo</label>
                     <textarea 
                        className="w-full bg-dark-bg border border-dark-border text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporate-500 placeholder-slate-600 h-20 resize-none"
                        value={currentDoc.description || ''}
                        onChange={e => setCurrentDoc({...currentDoc, description: e.target.value})}
                        placeholder="Ej. Servicio de mantenimiento preventivo de aires acondicionados..."
                     />
                </div>
            </div>

            {/* Items Card */}
            <div className="bg-dark-surface p-4 md:p-6 rounded-lg border border-dark-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-200">Ítems ({currentDoc.items?.length || 0})</h3>
                    <Button variant="secondary" onClick={() => {
                        const newItems = [...(currentDoc.items || []), { id: '', rowId: crypto.randomUUID(), description: '', unit: 'und', quantity: 1, price: 0, total: 0 }];
                        setCurrentDoc({...currentDoc, items: newItems});
                    }} size="sm"><Plus size={16}/> Agregar</Button>
                </div>
                
                <div className="space-y-3">
                    {currentDoc.items?.map((item, idx) => (
                        <div key={item.rowId} className="bg-dark-bg p-3 rounded border border-dark-border flex flex-col gap-3 relative">
                            <button onClick={() => {
                                const ni = currentDoc.items?.filter((_, i) => i !== idx) || [];
                                setCurrentDoc({ ...currentDoc, items: ni, ...calculateTotals(ni, currentDoc.taxRate || 0) });
                            }} className="absolute top-2 right-2 text-red-500 p-1"><Trash2 size={16}/></button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pr-8">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Descripción</label>
                                    <input 
                                        className="w-full bg-dark-surface text-white text-sm p-1.5 rounded border border-dark-border"
                                        list="prodList"
                                        value={item.description}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const p = inventory.find(p => p.description === val);
                                            const ni = [...(currentDoc.items || [])];
                                            if (p) ni[idx] = { ...ni[idx], id: p.id, description: p.description, price: p.price, unit: p.unit, total: p.price * ni[idx].quantity };
                                            else ni[idx] = { ...ni[idx], description: val };
                                            setCurrentDoc({ ...currentDoc, items: ni, ...calculateTotals(ni, currentDoc.taxRate || 0) });
                                        }}
                                        onBlur={() => { 
                                            if(item.description && !inventory.find(p => p.description === item.description)) {
                                                 setPendingProduct({ 
                                                     description: item.description, 
                                                     price: item.price, 
                                                     unit: item.unit, 
                                                     stock: 0,
                                                     code: ''
                                                 }); 
                                            }
                                        }}
                                    />
                                    <datalist id="prodList">{inventory.map(p => <option key={p.id} value={p.description} />)}</datalist>
                                </div>
                                <div className="grid grid-cols-3 gap-2 md:col-span-2">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Cant.</label>
                                        <input type="number" className="w-full bg-dark-surface text-white text-sm p-1.5 rounded border border-dark-border text-center" value={item.quantity} 
                                            onChange={e => {
                                                const q = Number(e.target.value);
                                                const ni = [...(currentDoc.items || [])];
                                                ni[idx] = { ...ni[idx], quantity: q, total: q * ni[idx].price };
                                                setCurrentDoc({ ...currentDoc, items: ni, ...calculateTotals(ni, currentDoc.taxRate || 0) });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Precio</label>
                                        <input type="number" className="w-full bg-dark-surface text-white text-sm p-1.5 rounded border border-dark-border text-right" value={item.price} 
                                            onChange={e => {
                                                const p = Number(e.target.value);
                                                const ni = [...(currentDoc.items || [])];
                                                ni[idx] = { ...ni[idx], price: p, total: p * ni[idx].quantity };
                                                setCurrentDoc({ ...currentDoc, items: ni, ...calculateTotals(ni, currentDoc.taxRate || 0) });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Total</label>
                                        <div className="w-full bg-dark-bg/50 text-slate-300 text-sm p-1.5 rounded border border-dark-border text-right font-mono">
                                            {item.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end mt-6">
                    <div className="w-full md:w-64 space-y-2 bg-dark-bg p-4 rounded border border-dark-border">
                        <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span> <span className="text-white font-mono">{currentDoc.subtotal?.toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm text-slate-400 items-center">
                            <span>IVA (%) <input className="w-10 bg-dark-surface text-center rounded text-xs py-0.5" value={currentDoc.taxRate} onChange={e => {
                                const r = Number(e.target.value);
                                setCurrentDoc({ ...currentDoc, taxRate: r, ...calculateTotals(currentDoc.items || [], r) });
                            }}/></span> 
                            <span className="text-white font-mono">{currentDoc.taxAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-corporate-400 border-t border-dark-border pt-2"><span>Total</span> <span>{settings.currencySymbol}{currentDoc.total?.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Col: Mini Preview (Desktop only) */}
        <div className="hidden lg:block relative">
             <div className="sticky top-4 space-y-2">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Vista Previa</h3>
                 <div className="bg-white rounded overflow-hidden shadow-2xl origin-top mx-auto ring-1 ring-white/10" style={{ width: '300px', height: '424px' }}>
                    <div className="transform scale-[0.377] origin-top-left w-[794px]" style={{ minHeight: '1123px', height: 'auto' }}>
                         <PrintTemplate doc={currentDoc as Document} settings={settings} />
                    </div>
                 </div>
             </div>
        </div>
      </div>

      {/* Modals for Quick Add */}
      {pendingClient && (
          <Modal title="Registrar Nuevo Cliente" onClose={() => setPendingClient(null)}>
              <form onSubmit={(e) => {
                  e.preventDefault();
                  const newClient = { ...pendingClient, id: crypto.randomUUID() } as Client;
                  storage.saveClient(newClient);
                  setClients(storage.getClients());
                  setPendingClient(null);
                  
                  // Update current document with finalized data
                  setCurrentDoc(prev => ({
                      ...prev,
                      clientName: newClient.name,
                      clientRif: newClient.rif,
                      clientAddress: newClient.address,
                      clientPhone: newClient.phone
                  }));
              }} className="space-y-4">
                  <div className="p-3 bg-blue-900/30 border border-blue-800 rounded text-blue-200 text-sm mb-4">
                     El cliente <b>{pendingClient.name}</b> no existe en el sistema. Complete los datos para registrarlo.
                  </div>
                  <Input label="Nombre / Razón Social" value={pendingClient.name || ''} onChange={e => setPendingClient({...pendingClient, name: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="RIF / CI" value={pendingClient.rif || ''} onChange={e => setPendingClient({...pendingClient, rif: e.target.value})} />
                      <Input label="Teléfono" value={pendingClient.phone || ''} onChange={e => setPendingClient({...pendingClient, phone: e.target.value})} />
                  </div>
                  <Input label="Dirección" value={pendingClient.address || ''} onChange={e => setPendingClient({...pendingClient, address: e.target.value})} />
                  
                  <div className="flex justify-end gap-2 pt-2 border-t border-dark-border mt-4">
                      <Button type="button" variant="secondary" onClick={() => setPendingClient(null)}>Cancelar</Button>
                      <Button type="submit">Guardar Cliente</Button>
                  </div>
              </form>
          </Modal>
      )}
      
      {pendingProduct && (
          <Modal title="Registrar Nuevo Producto" onClose={() => setPendingProduct(null)}>
               <form onSubmit={(e) => {
                  e.preventDefault();
                  if(!pendingProduct.code) return alert('El código es obligatorio');
                  
                  const newProd = { ...pendingProduct, id: crypto.randomUUID() } as Product;
                  storage.saveProduct(newProd);
                  setInventory(storage.getInventory());
                  setPendingProduct(null);
                  
                  // Link document item to new product
                  setCurrentDoc(prev => {
                      const newItems = prev.items?.map(item => {
                          if (item.description === newProd.description) {
                              return { 
                                  ...item, 
                                  id: newProd.id, 
                                  price: newProd.price, 
                                  unit: newProd.unit,
                                  total: item.quantity * newProd.price
                              };
                          }
                          return item;
                      }) || [];
                      const totals = calculateTotals(newItems, prev.taxRate || 0);
                      return { ...prev, items: newItems, ...totals };
                  });
              }} className="space-y-4">
                  <div className="p-3 bg-blue-900/30 border border-blue-800 rounded text-blue-200 text-sm mb-4">
                     El ítem <b>{pendingProduct.description}</b> es nuevo. Complete los datos para añadirlo al inventario.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Código" value={pendingProduct.code || ''} onChange={e => setPendingProduct({...pendingProduct, code: e.target.value})} placeholder="Ej. PRD-001" required />
                    <Input label="Stock Inicial" type="number" value={pendingProduct.stock || 0} onChange={e => setPendingProduct({...pendingProduct, stock: Number(e.target.value)})} />
                  </div>
                  <Input label="Descripción" value={pendingProduct.description || ''} onChange={e => setPendingProduct({...pendingProduct, description: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Precio Unitario" type="number" step="0.01" value={pendingProduct.price || 0} onChange={e => setPendingProduct({...pendingProduct, price: Number(e.target.value)})} required />
                    <Input label="Unidad" value={pendingProduct.unit || 'und'} onChange={e => setPendingProduct({...pendingProduct, unit: e.target.value})} required />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t border-dark-border mt-4">
                      <Button type="button" variant="secondary" onClick={() => setPendingProduct(null)}>Cancelar</Button>
                      <Button type="submit">Guardar Producto</Button>
                  </div>
              </form>
          </Modal>
      )}
    </div>
  );

  return (
    <>
        {/* ÁREA EXCLUSIVA DE IMPRESIÓN */}
        {/* Se mantiene oculta en pantalla y se muestra al 100% solo al imprimir */}
        <div id="printable-content" className="hidden print:block print:w-full print:h-full print:absolute print:top-0 print:left-0 print:bg-white print:z-[9999]">
             <PrintTemplate doc={currentDoc as Document} settings={settings} />
        </div>

        {/* CONTENIDO DE LA APP (Pantalla) */}
        {/* Se oculta automáticamente al imprimir con la clase 'print:hidden' */}
        <div className="flex min-h-screen bg-dark-bg text-slate-200 font-sans print:hidden">
            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur flex flex-col animate-fade-in no-print">
                    <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/50 shrink-0">
                        <h2 className="text-white font-bold flex items-center gap-2"><Eye size={20}/> Vista Previa</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white/10 rounded-lg p-1">
                                <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded text-slate-300"><ZoomOut size={18}/></button>
                                <span className="px-2 py-2 text-xs font-mono text-slate-400 w-12 text-center">{Math.round(previewScale * 100)}%</span>
                                <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded text-slate-300"><ZoomIn size={18}/></button>
                            </div>
                            <Button onClick={() => window.print()}><Printer size={18}/> Imprimir</Button>
                            <button onClick={() => setShowPreviewModal(false)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full"><X size={20}/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto flex justify-center p-8 cursor-grab active:cursor-grabbing bg-gray-900" 
                        ref={previewContainerRef}>
                        {/* Scale Wrapper */}
                        <div style={{ width: 794 * previewScale, minHeight: '100%', position: 'relative', flexShrink: 0 }}>
                            <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: '794px', minHeight: '1123px', height: 'auto' }} className="shadow-2xl">
                                <PrintTemplate doc={currentDoc as Document} settings={settings} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Desktop */}
            <div className="hidden md:block w-64 shrink-0">
                {renderSidebar()}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-dark-surface border-b border-dark-border flex justify-between items-center px-4 sticky top-0 z-30">
                    <div className="font-bold text-lg">Casticel Manager</div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300"><Menu/></button>
                </header>

                {/* Mobile Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden flex">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
                        <div className="w-64 bg-dark-surface h-full relative z-10 shadow-xl">
                            {renderSidebar()}
                        </div>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                    {view === 'dashboard' && <Dashboard documents={documents} inventory={inventory} />}
                    {view === 'editor' && renderEditor()}
                    {view === 'history' && renderHistory()}
                    {view === 'inventory' && renderInventory()}
                    {view === 'clients' && renderClients()}
                    {view === 'settings' && renderSettings()}
                </main>
            </div>
        </div>
    </>
  );
};

export default App;