'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, Order } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

export default function TurneroTV() {
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Reloj digital en vivo
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sintetizador de sonido Ding-Dong (Web Audio API puro)
  const playChime = useCallback(() => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Nota 1 (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Nota 2 (A5 - Ding Dong más agudo)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.8);
    } catch {
      // Ignorar restricciones de audio del navegador
    }
  }, [audioEnabled]);

  // Cargar pedidos activos
  const loadOrders = useCallback(async () => {
    try {
      const orders = await api.getOrders();
      
      const inProg = orders.filter(
        (o) => o.status === 'pending' || o.status === 'assigned' || o.status === 'in_progress'
      );
      const ready = orders.filter((o) => o.status === 'ready_to_deliver');

      setInProgressOrders(inProg);
      setReadyOrders(ready);
    } catch (err) {
      console.warn('Error cargando turnero:', err);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Polling de respaldo cada 10s

    // Conexión WebSocket para tiempo real
    const socket = wsClient.connect();
    if (socket) {
      setWsConnected(socket.connected);

      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));

      socket.on('order:created', () => {
        loadOrders();
      });

      socket.on('order:status_changed', (payload: { order: Order; status: string }) => {
        if (payload.status === 'ready' || payload.status === 'ready_to_deliver') {
          playChime();
        }
        loadOrders();
      });
    }

    return () => {
      clearInterval(interval);
    };
  }, [loadOrders, playChime]);

  // Extraer número de turno amigable (#14 o últimos dígitos)
  const formatOrderTag = (order: Order) => {
    if (order.table_number) {
      const match = order.table_number.match(/#?(\d+)/);
      if (match) return `#${match[1]}`;
      return order.table_number;
    }
    return `#${order.id % 100 || order.id}`;
  };

  return (
    <div className="min-h-screen bg-[#141417] text-white p-4 md:p-8 flex flex-col justify-between select-none">
      
      {/* ================= HEADER TV ================= */}
      <header className="flex items-center justify-between pb-6 border-b border-zinc-800">
        {/* Logo Nano Lomos Oficial */}
        <div className="flex items-center gap-4">
          <div className="bg-black border-2 border-[#FF5A00] rounded-2xl px-5 py-2.5 shadow-xl shadow-[#FF5A00]/20 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 font-black text-2xl tracking-widest text-white leading-none">
              <span>N</span>
              <span className="relative inline-block">
                <span>A</span>
                <span className="absolute top-[3px] left-[6px] text-xs text-[#FF5A00]">▲</span>
              </span>
              <span>N</span>
              <span className="inline-block px-1.5 bg-[#FF5A00] text-black rounded text-lg font-black">O</span>
            </div>
            <div className="flex items-center gap-2 w-full justify-center mt-1">
              <span className="h-[1px] w-4 bg-[#FF5A00]" />
              <span className="text-[10px] font-bold text-[#FF5A00] tracking-[0.25em] uppercase">LOMOS</span>
              <span className="h-[1px] w-4 bg-[#FF5A00]" />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-[#FF5A00] uppercase tracking-wider block">Llamador de Comandas</span>
            <h1 className="text-3xl font-black text-white">Nano Lomos Takeaway</h1>
          </div>
        </div>

        {/* Reloj e Indicador WebSocket */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              playChime();
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 ${
              audioEnabled ? 'bg-[#FF5A00] text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <span>{audioEnabled ? '🔔 Audio Activado' : '🔕 Audio Silenciado'}</span>
          </button>

          <div className="text-right">
            <div className="text-3xl font-mono font-black text-white tracking-wider">{currentTime || '--:--:--'}</div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-400 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{wsConnected ? 'En línea' : 'Reconectando...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ================= CUERPO: 2 COLUMNAS GIGANTES ================= */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto py-8">
        
        {/* COLUMNA 1: EN PREPARACIÓN */}
        <section className="bg-[#1C1C20] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
                <h2 className="text-2xl font-black text-amber-400 tracking-wide">EN PREPARACIÓN</h2>
              </div>
              <span className="text-sm font-semibold text-zinc-400">
                {inProgressOrders.length} {inProgressOrders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
              {inProgressOrders.length === 0 ? (
                <div className="col-span-full text-center py-16 text-zinc-500 font-medium text-lg">
                  No hay pedidos pendientes en parrilla
                </div>
              ) : (
                inProgressOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white text-zinc-900 rounded-2xl p-5 text-center shadow-lg transform transition hover:scale-105"
                  >
                    <div className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight">
                      {formatOrderTag(order)}
                    </div>
                    <div className="text-xs font-bold text-zinc-500 mt-2 truncate">
                      {order.customers ? order.customers.first_name : 'Takeaway'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-zinc-800 text-xs text-zinc-500 font-medium">
            Parrilla y cocina preparando tu comida • Tiempo estimado: 10 a 15 min
          </div>
        </section>

        {/* COLUMNA 2: ¡LISTO PARA RETIRAR! (NARANJA / CORAL NANO LOMOS) */}
        <section className="bg-[#1C1C20] border-2 border-[#FF5A00] rounded-3xl p-6 shadow-2xl shadow-[#FF5A00]/10 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#FF5A00]/40">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF5A00] animate-pulse" />
                <h2 className="text-2xl font-black text-[#FF5A00] tracking-wide">¡LISTO PARA RETIRAR!</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FF5A00] text-white text-xs font-black uppercase">
                Pasar por Mostrador
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
              {readyOrders.length === 0 ? (
                <div className="col-span-full text-center py-16 text-zinc-500 font-medium text-lg">
                  Aguardando pedidos listos desde cocina
                </div>
              ) : (
                readyOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className={`bg-white text-zinc-900 rounded-2xl p-5 text-center shadow-2xl border-4 border-[#FF5A00] ${
                      index === 0 ? 'animate-bounce' : ''
                    }`}
                  >
                    <div className="text-5xl sm:text-6xl font-black text-[#FF5A00] tracking-tight">
                      {formatOrderTag(order)}
                    </div>
                    <div className="text-xs font-black text-zinc-900 mt-2 truncate">
                      {order.customers ? `${order.customers.first_name} ${order.customers.last_name || ''}` : 'Mostrador'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-zinc-800 text-xs text-emerald-400 font-bold">
            Presentá tu número en el mostrador para retirar tu pedido caliente
          </div>
        </section>

      </main>

      {/* ================= FOOTER TV ================= */}
      <footer className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
        <div>Nano Lomos • Sabor que se comparte • Pedidos: 3804 66-1748</div>
        <div className="text-zinc-500">Instagram: @nanolomos • La Rioja, Argentina</div>
      </footer>

    </div>
  );
}
