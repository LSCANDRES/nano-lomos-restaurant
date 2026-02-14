import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import kitchenService from '../../services/kitchenService';
import AssignedOrder from '../../components/orders/AssignedOrder';
import StatsCard from '../../components/dashboard/StatsCard';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';

const CookDashboard = () => {
  const [order, setOrder] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadData(true); // silent refresh
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      const [orderData, statsData] = await Promise.all([
        kitchenService.getAssignedOrder(),
        kitchenService.getStats(),
      ]);
      
      // API retorna { message, order } cuando no hay pedido
      setOrder(orderData.order || orderData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading kitchen data:', error);
      setError(error.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOrder = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await kitchenService.requestOrder();
      
      if (response.order) {
        setOrder(response.order);
      } else {
        setError(response.message || 'No hay pedidos pendientes');
      }
    } catch (error) {
      console.error('Error requesting order:', error);
      setError(error.response?.data?.message || 'Error al solicitar pedido');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      setError('');
      
      await kitchenService.updateOrderStatus(orderId, newStatus);
      
      // Recargar datos después de actualizar
      await loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Cargando cocina...</p>
        </div>
      </div>
    );
  }

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
                  👨‍🍳 COCINA
                </h1>
                <p className="text-sm text-orange-100">
                  Cocinero: <strong className="text-white">{user?.full_name}</strong>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              icon="✅"
              label="Completados Hoy"
              value={stats?.completed_count || 0}
              color="green"
              loading={!stats}
            />
            <StatsCard
              icon="⏱️"
              label="Tiempo Promedio"
              value={stats ? `${stats.avg_time_minutes} min` : '-'}
              color="blue"
              loading={!stats}
            />
            <StatsCard
              icon="💰"
              label="Total del Día"
              value={stats ? `$${stats.total_revenue.toLocaleString('es-AR')}` : '-'}
              color="gold"
              loading={!stats}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="bg-orange-100 border border-orange-400 rounded-lg p-4 mb-6">
            <p className="text-orange-600 font-semibold">⚠️ {error}</p>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">🔥 Pedido Actual</h2>
          
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => loadData()}>
              🔄 Actualizar
            </Button>
            
            {!order && (
              <Button
                variant="primary"
                onClick={handleRequestOrder}
                disabled={actionLoading}
                loading={actionLoading}
              >
                📥 Solicitar Siguiente Pedido
              </Button>
            )}
          </div>
        </div>

        <AssignedOrder
          order={order}
          onUpdateStatus={handleUpdateStatus}
          loading={actionLoading}
        />
      </div>
    </div>
  );
};

export default CookDashboard;
