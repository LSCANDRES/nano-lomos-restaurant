'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order, DishRecipe, User } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

export default function CookDashboard() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user] = useState<User | null>(() => api.getUser());
  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [wsConnected, setWsConnected] = useState<boolean>(() => !!wsClient.getSocket()?.connected);

  // Modal de Receta
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<DishRecipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!api.getUser()) {
      startTransition(() => router.replace('/login'));
    }
  }, [router]);

  // Cargar pedidos de cocina
  const loadKitchenData = useCallback(async () => {
    try {
      const [queue, my, ready] = await Promise.all([
        api.getKitchenQueue(),
        api.getKitchenMyOrders(),
        api.getKitchenReadyOrders(),
      ]);
      setQueueOrders(queue);
      setMyOrders(my);
      setReadyOrders(ready);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar comandas de cocina';
      setFeedback(msg);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [queue, my, ready] = await Promise.all([
          api.getKitchenQueue(),
          api.getKitchenMyOrders(),
          api.getKitchenReadyOrders(),
        ]);
        if (!active) return;
        setQueueOrders(queue);
        setMyOrders(my);
        setReadyOrders(ready);
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Error al cargar comandas de cocina';
        setFeedback(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Conexión y suscripción a eventos en tiempo real
    const socket = wsClient.connect();
    if (socket) {
      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));
    }

    const unsubCreated = wsClient.on('order:created', () => {
      loadKitchenData();
    });

    const unsubStatus = wsClient.on('order:status_changed', () => {
      loadKitchenData();
    });

    // Auto-refresh de seguridad cada 15 segundos para temporizadores de cocción
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      unsubCreated();
      unsubStatus();
    };
  }, [loadKitchenData]);

  const handleLogout = async () => {
    await api.logout();
    startTransition(() => router.replace('/login'));
  };

  const handleTakeOrder = async (orderId: number) => {
    try {
      await api.takeKitchenOrder(orderId);
      await loadKitchenData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al tomar el pedido';
      setFeedback(msg);
    }
  };

  const handleStartOrder = async (orderId: number) => {
    try {
      await api.startKitchenOrder(orderId);
      await loadKitchenData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar preparación';
      setFeedback(msg);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await api.completeKitchenOrder(orderId);
      await loadKitchenData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al marcar como listo';
      setFeedback(msg);
    }
  };

  const handleViewRecipe = async (menuItemId: number) => {
    try {
      setLoadingRecipe(true);
      setRecipeModalOpen(true);
      const recipe = await api.getKitchenRecipe(menuItemId);
      setCurrentRecipe(recipe);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la receta';
      setFeedback(msg);
      setRecipeModalOpen(false);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const formatElapsed = (dateStr: string) => {
    if (!currentTime) return 'recién';
    const elapsedMinutes = Math.floor((currentTime - new Date(dateStr).getTime()) / 60000);
    if (elapsedMinutes < 1) return 'recién';
    return `hace ${elapsedMinutes}m`;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-nanolomos.png"
              alt="Nano Lomos Logo"
              className="h-10 w-auto object-contain rounded-lg border border-slate-200 bg-slate-900 p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wider text-slate-900 uppercase">Nano Lomos • Cocina</h1>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                    wsConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200 animate-pulse'
                  }`}
                  title={wsConnected ? 'Conexión WebSocket activa' : 'Reconectando WebSocket...'}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {wsConnected ? 'EN VIVO' : 'CONECTANDO'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Pantalla de Producción (KDS)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900">{user?.fullName || user?.username}</p>
              <p className="text-[11px] text-slate-500 font-medium">Cocinero</p>
            </div>
            <button
              onClick={loadKitchenData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all text-xs cursor-pointer"
              title="Refrescar comanda"
            >
              🔄
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Kanban */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {feedback && (
          <div className="mb-4 p-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs flex justify-between items-center shadow-xs">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="underline cursor-pointer">Cerrar</button>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna 1: En Cola (Pendientes) */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">En Cola</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                {queueOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loading && queueOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Cargando cola...</div>
              ) : queueOrders.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No hay pedidos pendientes en cola</div>
              ) : (
                queueOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 space-y-3 shadow-xs"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-base font-bold text-slate-900">
                        {order.table_number ? `Mesa ${order.table_number}` : 'Mostrador'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {formatElapsed(order.created_at)}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-b border-slate-200 py-2">
                      {order.order_lines.map((line) => (
                        <div key={line.id} className="flex justify-between items-start text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{line.quantity}x</span>{' '}
                            <span className="text-slate-800">{line.menu_items.name}</span>
                            {line.notes && (
                              <p className="text-[11px] text-slate-600 italic ml-4">↳ &ldquo;{line.notes}&rdquo;</p>
                            )}
                          </div>
                          {line.menu_items.id && (
                            <button
                              onClick={() => handleViewRecipe(line.menu_items.id!)}
                              className="text-[10px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                            >
                              Receta
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleTakeOrder(order.id)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Tomar Pedido
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna 2: En Preparación (Mis Pedidos) */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Mis Pedidos (En Curso)</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                {myOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {myOrders.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No tienes pedidos tomados en este momento</div>
              ) : (
                myOrders.map((order) => {
                  const isCooking = order.status === 'in_progress';
                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3 shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-base font-bold text-slate-900">
                          {order.table_number ? `Mesa ${order.table_number}` : 'Mostrador'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {isCooking ? 'Cocinando' : 'Tomado'} • {formatElapsed(order.created_at)}
                        </span>
                      </div>

                      <div className="space-y-1.5 border-t border-b border-slate-200 py-2">
                        {order.order_lines.map((line) => (
                          <div key={line.id} className="flex justify-between items-start text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{line.quantity}x</span>{' '}
                              <span className="text-slate-800">{line.menu_items.name}</span>
                              {line.notes && (
                                <p className="text-[11px] text-slate-600 italic ml-4">↳ &ldquo;{line.notes}&rdquo;</p>
                              )}
                            </div>
                            {line.menu_items.id && (
                              <button
                                onClick={() => handleViewRecipe(line.menu_items.id!)}
                                className="text-[10px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                              >
                                Receta
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {!isCooking ? (
                          <button
                            onClick={() => handleStartOrder(order.id)}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                          >
                            Empezar Cocción
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            ✓ Marcar Listo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna 3: Listos para Entregar */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Listos / Despachados</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                {readyOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {readyOrders.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No hay pedidos esperando entrega</div>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-xs"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">
                        {order.table_number ? `Mesa ${order.table_number}` : 'Mostrador'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Listo para el mozo
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {order.order_lines.map((l) => `${l.quantity}x ${l.menu_items.name}`).join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Receta */}
      {recipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {loadingRecipe ? 'Cargando Receta...' : currentRecipe?.dishName}
                </h3>
                <p className="text-xs text-slate-500">Ingredientes y preparación del plato</p>
              </div>
              <button
                onClick={() => setRecipeModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingRecipe ? (
              <div className="py-8 text-center text-xs text-slate-400">Buscando ingredientes...</div>
            ) : currentRecipe ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Ingredientes Requeridos</h4>
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {currentRecipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex justify-between border-b border-slate-100 pb-1">
                        <span>{ing.name}</span>
                        <span className="font-semibold text-slate-600">{ing.quantity} {ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {currentRecipe.ingredients.some((i) => i.instructions) && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Instrucciones</h4>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {currentRecipe.ingredients.find((i) => i.instructions)?.instructions}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No se encontraron detalles de receta para este plato.</p>
            )}

            <button
              onClick={() => setRecipeModalOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
