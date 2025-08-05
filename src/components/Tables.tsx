import React from 'react';
import { useRestaurant } from '../hooks/useRestaurant';
import { useNavigation } from '../hooks/useNavigation';
import { formatCurrency } from '../lib/utils';
import { Clock, Users } from 'lucide-react';

const Tables: React.FC = () => {
  const { tables } = useRestaurant();
  const { goToPOS, goToPayment } = useNavigation();

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600';
      case 'occupied': return 'bg-red-500 hover:bg-red-600';
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cleaning': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'cleaning': return 'Limpieza';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Estado de Mesas</h2>
        <p className="text-gray-600">Gestiona las mesas del restaurante</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`${getTableStatusColor(table.status)} text-white rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105 shadow-lg`}
            onClick={() => {
              if (table.status === 'available') {
                goToPOS(table.id);
              } else if (table.status === 'occupied' && table.currentOrder) {
                goToPayment(table.currentOrder.id, table.id);
              }
            }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">Mesa {table.number}</div>
              <div className="text-sm opacity-90">{getTableStatusText(table.status)}</div>
              
              <div className="flex items-center justify-center text-xs opacity-75 mt-1">
                <Users className="w-3 h-3 mr-1" />
                <span>{table.seats} personas</span>
              </div>
              
              {table.currentOrder && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div className="text-sm font-medium">
                    {formatCurrency(table.currentOrder.total, 'CRC')}
                  </div>
                  <div className="text-xs opacity-75 flex items-center justify-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(table.currentOrder.createdAt).toLocaleTimeString('es-CR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tables;