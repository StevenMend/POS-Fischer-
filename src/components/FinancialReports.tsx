




// import React, { useState } from 'react';
// import { 
//   ArrowLeft, 
//   TrendingUp, 
//   TrendingDown,
//   DollarSign, 
//   Calendar,
//   BarChart3,
//   PieChart,
//   Target,
//   AlertTriangle,
//   Clock
// } from 'lucide-react';

// // 🔥 PROPS ACTUALIZADAS - Solo quincenal y mensual
// interface FinancialReportsProps {
//   onBack: () => void;
//   expenses: Expense[];
//   getFinancialStats: (period: 'biweekly' | 'month') => FinancialStats;
//   getClosureHistory: () => DailyRecord[];
// }

// interface Expense {
//   id: string;
//   description: string;
//   amount: number;
//   currency: 'CRC' | 'USD';
//   category: string;
//   date: string;
//   type: 'gasto' | 'inversion';
//   createdAt?: string;
// }

// interface DailyRecord {
//   id: string;
//   date: string;
//   totalSalesCRC: number;
//   totalSalesUSD: number;
//   totalOrders: number;
//   averageOrderValue: number;
//   cashPaymentsCRC: number;
//   cashPaymentsUSD: number;
//   cardPaymentsCRC: number;
//   cardPaymentsUSD: number;
//   openedAt: string;
//   closedAt: string;
// }

// interface FinancialStats {
//   period: 'biweekly' | 'month';
//   startDate: string;
//   endDate: string;
//   totalIncome: number;
//   ordersCount: number;
//   averageOrderValue: number;
//   closuresCount: number;
//   totalExpenses: number;
//   expensesCount: number;
//   totalGastos: number;
//   totalInversiones: number;
//   netProfit: number;
//   profitMargin: number;
//   efficiency: 'excelente' | 'buena' | 'mejorable';
//   dailyAverageIncome: number;
//   dailyAverageExpenses: number;
//   expensesByCategory: Record<string, number>;
//   topExpenseCategories: Array<{
//     category: string;
//     amount: number;
//     percentage: number;
//   }>;
//   alerts: Array<{
//     type: 'info' | 'warning' | 'critical';
//     message: string;
//   }>;
// }

// const FinancialReports: React.FC<FinancialReportsProps> = ({
//   onBack,
//   expenses,
//   getFinancialStats,
//   getClosureHistory
// }) => {
//   // 🔥 CAMBIO PRINCIPAL: Solo quincenal y mensual, default quincenal
//   const [selectedPeriod, setSelectedPeriod] = useState<'biweekly' | 'month'>('biweekly');

//   const formatCurrency = (amount: number) => {
//     return `₡${Math.round(amount).toLocaleString('es-CR')}`;
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('es-CR', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   // 🔥 USAR SISTEMA UNIFICADO DE STATS
//   const financialStats = getFinancialStats(selectedPeriod);

//   // 🔥 LABELS ACTUALIZADOS
//   const getPeriodLabel = () => {
//     switch (selectedPeriod) {
//       case 'biweekly': return 'Últimos 15 Cierres';
//       case 'month': return 'Últimos 30 Cierres';
//     }
//   };

//   const getPeriodDescription = () => {
//     switch (selectedPeriod) {
//       case 'biweekly': return 'Análisis quincenal basado en días operados reales';
//       case 'month': return 'Análisis mensual basado en días operados reales';
//     }
//   };

//   const categoryNames: Record<string, string> = {
//     ingredientes: 'Ingredientes',
//     servicios: 'Servicios',
//     transporte: 'Transporte',
//     personal: 'Personal',
//     alquiler: 'Alquiler',
//     equipos: 'Equipos',
//     otros: 'Otros'
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 tablet:px-6 py-4 tablet:py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={onBack}
//                 className="p-2 tablet:p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110"
//               >
//                 <ArrowLeft className="w-6 tablet:w-7 h-6 tablet:h-7 text-slate-600" />
//               </button>
//               <div>
//                 <h1 className="text-xl tablet:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
//                   Reportes Financieros
//                 </h1>
//                 <p className="text-sm tablet:text-base text-slate-500 font-medium">
//                   {getPeriodDescription()} - {getPeriodLabel()}
//                 </p>
//               </div>
//             </div>
            
//             <div className="p-2 tablet:p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl">
//               <BarChart3 className="w-6 tablet:w-7 h-6 tablet:h-7 text-white" />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-4 tablet:p-6">
//         {/* 🔥 SELECTOR DE PERÍODO ACTUALIZADO */}
//         <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mb-6 tablet:mb-8">
//           <div className="flex flex-wrap gap-3">
//             {[
//               { 
//                 key: 'biweekly', 
//                 label: 'Quincenal', 
//                 description: 'Últimos 15 cierres',
//                 icon: <Calendar className="w-4 h-4" />,
//                 recommended: true
//               },
//               { 
//                 key: 'month', 
//                 label: 'Mensual', 
//                 description: 'Últimos 30 cierres',
//                 icon: <BarChart3 className="w-4 h-4" />
//               }
//             ].map((period) => (
//               <button
//                 key={period.key}
//                 onClick={() => setSelectedPeriod(period.key as any)}
//                 className={`px-4 tablet:px-6 py-3 tablet:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg relative ${
//                   selectedPeriod === period.key
//                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
//                     : 'bg-white/70 text-slate-700 hover:bg-white/90'
//                 }`}
//               >
//                 {period.recommended && (
//                   <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
//                     Recomendado
//                   </div>
//                 )}
//                 <div className="text-center">
//                   <div className="flex items-center justify-center space-x-2 mb-1">
//                     {period.icon}
//                     <span className="font-bold">{period.label}</span>
//                   </div>
//                   <div className="text-xs opacity-75">{period.description}</div>
//                 </div>
//               </button>
//             ))}
//           </div>
          
//           <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
//             <div className="flex items-start space-x-3">
//               <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
//               <div>
//                 <p className="text-sm font-medium text-blue-800">
//                   📊 Período analizado: {formatDate(financialStats.startDate)} - {formatDate(financialStats.endDate)}
//                 </p>
//                 <p className="text-xs text-blue-600 mt-1">
//                   {financialStats.closuresCount} días operados reales • {financialStats.expensesCount} gastos registrados • {financialStats.ordersCount} órdenes procesadas
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* 🔥 ALERTAS DEL SISTEMA UNIFICADO */}
//         {financialStats.alerts.length > 0 && (
//           <div className="mb-6 space-y-3">
//             {financialStats.alerts.map((alert, index) => (
//               <div key={index} className={`p-4 rounded-xl border ${
//                 alert.type === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
//                 alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
//                 'bg-blue-50 border-blue-200 text-blue-800'
//               }`}>
//                 <div className="flex items-center">
//                   <AlertTriangle className="w-5 h-5 mr-2" />
//                   <p className="text-sm font-medium">{alert.message}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* 🔥 CARDS PRINCIPALES - DATOS DEL SISTEMA UNIFICADO */}
//         <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
//           <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Ingresos</p>
//                 <p className="text-xl tablet:text-3xl font-bold text-green-600 mt-1">
//                   {formatCurrency(financialStats.totalIncome)}
//                 </p>
//                 <p className="text-xs tablet:text-sm text-slate-500">
//                   {financialStats.ordersCount} órdenes • {financialStats.closuresCount} días
//                 </p>
//               </div>
//               <div className="p-2 tablet:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
//                 <TrendingUp className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Gastos</p>
//                 <p className="text-xl tablet:text-3xl font-bold text-red-600 mt-1">
//                   {formatCurrency(financialStats.totalExpenses)}
//                 </p>
//                 <p className="text-xs tablet:text-sm text-slate-500">{financialStats.expensesCount} registros</p>
//               </div>
//               <div className="p-2 tablet:p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
//                 <TrendingDown className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Utilidad</p>
//                 <p className={`text-xl tablet:text-3xl font-bold mt-1 ${
//                   financialStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
//                 }`}>
//                   {formatCurrency(financialStats.netProfit)}
//                 </p>
//                 <p className="text-xs tablet:text-sm text-slate-500">
//                   {financialStats.profitMargin.toFixed(1)}% margen
//                 </p>
//               </div>
//               <div className={`p-2 tablet:p-3 rounded-xl ${
//                 financialStats.netProfit >= 0 
//                   ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
//                   : 'bg-gradient-to-br from-red-500 to-rose-600'
//               }`}>
//                 <Target className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* DESGLOSE DE EGRESOS Y INDICADORES */}
//         <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-8 mb-6 tablet:mb-8">
//           <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
//             <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
//               <PieChart className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-purple-600" />
//               Desglose de Egresos
//             </h3>
            
//             <div className="space-y-4">
//               <div className="flex justify-between items-center p-3 tablet:p-4 bg-red-50 rounded-xl">
//                 <div>
//                   <p className="font-medium text-red-800">Gastos Operativos</p>
//                   <p className="text-sm text-red-600">
//                     {financialStats.totalExpenses > 0 ? ((financialStats.totalGastos / financialStats.totalExpenses) * 100).toFixed(1) : 0}% del total
//                   </p>
//                 </div>
//                 <p className="text-lg tablet:text-xl font-bold text-red-700">
//                   {formatCurrency(financialStats.totalGastos)}
//                 </p>
//               </div>

//               <div className="flex justify-between items-center p-3 tablet:p-4 bg-blue-50 rounded-xl">
//                 <div>
//                   <p className="font-medium text-blue-800">Inversiones</p>
//                   <p className="text-sm text-blue-600">
//                     {financialStats.totalExpenses > 0 ? ((financialStats.totalInversiones / financialStats.totalExpenses) * 100).toFixed(1) : 0}% del total
//                   </p>
//                 </div>
//                 <p className="text-lg tablet:text-xl font-bold text-blue-700">
//                   {formatCurrency(financialStats.totalInversiones)}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
//             <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
//               <Target className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-green-600" />
//               Indicadores Clave
//             </h3>
            
//             <div className="space-y-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-slate-600">Promedio por Orden:</span>
//                 <span className="font-bold text-slate-800">
//                   {formatCurrency(financialStats.averageOrderValue)}
//                 </span>
//               </div>
              
//               <div className="flex justify-between items-center">
//                 <span className="text-slate-600">Promedio Diario Ingresos:</span>
//                 <span className="font-bold text-slate-800">
//                   {formatCurrency(financialStats.dailyAverageIncome)}
//                 </span>
//               </div>
              
//               <div className="flex justify-between items-center">
//                 <span className="text-slate-600">Promedio Diario Gastos:</span>
//                 <span className="font-bold text-slate-800">
//                   {formatCurrency(financialStats.dailyAverageExpenses)}
//                 </span>
//               </div>
              
//               <div className="flex justify-between items-center">
//                 <span className="text-slate-600">Eficiencia:</span>
//                 <span className={`font-bold px-2 py-1 rounded-full text-xs ${
//                   financialStats.efficiency === 'excelente' ? 'bg-green-100 text-green-700' : 
//                   financialStats.efficiency === 'buena' ? 'bg-yellow-100 text-yellow-700' : 
//                   'bg-red-100 text-red-700'
//                 }`}>
//                   {financialStats.efficiency.toUpperCase()}
//                 </span>
//               </div>

//               <div className="flex justify-between items-center">
//                 <span className="text-slate-600">Días Operados:</span>
//                 <span className="font-bold text-slate-800">
//                   {financialStats.closuresCount} días reales
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* GASTOS POR CATEGORÍA */}
//         <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
//           <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
//             <BarChart3 className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-blue-600" />
//             Gastos por Categoría ({getPeriodLabel()})
//           </h3>
          
//           {financialStats.topExpenseCategories.length > 0 ? (
//             <div className="space-y-3">
//               {financialStats.topExpenseCategories.map((category) => (
//                 <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
//                   <div className="flex-1">
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="font-medium text-slate-800">
//                         {categoryNames[category.category] || category.category}
//                       </span>
//                       <span className="font-bold text-slate-800">
//                         {formatCurrency(category.amount)}
//                       </span>
//                     </div>
//                     <div className="w-full bg-slate-200 rounded-full h-2">
//                       <div 
//                         className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
//                         style={{ width: `${category.percentage}%` }}
//                       ></div>
//                     </div>
//                     <p className="text-xs text-slate-500 mt-1">{category.percentage.toFixed(1)}% del total</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-slate-500">No hay gastos registrados en este período</p>
//               <p className="text-sm text-slate-400 mt-2">
//                 Los gastos aparecerán aquí cuando se registren en Gestión de Gastos
//               </p>
//             </div>
//           )}
//         </div>

//         {/* RESUMEN FINAL */}
//         <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mt-6">
//           <div className="text-center">
//             <h4 className="text-lg font-bold text-slate-800 mb-2">Resumen del Período</h4>
//             <p className="text-slate-600">
//               En los últimos {financialStats.closuresCount} días operados ({getPeriodLabel().toLowerCase()}), 
//               el restaurante generó {formatCurrency(financialStats.totalIncome)} en ingresos, 
//               gastó {formatCurrency(financialStats.totalExpenses)} y obtuvo una utilidad de {formatCurrency(financialStats.netProfit)} 
//               ({financialStats.profitMargin > 0 ? '+' : ''}{financialStats.profitMargin.toFixed(1)}% margen).
//             </p>
//             {financialStats.efficiency === 'mejorable' && (
//               <p className="text-yellow-600 text-sm mt-2">
//                 💡 Recomendación: Revisar estructura de gastos para mejorar rentabilidad.
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FinancialReports;




import React, { useState } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  Clock,
  Heart,
  Shield,
  AlertCircle
} from 'lucide-react';

// Props interface (igual que tienes)
interface FinancialReportsProps {
  onBack: () => void;
  expenses: Expense[];
  getFinancialStats: (period: 'biweekly' | 'month') => FinancialStats;
  getClosureHistory: () => DailyRecord[];
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  category: string;
  date: string;
  type: 'gasto' | 'inversion';
  createdAt?: string;
}

interface DailyRecord {
  id: string;
  date: string;
  totalSalesCRC: number;
  totalSalesUSD: number;
  totalOrders: number;
  averageOrderValue: number;
  cashPaymentsCRC: number;
  cashPaymentsUSD: number;
  cardPaymentsCRC: number;
  cardPaymentsUSD: number;
  openedAt: string;
  closedAt: string;
}

interface FinancialStats {
  period: 'biweekly' | 'month';
  startDate: string;
  endDate: string;
  totalIncome: number;
  ordersCount: number;
  averageOrderValue: number;
  closuresCount: number;
  totalExpenses: number;
  expensesCount: number;
  totalGastos: number;
  totalInversiones: number;
  netProfit: number;
  profitMargin: number;
  efficiency: 'excelente' | 'buena' | 'mejorable';
  dailyAverageIncome: number;
  dailyAverageExpenses: number;
  expensesByCategory: Record<string, number>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  alerts: Array<{
    type: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({
  onBack,
  expenses,
  getFinancialStats,
  getClosureHistory
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'biweekly' | 'month'>('biweekly');

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const financialStats = getFinancialStats(selectedPeriod);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'biweekly': return 'Últimos 15 Cierres';
      case 'month': return 'Últimos 30 Cierres';
    }
  };

  const getPeriodDescription = () => {
    switch (selectedPeriod) {
      case 'biweekly': return 'Análisis quincenal basado en días operados reales';
      case 'month': return 'Análisis mensual basado en días operados reales';
    }
  };

  const categoryNames: Record<string, string> = {
    ingredientes: 'Ingredientes',
    servicios: 'Servicios',
    transporte: 'Transporte',
    personal: 'Personal',
    alquiler: 'Alquiler',
    equipos: 'Equipos',
    otros: 'Otros'
  };

  // Función para evaluación de salud financiera
  const getFinancialHealth = () => {
    const margin = financialStats.profitMargin;
    if (margin > 60) {
      return {
        status: 'excelente',
        color: 'green',
        icon: <Heart className="w-6 h-6" />,
        message: 'Excelente salud financiera',
        description: 'Tu restaurante está operando de manera excepcional'
      };
    } else if (margin >= 30) {
      return {
        status: 'buena',
        color: 'yellow',
        icon: <Shield className="w-6 h-6" />,
        message: 'Buena salud financiera',
        description: 'Operación saludable con margen sólido'
      };
    } else {
      return {
        status: 'atencion',
        color: 'red',
        icon: <AlertCircle className="w-6 h-6" />,
        message: 'Requiere atención',
        description: 'Es momento de revisar la estructura de costos'
      };
    }
  };

  const financialHealth = getFinancialHealth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 tablet:px-6 py-4 tablet:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 tablet:p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-6 tablet:w-7 h-6 tablet:h-7 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl tablet:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Reportes Financieros
                </h1>
                <p className="text-sm tablet:text-base text-slate-500 font-medium">
                  {getPeriodDescription()} - {getPeriodLabel()}
                </p>
              </div>
            </div>
            
            <div className="p-2 tablet:p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl">
              <BarChart3 className="w-6 tablet:w-7 h-6 tablet:h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 tablet:p-6">
        {/* SELECTOR DE PERÍODO */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mb-6 tablet:mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { 
                key: 'biweekly', 
                label: 'Quincenal', 
                description: 'Últimos 15 cierres',
                icon: <Calendar className="w-4 h-4" />,
                recommended: true
              },
              { 
                key: 'month', 
                label: 'Mensual', 
                description: 'Últimos 30 cierres',
                icon: <BarChart3 className="w-4 h-4" />
              }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 tablet:px-6 py-3 tablet:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg relative ${
                  selectedPeriod === period.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                    : 'bg-white/70 text-slate-700 hover:bg-white/90'
                }`}
              >
                {period.recommended && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Recomendado
                  </div>
                )}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    {period.icon}
                    <span className="font-bold">{period.label}</span>
                  </div>
                  <div className="text-xs opacity-75">{period.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Período analizado: {formatDate(financialStats.startDate)} - {formatDate(financialStats.endDate)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {financialStats.closuresCount} días operados reales • {financialStats.expensesCount} gastos registrados • {financialStats.ordersCount} órdenes procesadas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: DASHBOARD DE SALUD FINANCIERA */}
        <div className={`bg-gradient-to-r rounded-2xl shadow-xl p-6 mb-8 border-2 ${
          financialHealth.status === 'excelente' ? 'from-green-50 to-emerald-50 border-green-300' :
          financialHealth.status === 'buena' ? 'from-yellow-50 to-amber-50 border-yellow-300' :
          'from-red-50 to-rose-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-full ${
                financialHealth.status === 'excelente' ? 'bg-green-500' :
                financialHealth.status === 'buena' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                <div className="text-white">
                  {financialHealth.icon}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-1">
                  {financialHealth.message}
                </h2>
                <p className="text-lg text-slate-600">
                  {financialHealth.description}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Margen de utilidad: <span className="font-bold">{financialStats.profitMargin.toFixed(1)}%</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-6xl font-bold mb-2 ${
                financialHealth.status === 'excelente' ? 'text-green-600' :
                financialHealth.status === 'buena' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {financialStats.profitMargin.toFixed(0)}%
              </div>
              <div className="text-sm text-slate-600">
                de margen
              </div>
            </div>
          </div>
        </div>

        {/* ALERTAS DEL SISTEMA UNIFICADO */}
        {financialStats.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {financialStats.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-xl border ${
                alert.type === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CARDS PRINCIPALES - DATOS DEL SISTEMA UNIFICADO */}
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Ingresos</p>
                <p className="text-xl tablet:text-3xl font-bold text-green-600 mt-1">
                  {formatCurrency(financialStats.totalIncome)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">
                  {financialStats.ordersCount} órdenes • {financialStats.closuresCount} días
                </p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <TrendingUp className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Gastos</p>
                <p className="text-xl tablet:text-3xl font-bold text-red-600 mt-1">
                  {formatCurrency(financialStats.totalExpenses)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">{financialStats.expensesCount} registros</p>
              </div>
              <div className="p-2 tablet:p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
                <TrendingDown className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Utilidad</p>
                <p className={`text-xl tablet:text-3xl font-bold mt-1 ${
                  financialStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financialStats.netProfit)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">
                  {financialStats.profitMargin.toFixed(1)}% margen
                </p>
              </div>
              <div className={`p-2 tablet:p-3 rounded-xl ${
                financialStats.netProfit >= 0 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
                <Target className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* DESGLOSE DE EGRESOS Y INDICADORES */}
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-8 mb-6 tablet:mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
              <PieChart className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-purple-600" />
              Desglose de Egresos
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 tablet:p-4 bg-red-50 rounded-xl">
                <div>
                  <p className="font-medium text-red-800">Gastos Operativos</p>
                  <p className="text-sm text-red-600">
                    {financialStats.totalExpenses > 0 ? ((financialStats.totalGastos / financialStats.totalExpenses) * 100).toFixed(1) : 0}% del total
                  </p>
                </div>
                <p className="text-lg tablet:text-xl font-bold text-red-700">
                  {formatCurrency(financialStats.totalGastos)}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 tablet:p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="font-medium text-blue-800">Inversiones</p>
                  <p className="text-sm text-blue-600">
                    {financialStats.totalExpenses > 0 ? ((financialStats.totalInversiones / financialStats.totalExpenses) * 100).toFixed(1) : 0}% del total
                  </p>
                </div>
                <p className="text-lg tablet:text-xl font-bold text-blue-700">
                  {formatCurrency(financialStats.totalInversiones)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
              <Target className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-green-600" />
              Indicadores Clave
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Promedio por Orden:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(financialStats.averageOrderValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Promedio Diario Ingresos:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(financialStats.dailyAverageIncome)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Promedio Diario Gastos:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(financialStats.dailyAverageExpenses)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Eficiencia:</span>
                <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                  financialStats.efficiency === 'excelente' ? 'bg-green-100 text-green-700' : 
                  financialStats.efficiency === 'buena' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {financialStats.efficiency.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Días Operados:</span>
                <span className="font-bold text-slate-800">
                  {financialStats.closuresCount} días reales
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GASTOS POR CATEGORÍA */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
          <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
            <BarChart3 className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-blue-600" />
            Gastos por Categoría ({getPeriodLabel()})
          </h3>
          
          {financialStats.topExpenseCategories.length > 0 ? (
            <div className="space-y-3">
              {financialStats.topExpenseCategories.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-800">
                        {categoryNames[category.category] || category.category}
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{category.percentage.toFixed(1)}% del total</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No hay gastos registrados en este período</p>
              <p className="text-sm text-slate-400 mt-2">
                Los gastos aparecerán aquí cuando se registren en Gestión de Gastos
              </p>
            </div>
          )}
        </div>

        {/* RESUMEN FINAL */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mt-6">
          <div className="text-center">
            <h4 className="text-lg font-bold text-slate-800 mb-2">Resumen del Período</h4>
            <p className="text-slate-600">
              En los últimos {financialStats.closuresCount} días operados ({getPeriodLabel().toLowerCase()}), 
              el restaurante generó {formatCurrency(financialStats.totalIncome)} en ingresos, 
              gastó {formatCurrency(financialStats.totalExpenses)} y obtuvo una utilidad de {formatCurrency(financialStats.netProfit)} 
              ({financialStats.profitMargin > 0 ? '+' : ''}{financialStats.profitMargin.toFixed(1)}% margen).
            </p>
            {financialStats.efficiency === 'mejorable' && (
              <p className="text-yellow-600 text-sm mt-2">
                Recomendación: Revisar estructura de gastos para mejorar rentabilidad.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;