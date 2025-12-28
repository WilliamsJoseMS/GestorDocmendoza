import React, { useMemo } from 'react';
import { Document, Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, TrendingUp, Package, AlertCircle } from 'lucide-react';

interface DashboardProps {
  documents: Document[];
  inventory: Product[];
}

export const Dashboard: React.FC<DashboardProps> = ({ documents, inventory }) => {
  
  const stats = useMemo(() => {
    const totalSales = documents.reduce((acc, doc) => acc + doc.total, 0);
    const budgetCount = documents.filter(d => d.type === 'presupuesto').length;
    const deliveryCount = documents.filter(d => d.type === 'entrega').length;
    const lowStock = inventory.filter(p => p.stock < 5).length;
    
    return { totalSales, budgetCount, deliveryCount, lowStock };
  }, [documents, inventory]);

  const chartData = useMemo(() => {
    // Group by Month (simplified)
    const grouped = documents.reduce((acc, doc) => {
        const month = doc.date.substring(3); // assuming DD/MM/YYYY
        if (!acc[month]) acc[month] = { name: month, presupuestos: 0, entregas: 0 };
        if (doc.type === 'presupuesto') acc[month].presupuestos += doc.total;
        else acc[month].entregas += doc.total;
        return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped);
  }, [documents]);

  const pieData = [
    { name: 'Presupuestos', value: stats.budgetCount },
    { name: 'Entregas', value: stats.deliveryCount },
  ];
  const COLORS = ['#0ea5e9', '#0369a1'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Panel de Control</h2>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface p-6 rounded-lg shadow-lg border border-dark-border">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-slate-400">Ventas Totales</p>
                    <p className="text-2xl font-bold text-white">${stats.totalSales.toLocaleString()}</p>
                </div>
                <TrendingUp className="text-green-500 w-8 h-8" />
            </div>
        </div>
        <div className="bg-dark-surface p-6 rounded-lg shadow-lg border border-dark-border">
             <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-slate-400">Presupuestos Emitidos</p>
                    <p className="text-2xl font-bold text-white">{stats.budgetCount}</p>
                </div>
                <FileText className="text-blue-500 w-8 h-8" />
            </div>
        </div>
        <div className="bg-dark-surface p-6 rounded-lg shadow-lg border border-dark-border">
             <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-slate-400">Notas de Entrega</p>
                    <p className="text-2xl font-bold text-white">{stats.deliveryCount}</p>
                </div>
                <FileText className="text-corporate-500 w-8 h-8" />
            </div>
        </div>
        <div className="bg-dark-surface p-6 rounded-lg shadow-lg border border-dark-border">
             <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-slate-400">Stock Bajo</p>
                    <p className="text-2xl font-bold text-red-500">{stats.lowStock}</p>
                </div>
                {stats.lowStock > 0 ? <AlertCircle className="text-red-500 w-8 h-8" /> : <Package className="text-slate-600 w-8 h-8" />}
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-surface p-6 rounded-lg shadow-lg border border-dark-border h-80">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Movimiento Financiero (Mes)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3855" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#151e32', borderColor: '#2a3855', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="presupuestos" fill="#0ea5e9" name="Presupuestos ($)" />
                    <Bar dataKey="entregas" fill="#0369a1" name="Entregas ($)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        <div className="bg-dark-surface p-6 rounded-lg shadow-lg border border-dark-border h-80">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Proporción de Documentos</h3>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#151e32', borderColor: '#2a3855', color: '#fff' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};