import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle
} from 'lucide-react';

interface FinancialReportsProps {
  onBack: () => void;
  cashRegister: any;
  todaysOrders: any[];
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  category: string;
  date: string;
  type: 'gasto' | 'inversion';
  createdAt: string;
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

const FinancialReports: React.FC<FinancialReportsProps> = ({
  onBack,
  cashRegister,
  todaysOrders
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closures, setClosures] = useState<DailyRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const savedExpenses = localStorage.getItem('fischer_expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }

    const savedClosures = localStorage.getItem('fischer_closure_history');
    if (savedClosures) {
      setClosures(JSON.parse(savedClosures));
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return `₡${Math.round(amount).toLocaleString('es-CR')}`;
  };

  const convertToColones = (amount: number, currency: 'CRC' | 'USD') => {
    return currency === 'USD' ? amount * 520 : amount;
  };

  const getFinancialData = () => {
    const today = new Date();
    let startDate: Date;
    
    if (selectedPeriod === 'week') {
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = today.toISOString().split('T')[0];

    const periodClosures = closures.filter(closure => 
      closure.date >= startDateStr && closure.date <= endDateStr
    );

    const totalIncome = periodClosures.reduce((sum, closure) => 
      sum + closure.totalSalesCRC + convertToColones(closure.totalSalesUSD, 'USD'), 0
    );

    const totalOrders = periodClosures.reduce((sum, closure) => 
      sum + closure.totalOrders, 0
    );

    const periodExpenses = expenses.filter(expense => 
      expense.date >= startDateStr && expense.date <= endDateStr
    );

    const totalExpenses = periodExpenses.reduce((sum, expense) => 
      sum + convertToColones(expense.amount, expense.currency), 0
    );

    const gastos = periodExpenses.filter(exp => exp.type === 'gasto');
    const inversiones = periodExpenses.filter(exp => exp.type === 'inversion');

    const totalGastos = gastos.reduce((sum, expense) => 
      sum + convertToColones(expense.amount, expense.currency), 0
    );

    const totalInversiones = inversiones.reduce((sum, expense) => 
      sum + convertToColones(expense.amount, expense.currency), 0
    );

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const daysCount = selectedPeriod === 'week' ? 7 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const operatedDays = periodClosures.length;
    
    const dailyAverageIncome = operatedDays > 0 ? totalIncome / operatedDays : 0;
    const dailyAverageExpenses = daysCount > 0 ? totalExpenses / daysCount : 0;

    const expensesByCategory = periodExpenses.reduce((acc, expense) => {
      const amount = convertToColones(expense.amount, expense.currency);
      acc[expense.category] = (acc[expense.category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    const alerts = [];
    const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;
    
    if (expenseRatio > 0.7) {
      alerts.push({
        type: 'warning' as const,
        message: `Gastos representan ${(expenseRatio * 100).toFixed(1)}% de las ventas ${selectedPeriod === 'week' ? 'semanales' : 'mensuales'}. Revisar costos.`
      });
    }
    
    if (expenseRatio > 0.9) {
      alerts.push({
        type: 'critical' as const,
        message: `⚠️ CRÍTICO: Gastos casi igualan las ventas. Revisar urgentemente.`
      });
    }
    
    if (totalIncome === 0 && operatedDays === 0) {
      alerts.push({
        type: 'info' as const,
        message: `No hay ventas registradas en esta ${selectedPeriod === 'week' ? 'semana' : 'mes'}.`
      });
    }

    return {
      totalIncome,
      totalExpenses,
      totalGastos,
      totalInversiones,
      netProfit,
      profitMargin,
      ordersCount: totalOrders,
      expensesCount: periodExpenses.length,
      expensesByCategory,
      averageOrderValue: totalOrders > 0 ? totalIncome / totalOrders : 0,
      operatedDays,
      dailyAverageIncome,
      dailyAverageExpenses,
      alerts
    };
  };

  const data = getFinancialData();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
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
                  Análisis comparativo semanal/mensual - {getPeriodLabel()}
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
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mb-6 tablet:mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'week', label: 'Esta Semana', description: 'Últimos 7 días' },
              { key: 'month', label: 'Este Mes', description: 'Desde el día 1' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 tablet:px-6 py-3 tablet:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                  selectedPeriod === period.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                    : 'bg-white/70 text-slate-700 hover:bg-white/90'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">{period.label}</div>
                  <div className="text-xs opacity-75">{period.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">
              📊 Análisis de {data.operatedDays} días operados • {data.expensesCount} gastos registrados
            </p>
          </div>
        </div>

        {data.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {data.alerts.map((alert, index) => (
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

        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tablet:text-sm font-semibold text-slate-500 uppercase tracking-wide">Ingresos</p>
                <p className="text-xl tablet:text-3xl font-bold text-green-600 mt-1">
                  {formatCurrency(data.totalIncome)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">
                  {data.ordersCount} órdenes • {data.operatedDays} días
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
                  {formatCurrency(data.totalExpenses)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">{data.expensesCount} registros</p>
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
                  data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(data.netProfit)}
                </p>
                <p className="text-xs tablet:text-sm text-slate-500">
                  {data.profitMargin.toFixed(1)}% margen
                </p>
              </div>
              <div className={`p-2 tablet:p-3 rounded-xl ${
                data.netProfit >= 0 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
                <Target className="w-5 tablet:w-8 h-5 tablet:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

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
                    {data.totalExpenses > 0 ? ((data.totalGastos / data.totalExpenses) * 100).toFixed(1) : 0}% del total
                  </p>
                </div>
                <p className="text-lg tablet:text-xl font-bold text-red-700">
                  {formatCurrency(data.totalGastos)}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 tablet:p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="font-medium text-blue-800">Inversiones</p>
                  <p className="text-sm text-blue-600">
                    {data.totalExpenses > 0 ? ((data.totalInversiones / data.totalExpenses) * 100).toFixed(1) : 0}% del total
                  </p>
                </div>
                <p className="text-lg tablet:text-xl font-bold text-blue-700">
                  {formatCurrency(data.totalInversiones)}
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
                  {formatCurrency(data.averageOrderValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Promedio Diario Ingresos:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(data.dailyAverageIncome)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Promedio Diario Gastos:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(data.dailyAverageExpenses)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Eficiencia:</span>
                <span className={`font-bold ${
                  data.profitMargin > 20 ? 'text-green-600' : 
                  data.profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {data.profitMargin > 20 ? 'Excelente' : 
                   data.profitMargin > 10 ? 'Buena' : 'Mejorable'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Días Operados:</span>
                <span className="font-bold text-slate-800">
                  {data.operatedDays} de {selectedPeriod === 'week' ? '7' : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6">
          <h3 className="text-lg tablet:text-xl font-bold text-slate-800 mb-4 tablet:mb-6 flex items-center">
            <BarChart3 className="w-5 tablet:w-6 h-5 tablet:h-6 mr-3 text-blue-600" />
            Gastos por Categoría ({getPeriodLabel()})
          </h3>
          
          {Object.keys(data.expensesByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.expensesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = data.totalExpenses > 0 ? (amount / data.totalExpenses) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-slate-800">
                            {categoryNames[category] || category}
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% del total</p>
                      </div>
                    </div>
                  );
                })}
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

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 tablet:p-6 mt-6">
          <div className="text-center">
            <h4 className="text-lg font-bold text-slate-800 mb-2">Resumen del Período</h4>
            <p className="text-slate-600">
              En {getPeriodLabel().toLowerCase()}, el restaurante operó {data.operatedDays} días, 
              generó {formatCurrency(data.totalIncome)} en ingresos, 
              gastó {formatCurrency(data.totalExpenses)} y obtuvo una utilidad de {formatCurrency(data.netProfit)} 
              ({data.profitMargin > 0 ? '+' : ''}{data.profitMargin.toFixed(1)}% margen).
            </p>
            {data.profitMargin < 10 && (
              <p className="text-yellow-600 text-sm mt-2">
                💡 Recomendación: Revisar estructura de gastos para mejorar rentabilidad.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;