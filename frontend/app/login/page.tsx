'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired')) {
        setError('Tu sesión de trabajo ha expirado. Por favor, iniciá sesión nuevamente con admin para administrar el personal.');
      }
    }
  }, []);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Redirigir según el rol del usuario
  const redirectByRole = useCallback(
    (role: string) => {
      startTransition(() => {
        if (role === 'cook') {
          router.push('/cook');
        } else if (role === 'order_taker') {
          router.push('/order-taker');
        } else if (role === 'waiter') {
          router.push('/waiter');
        } else {
          router.push('/manager');
        }
      });
    },
    [router]
  );

  // Inicializar Google Sign-In si está configurado el Client ID
  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            try {
              setLoading(true);
              setError(null);
              const result = await api.loginWithGoogle(response.credential);
              redirectByRole(result.user.role);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google.';
              setError(msg);
            } finally {
              setLoading(false);
            }
          },
        });

        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [googleClientId, redirectByRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.login(usernameOrEmail, password);
      redirectByRole(result.user.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-nanolomos.png"
              alt="Nano Lomos Logo Oficial"
              className="h-24 w-auto object-contain rounded-xl drop-shadow-sm"
            />
          </div>
          <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase">Terminal de Operaciones</h1>
          <p className="text-xs text-slate-500 mt-1">Salón • Cocina • Administración y Gerencia</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Usuario o Correo
            </label>
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="admin, pedidos1, cocina1..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400 transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400 transition-all text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-[0.99] text-sm cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-semibold">
            <span className="bg-white px-3 text-slate-400">O accede con Google</span>
          </div>
        </div>

        {googleClientId ? (
          <div id="google-btn-container" className="flex justify-center min-h-[44px]" />
        ) : (
          <div className="p-3 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
            Google OAuth pendiente de configurar en <code className="text-slate-800 font-bold">.env</code>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          <p>Roles: Gerente (admin) • Cocina (cook) • Mozo (order_taker)</p>
        </div>
      </div>
    </div>
  );
}
