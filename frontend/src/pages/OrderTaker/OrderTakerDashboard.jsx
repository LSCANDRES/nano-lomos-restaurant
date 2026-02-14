import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import api from '../../services/api';
import OrderList from '../../components/orders/OrderList';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';

const OrderTakerDashboard = () => {
  const [cooks, setCooks] = useState([]);
  const [cooksLoading, setCooksLoading] = useState(true);
  
  const { user, logout } = useAuth();
  const { orders, loading, connected, fetchOrders, assignOrderToCook, updateOrderStatus } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    
    // Refresh orders every 10 seconds as fallback
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      await fetchOrders();
      await loadCooks();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCooks = async () => {
    try {
      setCooksLoading(true);
      // Get cooks from API
      const response = await api.get('/users/cooks');
      setCooks(response.data);
    } catch (error) {
      console.error('Error loading cooks:', error);
      setCooks([]);
    } finally {
      setCooksLoading(false);
    }
  };

  const handleAssignOrder = async (orderId, cookId) => {
    try {
      await assignOrderToCook(orderId, cookId);
      // Success feedback handled by OrderCard
    } catch (error) {
      console.error('Error assigning order:', error);
      throw error;
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      // Success feedback handled by OrderCard
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const getPendingCount = () => {
    return orders.filter((o) => o.status === 'pending').length;
  };

  const getInProgressCount = () => {
    return orders.filter((o) => o.status === 'in_progress' || o.status === 'assigned').length;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Logo size="sm" showSubtitle={false} darkMode={true} />
              <div className="border-l border-orange-400 pl-4">
                <h1 className="text-2xl font-bold text-white">
                  📋 PEDIDOS
                </h1>
                <p className="text-sm text-orange-100">
                  Bienvenido, <strong className="text-white">{user?.full_name}</strong>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user?.role === 'manager' && (
                <Button variant="secondary" size="sm" onClick={() => navigate('/manager/dashboard')}>
                  ← Dashboard
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={logout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-6">
          <div className="grid grid-cols-4 md:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white border border-gray-300 rounded-lg p-2 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">📊 Total</p>
              <p className="text-2xl sm:text-4xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <div className="bg-white border border-gray-300 rounded-lg p-2 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">⏳ Pend.</p>
              <p className="text-2xl sm:text-4xl font-bold text-gray-800">{getPendingCount()}</p>
            </div>
            <div className="bg-white border border-gray-300 rounded-lg p-2 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">🔥 Proc.</p>
              <p className="text-2xl sm:text-4xl font-bold text-gray-800">{getInProgressCount()}</p>
            </div>
            <div className="bg-white border border-gray-300 rounded-lg p-2 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">✅ Compl.</p>
              <p className="text-2xl sm:text-4xl font-bold text-gray-800">
                {orders.filter((o) => o.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🍔 Pedidos</h2>
          
          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadData} disabled={loading}>
              🔄 Actualizar
            </Button>
            <Button variant="primary" onClick={() => navigate('/order-taker/create-order')}>
              + Nuevo Pedido
            </Button>
          </div>
        </div>

        <OrderList
          orders={orders}
          onAssignToCook={handleAssignOrder}
          onUpdateStatus={handleUpdateStatus}
          cooks={cooks}
          loading={loading || cooksLoading}
          emptyMessage="No hay pedidos. Crea uno nuevo para comenzar."
        />
      </div>
    </div>
  );
};

export default OrderTakerDashboard;
