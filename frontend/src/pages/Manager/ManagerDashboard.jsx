import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import reportService from '../../services/reportService';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [statusCounts, setStatusCounts] = useState(null);
  const [cookAssignments, setCookAssignments] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      const [dailyStats, status, assignments, items] = await Promise.all([
        reportService.getDailyStats(),
        reportService.getOrdersByStatus(),
        reportService.getCookAssignments(),
        reportService.getTopSellingItems(5)
      ]);
      
      setStats(dailyStats);
      setStatusCounts(status);
      setCookAssignments(assignments);
      setTopItems(items);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.response?.data?.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Cargando dashboard...</p>
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
                  📊 DASHBOARD GERENCIAL
                </h1>
                <p className="text-sm text-orange-100">
                  Gerente: <strong className="text-white">{user?.full_name}</strong>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => navigate('/order-taker/dashboard')}>
                🛒 Pedidos
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/cook/dashboard')}>
                👨‍🍳 Cocina
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/manager/inventory')}>
                📦 Inventario
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/manager/menu')}>
                🍽️ Menú
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/manager/users')}>
                👥 Usuarios
              </Button>
              <Button variant="secondary" size="sm" onClick={() => loadData()}>
                🔄
              </Button>
              <Button variant="secondary" size="sm" onClick={logout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-orange-100 border border-orange-400 rounded-lg p-4">
            <p className="text-orange-600 font-semibold">⚠️ {error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 font-semibold mb-1">📊 Pedidos Hoy</p>
            <p className="text-4xl font-bold text-gray-800">{stats?.total_orders || 0}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 font-semibold mb-1">✅ Completados</p>
            <p className="text-4xl font-bold text-gray-800">{stats?.completed_orders || 0}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 font-semibold mb-1">💰 Recaudación</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats?.total_revenue || 0)}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 font-semibold mb-1">⏱️ Tiempo Promedio</p>
            <p className="text-4xl font-bold text-gray-800">{stats?.avg_completion_time_minutes || 0} min</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
              <h2 className="text-lg font-bold text-white">📋 Pedidos por Estado</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">⏳ Pendientes</span>
                  <span className="text-2xl font-bold text-gray-800">{statusCounts?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">👤 Asignados</span>
                  <span className="text-2xl font-bold text-gray-800">{statusCounts?.assigned || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">🔥 En Proceso</span>
                  <span className="text-2xl font-bold text-gray-800">{statusCounts?.in_progress || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">✅ Completados</span>
                  <span className="text-2xl font-bold text-gray-800">{statusCounts?.completed || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cook Assignments */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
              <h2 className="text-lg font-bold text-white">👨‍🍳 Asignaciones de Cocineros</h2>
            </div>
            <div className="p-6">
              {cookAssignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay cocineros registrados</p>
              ) : (
                <div className="space-y-3">
                  {cookAssignments.map((cook) => (
                    <div key={cook.cook_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">{cook.cook_name}</p>
                        <p className="text-sm text-gray-500">
                          {cook.active_orders > 0 
                            ? `${cook.active_orders} pedido(s) activo(s)` 
                            : 'Sin pedidos activos'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">{cook.completed_today}</p>
                        <p className="text-xs text-gray-500">completados hoy</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="mt-6 bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
            <h2 className="text-lg font-bold text-white">🏆 Items Más Vendidos Hoy</h2>
          </div>
          <div className="p-6">
            {topItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay ventas registradas hoy</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-700">#</th>
                      <th className="pb-3 font-semibold text-gray-700">Item</th>
                      <th className="pb-3 font-semibold text-gray-700">Categoría</th>
                      <th className="pb-3 font-semibold text-gray-700 text-right">Cantidad</th>
                      <th className="pb-3 font-semibold text-gray-700 text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 font-bold text-orange-600">{index + 1}</td>
                        <td className="py-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="py-3 text-gray-600">{item.category}</td>
                        <td className="py-3 text-right font-bold text-gray-800">{item.total_quantity}</td>
                        <td className="py-3 text-right font-bold text-orange-600">{formatCurrency(item.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Datos del día: <strong>{stats?.date}</strong> • Última actualización: {new Date().toLocaleTimeString('es-AR')}</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
