import React from 'react';
import { Document, CompanySettings } from '../types';

interface PrintTemplateProps {
  doc: Document;
  settings: CompanySettings;
}

export const PrintTemplate: React.FC<PrintTemplateProps> = ({ doc, settings }) => {
  if (!doc) return <div className="p-10 text-center text-red-500 font-bold bg-white">Error: No hay datos del documento</div>;

  const isBudget = doc.type === 'presupuesto';
  const title = isBudget ? 'PRESUPUESTO' : 'NOTA DE ENTREGA';
  const primaryColor = settings?.primaryColor || '#0369a1'; // Fallback color
  
  // Format currency helper
  const fmt = (n: number | undefined) => (n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Logo alignment logic
  const getHeaderLayout = () => {
      switch(settings?.logoPosition) {
          case 'center': return 'flex-col items-center text-center';
          case 'right': return 'flex-row-reverse text-right justify-between';
          default: return 'flex-row text-left justify-between';
      }
  };

  return (
    <div 
        className="print-container bg-white text-black font-sans shadow-lg print:shadow-none box-border flex flex-col w-[794px] min-h-[1123px] h-auto p-[2cm] print:p-0 print:m-0 print:w-full print:min-h-0"
    >
      
      {/* Header */}
      <div className={`flex ${getHeaderLayout()} items-start mb-6 gap-6`}>
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-28 object-contain max-w-[200px]" />
          )}
          <div className={settings?.logoPosition === 'center' ? 'mt-4' : ''}>
             <h1 className="text-3xl font-bold uppercase tracking-widest text-black mb-1 leading-none">{settings?.name || 'Nombre Empresa'}</h1>
             <p className="text-black font-bold mb-1 text-base">RIF: {settings?.rif || 'J-00000000'}</p>
             <p className="text-black text-sm">{settings?.address || 'Dirección Fiscal'}</p>
             <p className="text-black text-sm">{settings?.phone || 'Teléfono'}</p>
          </div>
      </div>

      {/* Title Bar */}
      <div className="text-white font-bold text-center py-2 text-lg mb-2 uppercase tracking-wider border-y-2 print:border-black !print:text-white" 
           style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: 'white', WebkitPrintColorAdjust: 'exact' }}>
        {title}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 bg-gray-50 border-b-2 border-gray-200 mb-6 p-3 print:border-gray-300 break-inside-avoid">
        <div>
          <span className="font-bold block text-gray-500 uppercase text-xs">Fecha de Emisión</span>
          <span className="text-black text-lg font-medium">{doc.date || 'DD/MM/AAAA'}</span>
        </div>
        <div>
          <span className="font-bold block text-gray-500 uppercase text-xs">Hora</span>
          <span className="text-black text-lg font-medium">{doc.time || '00:00'}</span>
        </div>
        <div className="text-right">
          <span className="font-bold block text-gray-500 uppercase text-xs">Número de Control</span>
          <span className="text-2xl font-bold" style={{ color: primaryColor }}>{doc.number || '000000'}</span>
        </div>
      </div>

      {/* Client Data */}
      <div className="break-inside-avoid">
        <div className="bg-gray-100 font-bold px-3 py-1 text-sm mb-2 uppercase tracking-wider border-l-4"
             style={{ color: primaryColor, borderColor: primaryColor, backgroundColor: '#f3f4f6', WebkitPrintColorAdjust: 'exact' }}>
            Datos del Cliente
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-y-2 mb-8 p-3 text-black border border-gray-100 rounded print:border-gray-200">
            <div className="font-bold text-gray-600">RAZÓN SOCIAL:</div>
            <div className="font-bold text-lg">{doc.clientName || 'Nombre del Cliente'}</div>
            
            <div className="font-bold text-gray-600">DIRECCIÓN:</div>
            <div>{doc.clientAddress || 'Dirección del Cliente'}</div>
            
            <div className="font-bold text-gray-600">RIF / CI:</div>
            <div>{doc.clientRif || 'RIF del Cliente'}</div>
            
            <div className="font-bold text-gray-600">TELÉFONO:</div>
            <div>{doc.clientPhone || 'Teléfono del Cliente'}</div>
            
            <div className="font-bold text-gray-600">DESCRIPCIÓN:</div>
            <div className="italic text-gray-800">{doc.description || 'Descripción del servicio o venta'}</div>
        </div>
      </div>

      {/* Items Table - Flex-1 allows it to take space but not force fixed height */}
      <div className="flex-1">
          <table className="w-full mb-4 border-collapse text-black">
            <thead>
              <tr className="text-white text-center text-sm" style={{ backgroundColor: primaryColor, color: 'white', WebkitPrintColorAdjust: 'exact' }}>
                <th className="py-3 px-2 text-left w-[45%]">DESCRIPCIÓN / PRODUCTO</th>
                <th className="py-3 px-2 w-[10%]">UNIDAD</th>
                <th className="py-3 px-2 w-[10%]">CANT.</th>
                <th className="py-3 px-2 w-[15%]">PRECIO U.</th>
                <th className="py-3 px-2 w-[20%]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {doc.items && doc.items.length > 0 ? (
                  doc.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 text-sm font-bold">
                      <td className="py-3 px-2">{item.description}</td>
                      <td className="py-3 px-2 text-center text-gray-600 uppercase text-xs">{item.unit}</td>
                      <td className="py-3 px-2 text-center">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">{settings?.currencySymbol} {fmt(item.price)}</td>
                      <td className="py-3 px-2 text-right">{settings?.currencySymbol} {fmt(item.total)}</td>
                    </tr>
                  ))
              ) : (
                <tr className="border-b border-gray-200">
                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">No hay ítems agregados</td>
                </tr>
              )}
              
              {/* Filler rows only if very few items and single page, otherwise omit to allow flow */}
              {(!doc.items || doc.items.length < 5) && Array.from({ length: 5 - (doc.items?.length || 0) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-100 print:hidden h-10">
                    <td colSpan={5}></td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Footer Section: Totals + Terms (Grouped to stay together or break together) */}
      <div className="break-inside-avoid mt-4">
          {/* Footer Totals */}
          <div className="flex justify-end mb-8 text-black">
            <div className="w-80 bg-gray-50 border border-gray-200 rounded p-4 print:border-gray-300 print:bg-white">
              <div className="flex justify-between mb-2 text-gray-600">
                <span className="font-bold">SUB-TOTAL</span>
                <span>{settings?.currencySymbol} {fmt(doc.subtotal)}</span>
              </div>
              <div className="flex justify-between mb-2 text-gray-600">
                <span>IVA ({doc.taxRate || 0}%)</span>
                <span>{settings?.currencySymbol} {fmt(doc.taxAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-300 font-bold text-xl" style={{ color: primaryColor }}>
                <span>TOTAL</span>
                <span>{settings?.currencySymbol} {fmt(doc.total)}</span>
              </div>
            </div>
          </div>

          {/* Terms - Only for Presupuesto */}
          {isBudget && (
            <div className="border-t-2 border-gray-300 pt-4 text-xs text-gray-500">
                <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                        <h4 className="font-bold mb-1 uppercase" style={{ color: primaryColor }}>Condiciones de Pago</h4>
                        <p className="whitespace-pre-line leading-relaxed">{settings?.paymentConditions}</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1 uppercase" style={{ color: primaryColor }}>Términos Generales</h4>
                        <p className="whitespace-pre-line leading-relaxed">{settings?.terms}</p>
                    </div>
                </div>
            </div>
          )}

          {/* Attribution */}
          <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-red-400 print:hidden">
              Generado por Sistema de Gestión GestorDoc
          </div>
      </div>

    </div>
  );
};