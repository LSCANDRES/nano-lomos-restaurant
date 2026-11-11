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

    // Conexión WebSocket
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

    // Reloj cada 15 segundos para tiempos de espera
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

  const handleCompleteOrder = async (orderId: number) => {
    try {
      const res = await api.completeKitchenOrder(orderId);
      await loadKitchenData();
      if (res?.whatsappNotified) {
        setFeedback(`🔔 ¡Pedido #${orderId} en mostrador! Alerta de WhatsApp enviada a ${res.whatsappPhone || 'cliente'}.`);
      } else {
        setFeedback(`🔔 ¡Pedido #${orderId} marcado como listo para retirar.`);
      }
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

  const getElapsedTimeInfo = (dateStr?: string | null) => {
    if (!dateStr || !currentTime) return { text: 'recién', isLate: false, isWarn: false };
    const elapsedMinutes = Math.floor((currentTime - new Date(dateStr).getTime()) / 60000);
    if (elapsedMinutes < 1) return { text: 'recién', isLate: false, isWarn: false };
    if (elapsedMinutes >= 15) return { text: `${elapsedMinutes}m de demora`, isLate: true, isWarn: true };
    if (elapsedMinutes >= 10) return { text: `${elapsedMinutes}m`, isLate: false, isWarn: true };
    return { text: `${elapsedMinutes}m`, isLate: false, isWarn: false };
  };

  const formatTurnTag = (order: Order) => {
    if (order.table_number) {
      const match = order.table_number.match(/#?(\d+)/);
      if (match) return `#${match[1]}`;
      return order.table_number;
    }
    return `#${order.id % 100 || order.id}`;
  };

  return (
    <div className="min-h-screen bg-[#121214] text-zinc-100 flex flex-col font-sans select-none">
      
      {/* ================= HEADER KDS OFICIAL NANO LOMOS ================= */}
      <header className="border-b border-zinc-800 bg-[#18181B] sticky top-0 z-20 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Oficial Nano Lomos */}
            <div className="bg-black border-2 border-[#FF5A00] rounded-xl px-3 py-1.5 shadow-md shadow-[#FF5A00]/20 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 font-black text-lg tracking-widest text-white leading-none">
                <span>N</span>
                <span className="relative inline-block">
                  <span>A</span>
                  <span className="absolute top-[2px] left-[4px] text-[8px] text-[#FF5A00]">▲</span>
                </span>
                <span>N</span>
                <span className="inline-block px-1 bg-[#FF5A00] text-black rounded text-sm font-black">O</span>
              </div>
              <span className="text-[7px] font-bold text-[#FF5A00] tracking-[0.25em] uppercase mt-0.5">LOMOS</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wider text-white uppercase">Nano Lomos • Cocina KDS</h1>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                    wsConnected
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 animate-pulse'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-zinc-400'}`} />
                  {wsConnected ? 'EN VIVO' : 'CONECTANDO'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Parrilla, Freidora y Despacho Takeaway</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/turnero')}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition"
            >
              📺 Ver Turnero TV
            </button>
            <button
              onClick={() => router.push('/order-taker')}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition"
            >
              🧾 Mostrador POS
            </button>
            <button
              onClick={loadKitchenData}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition text-xs"
              title="Refrescar comanda"
            >
              🔄
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/40 text-xs font-bold transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Feedback */}
      {feedback && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* ================= CONTENIDO KDS: 3 COLUMNAS ================= */}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
        {/* ================= COLUMNA 1: COMANDAS EN ESPERA ================= */}
        <section className="bg-[#1C1C20] rounded-[24px] p-4 border border-zinc-800 flex flex-col min-h-[580px] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h2 className="font-black text-sm text-amber-400 tracking-wider uppercase">En Cola (Nuevas)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
              {queueOrders.length}
            </span>
          </div>

          <div className="space-y-3 pt-3 flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-16 text-zinc-500 text-xs">Cargando cola...</div>
            ) : queueOrders.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs font-medium">
                Sin pedidos nuevos por preparar
              </div>
            ) : (
              queueOrders.map((order) => {
                const timeInfo = getElapsedTimeInfo(order.created_at ? order.created_at.toString() : null);
                return (
                  <div
                    key={order.id}
                    className={`bg-white text-zinc-900 rounded-2xl p-4 shadow-lg space-y-3 border-2 ${
                      timeInfo.isLate ? 'border-red-500 bg-red-50/20' : 'border-zinc-200'
                    }`}
                  >
                    <div className="flex items-start justify-between border-b border-zinc-100 pb-2">
                      <div>
                        <span className="text-3xl font-black text-zinc-900 block leading-none">
                          {formatTurnTag(order)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1 block">
                          Takeaway • {timeInfo.text}
                        </span>
                        {order.customers?.phone && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            📱 {order.customers.phone} {order.customers.first_name ? `(${order.customers.first_name})` : ''}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        timeInfo.isLate ? 'bg-red-500 text-white' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        EN COLA
                      </span>
                    </div>

                    {/* Platos de la Comanda */}
                    <ul className="text-xs space-y-2 py-1">
                      {order.order_lines?.map((line) => (
                        <li key={line.id} className="border-b border-zinc-100 pb-1.5 last:border-none">
                          <div className="flex justify-between items-baseline font-bold text-zinc-900">
                            <span>
                              <strong className="text-[#FF5A00] font-black text-sm mr-1">{line.quantity}x</strong>
                              {line.menu_items?.name}
                            </span>
                            <button
                              onClick={() => line.menu_item_id && handleViewRecipe(line.menu_item_id)}
                              className="text-[10px] text-zinc-400 hover:text-zinc-700"
                              title="Ver ingredientes"
                            >
                              📖 Receta
                            </button>
                          </div>
                          {line.notes && (
                            <div className="mt-1 text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                              ⚠️ {line.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleTakeOrder(order.id)}
                      className="w-full py-2.5 rounded-full bg-[#1E1E22] hover:bg-black text-white font-black text-xs shadow-md transition active:scale-95"
                    >
                      ▶ Tomar en Parrilla
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ================= COLUMNA 2: MIS COMANDAS EN PREPARACIÓN ================= */}
        <section className="bg-[#1C1C20] rounded-[24px] p-4 border-2 border-[#FF5A00] flex flex-col min-h-[580px] shadow-2xl shadow-[#FF5A00]/10">
          <div className="flex items-center justify-between pb-3 border-b border-[#FF5A00]/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A00] animate-pulse" />
              <h2 className="font-black text-sm text-[#FF5A00] tracking-wider uppercase">En Parrilla / Cocinando</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#FF5A00] text-white font-black text-xs">
              {myOrders.length}
            </span>
          </div>

          <div className="space-y-3 pt-3 flex-1 overflow-y-auto">
            {myOrders.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs font-medium">
                No tenés comandas asignadas en preparación
              </div>
            ) : (
              myOrders.map((order) => {
                const timeInfo = getElapsedTimeInfo(order.started_at ? order.started_at.toString() : order.assigned_at ? order.assigned_at.toString() : null);
                return (
                  <div
                    key={order.id}
                    className="bg-white text-zinc-900 rounded-2xl p-4 shadow-2xl space-y-3 border-4 border-[#FF5A00]"
                  >
                    <div className="flex items-start justify-between border-b border-zinc-100 pb-2">
                      <div>
                        <span className="text-4xl font-black text-[#FF5A00] block leading-none">
                          {formatTurnTag(order)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1 block">
                          Cocinando • {timeInfo.text}
                        </span>
                        {order.customers?.phone && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            📱 {order.customers.phone} {order.customers.first_name ? `(${order.customers.first_name})` : ''}
                          </span>
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF5A00] text-white text-[10px] font-black uppercase">
                        PREPARANDO
                      </span>
                    </div>

                    {/* Platos */}
                    <ul className="text-xs space-y-2 py-1">
                      {order.order_lines?.map((line) => (
                        <li key={line.id} className="border-b border-zinc-100 pb-1.5 last:border-none">
                          <div className="flex justify-between items-baseline font-bold text-zinc-900">
                            <span className="text-sm">
                              <strong className="text-[#FF5A00] font-black text-base mr-1.5">{line.quantity}x</strong>
                              {line.menu_items?.name}
                            </span>
                            <button
                              onClick={() => line.menu_item_id && handleViewRecipe(line.menu_item_id)}
                              className="text-[10px] text-zinc-400 hover:text-zinc-700"
                            >
                              📖
                            </button>
                          </div>
                          {line.notes && (
                            <div className="mt-1 text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                              ⚠️ {line.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* BOTÓN GIGANTE LISTO PARA RETIRAR (DISPARA CHIME Y TURNERO) */}
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="w-full py-3.5 rounded-full bg-[#FF5A00] hover:bg-[#e05000] text-white font-black text-xs shadow-lg shadow-[#FF5A00]/30 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>🔔 ¡Listo para Retirar!</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ================= COLUMNA 3: RECIÉN COMPLETADAS (LISTAS) ================= */}
        <section className="bg-[#1C1C20] rounded-[24px] p-4 border border-zinc-800 flex flex-col min-h-[580px] shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="font-black text-sm text-emerald-400 tracking-wider uppercase">Listas en Mostrador</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 pt-3 flex-1 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs font-medium">
                No hay pedidos en espera de retiro
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white text-zinc-900 rounded-2xl p-4 shadow-md space-y-2 opacity-90 border border-emerald-500/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-emerald-600">
                      {formatTurnTag(order)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      ✓ EN MOSTRADOR
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600 font-medium">
                    {order.order_lines?.map((l) => `${l.quantity}x ${l.menu_items?.name}`).join(', ')}
                  </div>
                  {order.customers?.phone && (
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 mt-2">
                      <span className="flex items-center gap-1">
                        <span>📱 WhatsApp Notificado</span>
                      </span>
                      <span className="text-xs text-emerald-800 font-mono">{order.customers.phone}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* ================= MODAL DE RECETA / INGREDIENTES ================= */}
      {recipeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-black text-base text-white">Receta e Ingredientes</h3>
              <button
                onClick={() => setRecipeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {loadingRecipe ? (
              <div className="py-8 text-center text-xs text-zinc-400">Cargando receta...</div>
            ) : currentRecipe ? (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#FF5A00]">{currentRecipe.dishName}</h4>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Ingredientes a descontar:</span>
                  <ul className="text-xs space-y-1 text-zinc-200">
                    {currentRecipe.ingredients?.map((ing, i) => (
                      <li key={i} className="flex justify-between border-b border-zinc-800 py-1">
                        <span>{ing.name}</span>
                        <span className="font-bold text-[#FF5A00]">{ing.quantity} {ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">Sin receta registrada para este plato</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
