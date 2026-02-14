import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import OrderTakerDashboard from './pages/OrderTaker/OrderTakerDashboard';
import CreateOrder from './pages/OrderTaker/CreateOrder';
import CookDashboard from './pages/Cook/CookDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import InventoryView from './pages/Manager/InventoryView';
import MenuManagement from './pages/Manager/MenuManagement';
import UserManagement from './pages/Manager/UserManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <OrderProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
            
            {/* Order Taker Routes */}
            <Route
              path="/order-taker/dashboard"
              element={
                <ProtectedRoute allowedRoles={['order_taker', 'manager']}>
                  <OrderTakerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-taker/create-order"
              element={
                <ProtectedRoute allowedRoles={['order_taker', 'manager']}>
                  <CreateOrder />
                </ProtectedRoute>
              }
            />
            
            {/* Cook Routes */}
            <Route
              path="/cook/dashboard"
              element={
                <ProtectedRoute allowedRoles={['cook', 'manager']}>
                  <CookDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Manager Routes */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/inventory"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <InventoryView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/menu"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <MenuManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/users"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </OrderProvider>
      </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
