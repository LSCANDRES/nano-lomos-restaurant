import { useState, useEffect } from 'react';
import OrderCard from './OrderCard';

const OrderList = ({ 
  orders = [], 
  onAssignToCook, 
  onUpdateStatus, 
  cooks = [],
  loading = false,
  emptyMessage = 'No hay pedidos'
}) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState(orders);

  useEffect(() => {
    let result = orders;

    // Filter by status
    if (filter !== 'all') {
      result = result.filter((order) => order.status === filter);
    }

    // Search by table number or customer
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((order) =>
        order.table_number?.toLowerCase().includes(term) ||
        order.customer_name?.toLowerCase().includes(term) ||
        order.id?.toString().includes(term)
      );
    }

    setFilteredOrders(result);
  }, [orders, filter, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-700">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Pendientes ({orders.filter((o) => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
                filter === 'assigned'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Asignados ({orders.filter((o) => o.status === 'assigned').length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
                filter === 'in_progress'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
              }`}
            >
              En Proceso ({orders.filter((o) => o.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
                filter === 'completed'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Completados ({orders.filter((o) => o.status === 'completed').length})
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar por mesa, cliente o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none placeholder-gray-400"
        />
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-gray-300 rounded-lg">
          <p className="text-gray-600 text-lg font-bold">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAssignToCook={onAssignToCook}
              onUpdateStatus={onUpdateStatus}
              cooks={cooks}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;
