import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Logo from '../components/common/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      
      // Redirect based on role
      if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'cook') {
        navigate('/cook/dashboard');
      } else if (user.role === 'order_taker') {
        navigate('/order-taker/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Usuario o contraseña incorrectos. Por favor intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (user, pass) => {
    setError('');
    setLoading(true);
    try {
      const userData = await login(user, pass);
      
      // Redirect based on role
      if (userData.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (userData.role === 'cook') {
        navigate('/cook/dashboard');
      } else if (userData.role === 'order_taker') {
        navigate('/order-taker/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Quick login error:', err);
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="xl" />
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              disabled={loading}
              autoFocus
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              disabled={loading}
            />

            {error && (
              <div className="p-3 bg-orange-100 border border-orange-400 rounded-lg">
                <p className="text-sm text-orange-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!username || !password}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center font-semibold mb-3">
              🚀 Acceso rápido (Modo prueba):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin', 'admin123')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <span className="text-2xl">👨‍💼</span>
                <span className="text-xs">Gerente</span>
              </button>
              
              <button
                type="button"
                onClick={() => quickLogin('cocinero1', 'cocina123')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <span className="text-2xl">👨‍🍳</span>
                <span className="text-xs">Cocinero</span>
              </button>
              
              <button
                type="button"
                onClick={() => quickLogin('pedidos1', 'pedidos123')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <span className="text-2xl">📝</span>
                <span className="text-xs">Pedidos</span>
              </button>
              
              <button
                type="button"
                onClick={() => quickLogin('pedidos2', 'pedidos123')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs">Pedidos 2</span>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center mt-6 text-sm text-gray-500">
          © 2026 NANO LOMOS Restaurant
        </p>
      </div>
    </div>
  );
};

export default Login;
