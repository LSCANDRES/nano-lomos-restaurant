'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, MenuItem, Order, User } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export default function OrderTakerPOS() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user] = useState<User | null>(() => api.getUser());
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Sándwich');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Modal de Carta Completa Original
  const [menuModalOpen, setMenuModalOpen] = useState<boolean>(false);

  // Datos del Cliente y Turno
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderMode, setOrderMode] = useState<'mostrador' | 'takeaway' | 'delivery'>('takeaway');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  // Turno diario correlativo
  const [turnCounter, setTurnCounter] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nano_turn_counter');
      return saved ? parseInt(saved, 10) : 14;
    }
    return 14;
  });

  // Cálculo de vuelto rápido
  const [cashTendered, setCashTendered] = useState<number | null>(null);

  // Redirigir si no hay sesión
  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      startTransition(() => router.replace('/login'));
    }
  }, [router]);

  // Cargar Menú Oficial desde el backend
  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const items = await api.getMenu();
      setMenuItems(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar carta de Nano Lomos';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Totales
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.menuItem.price) * item.quantity, 0);
  }, [cart]);

  const total = subtotal;

  // Manejo de Carrito
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.menuItem.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
    setCashTendered(null);
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
    setCashTendered(null);
  };

  const setItemNotes = (itemId: number, note: string) => {
    setCart((prev) =>
      prev.map((ci) => (ci.menuItem.id === itemId ? { ...ci, notes: note } : ci))
    );
  };

  // Sonido de confirmación
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);
    } catch {}
  };

  // Enviar Pedido a Cocina
  const handleCheckout = async (paymentMethod: 'efectivo' | 'qr' | 'tarjeta') => {
    if (cart.length === 0) {
      setFeedback({ text: 'Agregá al menos un lomito o producto al pedido', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const nextTurn = turnCounter + 1;
      const turnTag = `#${nextTurn.toString().padStart(2, '0')}`;

      await api.createOrder({
        customerName: customerName.trim() || 'Cliente Mostrador',
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: orderMode === 'delivery' ? deliveryAddress.trim() : undefined,
        orderType: orderMode,
        tableNumber: turnTag,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentNotes: cashTendered ? `Recibido: $${cashTendered} - Vuelto: $${cashTendered - total}` : undefined,
        items: cart.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
          notes: ci.notes || undefined,
        })),
      });

      playChime();
      setTurnCounter(nextTurn);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nano_turn_counter', nextTurn.toString());
      }

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setCashTendered(null);
      setFeedback({
        text: `✓ Pedido ${turnTag} cobrado con éxito. Enviado a Cocina y Turnero TV.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar pedido';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de Menú
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === 'Todos' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Asignar imagen adecuada según el producto
  const getProductImage = (item: MenuItem) => {
    if (item.image_url) return item.image_url;
    const name = item.name.toLowerCase();
    if (name.includes('barroluco')) return '/images/menu/barroluco.jpg';
    if (name.includes('hamburguesa') || name.includes('burguer')) return '/images/menu/hamburguesa-especial.jpg';
    return '/images/menu/lomo-completo.jpg';
  };

  return (
    <div className="min-h-screen bg-[#121214] text-zinc-100 p-3 sm:p-5 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ================= BARRA SUPERIOR CON LOGO OFICIAL ================= */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-zinc-800 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* LOGO OFICIAL NANO LOMOS (DISEÑO AL ESTILO DEL SISTEMA) */}
            <div className="bg-black border-2 border-[#FF5A00] rounded-2xl px-4 py-2 shadow-lg shadow-[#FF5A00]/20 flex flex-col items-center justify-center shrink-0">
              <div className="flex items-center gap-1.5 font-black text-xl tracking-widest text-white leading-none">
                <span>N</span>
                <span className="relative inline-block">
                  <span>A</span>
                  <span className="absolute top-[2px] left-[5px] text-[10px] text-[#FF5A00] leading-none">▲</span>
                </span>
                <span>N</span>
                <span className="inline-block px-1 bg-[#FF5A00] text-black rounded text-base font-black leading-tight">O</span>
              </div>
              <div className="flex items-center gap-1.5 w-full justify-center mt-1">
                <span className="h-[1px] w-3 bg-[#FF5A00]" />
                <span className="text-[8px] font-bold text-[#FF5A00] tracking-[0.25em] uppercase">LOMOS</span>
                <span className="h-[1px] w-3 bg-[#FF5A00]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FF5A00]/20 text-[#FF5A00] border border-[#FF5A00]/30">
                  POS Mostrador • Takeaway
                </span>
                <span className="text-xs text-zinc-400">Operador: <strong className="text-zinc-200">{user?.fullName || 'Caja'}</strong></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Punto de Venta Nano Lomos</h1>
            </div>
          </div>

          {/* Acciones Rápidas (Ver Carta, Turnero TV, Cocina) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMenuModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            >
              📋 Ver Carta Completa
            </button>
            <button
              onClick={() => router.push('/turnero')}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            >
              📺 Pantalla Turnero
            </button>
            <button
              onClick={() => router.push('/cook')}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            >
              🍳 Cocina (KDS)
            </button>
          </div>
        </header>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-950/80 text-red-300 border border-red-500/40'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ================= CUERPO PRINCIPAL: SPLIT 2 PANELES ================= */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ================= PANEL IZQUIERDO: YOUR CART (BLANCO PURO) ================= */}
          <section className="lg:col-span-4 bg-white text-zinc-900 rounded-[28px] p-5 shadow-2xl space-y-4 border border-zinc-100 flex flex-col justify-between min-h-[660px]">
            <div>
              {/* Encabezado de Comanda */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Comanda Actual</span>
                  <h2 className="text-xl font-black tracking-tight text-zinc-900">Tu Pedido</h2>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-[#FF5A00]/10 text-[#FF5A00] border border-[#FF5A00]/20 rounded-full font-black text-xs block">
                    Turno #{turnCounter + 1}
                  </span>
                </div>
              </div>

              {/* Selector de Modalidad (Takeaway / Mostrador / Delivery) */}
              <div className="grid grid-cols-3 gap-1 pt-2 pb-1 text-[11px] font-bold text-center">
                <button
                  onClick={() => setOrderMode('takeaway')}
                  className={`py-1.5 rounded-lg transition ${
                    orderMode === 'takeaway'
                      ? 'bg-[#FF5A00] text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  🥡 Retiro
                </button>
                <button
                  onClick={() => setOrderMode('mostrador')}
                  className={`py-1.5 rounded-lg transition ${
                    orderMode === 'mostrador'
                      ? 'bg-[#FF5A00] text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  🍽️ Mostrador
                </button>
                <button
                  onClick={() => setOrderMode('delivery')}
                  className={`py-1.5 rounded-lg transition ${
                    orderMode === 'delivery'
                      ? 'bg-[#FF5A00] text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  🛵 Moto
                </button>
              </div>

              {/* Datos Opcionales de Cliente */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <input
                  type="text"
                  placeholder="Nombre cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
                />
                <input
                  type="tel"
                  placeholder="Tel. WhatsApp"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
                />
              </div>

              {orderMode === 'delivery' && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Dirección de envío (Calle, N°, Barrio)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5A00]"
                  />
                </div>
              )}

              {/* Lista de Ítems en Carrito (Tarjetas Carbón Oscuras) */}
              <div className="py-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-xs font-medium">
                    Tocá (+) en un lomito de la derecha para sumar a la comanda
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="bg-[#1E1E22] text-white p-3 rounded-2xl shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FF5A00]/50 shrink-0 bg-zinc-900">
                            <img
                              src={getProductImage(item.menuItem)}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs leading-snug">{item.menuItem.name}</h4>
                            <span className="text-[11px] text-[#FF5A00] font-black">
                              ${(Number(item.menuItem.price) * item.quantity).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>

                        {/* Selector de Cantidad Pill */}
                        <div className="flex items-center gap-2 bg-[#2D2D33] px-2 py-1 rounded-full text-xs font-bold">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                            className="w-5 h-5 rounded-full hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                          >
                            -
                          </button>
                          <span className="qty-num">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                            className="w-5 h-5 rounded-full hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Notas Rápidas / Modificadores */}
                      <div className="flex gap-1.5 flex-wrap text-[10px]">
                        <button
                          onClick={() =>
                            setItemNotes(
                              item.menuItem.id,
                              item.notes.includes('SIN CEBOLLA')
                                ? item.notes.replace('SIN CEBOLLA', '').trim()
                                : `${item.notes} SIN CEBOLLA`.trim()
                            )
                          }
                          className={`px-2 py-0.5 rounded transition ${
                            item.notes.includes('SIN CEBOLLA')
                              ? 'bg-red-500/30 text-red-300 border border-red-500'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          ✕ Sin Cebolla
                        </button>
                        <button
                          onClick={() =>
                            setItemNotes(
                              item.menuItem.id,
                              item.notes.includes('SIN TOMATE')
                                ? item.notes.replace('SIN TOMATE', '').trim()
                                : `${item.notes} SIN TOMATE`.trim()
                            )
                          }
                          className={`px-2 py-0.5 rounded transition ${
                            item.notes.includes('SIN TOMATE')
                              ? 'bg-red-500/30 text-red-300 border border-red-500'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          ✕ Sin Tomate
                        </button>
                        <button
                          onClick={() =>
                            setItemNotes(
                              item.menuItem.id,
                              item.notes.includes('HUEVO COCIDO')
                                ? item.notes.replace('HUEVO COCIDO', '').trim()
                                : `${item.notes} HUEVO COCIDO`.trim()
                            )
                          }
                          className={`px-2 py-0.5 rounded transition ${
                            item.notes.includes('HUEVO COCIDO')
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          🍳 Huevo Cocido
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totales, Vuelto y Botonera de Cobro */}
            <div className="pt-3 border-t border-zinc-100 space-y-3">
              <div className="space-y-1 text-xs text-zinc-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-zinc-800">${subtotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-zinc-900 pt-1 border-t border-zinc-100">
                  <span>Total a Cobrar</span>
                  <span className="text-[#FF5A00]">${total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Botonera de Billetes para Vuelto en Efectivo */}
              {total > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Cálculo de Vuelto (Efectivo)
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-zinc-700">
                    {[subtotal + 1000, Math.ceil(subtotal / 5000) * 5000, Math.ceil(subtotal / 10000) * 10000].map(
                      (amount, i) => (
                        <button
                          key={i}
                          onClick={() => setCashTendered(amount)}
                          className={`p-1.5 rounded-lg border text-center transition ${
                            cashTendered === amount
                              ? 'border-[#FF5A00] bg-[#FF5A00]/10 text-[#FF5A00] font-bold'
                              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                        >
                          ${amount.toLocaleString('es-AR')}
                          <br />
                          <span className="text-[10px] text-emerald-600 font-bold">
                            Vuelto ${(amount - total).toLocaleString('es-AR')}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Acciones de Cobro */}
              <div className="space-y-2 pt-1">
                <button
                  disabled={submitting || cart.length === 0}
                  onClick={() => handleCheckout('efectivo')}
                  className="w-full py-4 rounded-full font-black text-sm text-white bg-[#FF5A00] hover:bg-[#e05000] shadow-lg shadow-[#FF5A00]/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{submitting ? 'Enviando comanda...' : '✓ Cobrar Efectivo y Enviar a Cocina'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={submitting || cart.length === 0}
                    onClick={() => handleCheckout('qr')}
                    className="py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 text-xs font-bold text-zinc-700 transition"
                  >
                    📱 Cobro QR / MP
                  </button>
                  <button
                    disabled={submitting || cart.length === 0}
                    onClick={() => handleCheckout('tarjeta')}
                    className="py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 text-xs font-bold text-zinc-700 transition"
                  >
                    💳 Débito / Tarjeta
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================= PANEL DERECHO: MENÚ POS (CARBÓN GRAFITO #1B1B1E) ================= */}
          <section className="lg:col-span-8 bg-[#1B1B1E] rounded-[28px] p-4 sm:p-6 shadow-2xl border border-zinc-800 space-y-6">

            {/* Buscador Superior */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Buscar lomito, barroluco, hamburguesa o pizza..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 text-xs rounded-full bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A00] shadow-sm font-medium"
                />
                <svg
                  className="w-4 h-4 text-[#FF5A00] absolute left-3.5 top-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <span className="text-xs text-zinc-400 font-bold hidden sm:inline">
                {filteredMenu.length} variedades activas
              </span>
            </div>

            {/* Categorías en Burbujas Circulares (Carta Oficial) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Secciones de la Carta</span>
                <span className="text-[11px] text-[#FF5A00] font-semibold">Tocar para filtrar</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {[
                  { key: 'Sándwich', icon: '🥩', label: 'Sándwich' },
                  { key: 'Hamburguesas', icon: '🍔', label: 'Burgers' },
                  { key: 'Pizzas', icon: '🍕', label: 'Pizzas' },
                  { key: 'Especiales', icon: '👑', label: 'Especiales' },
                  { key: 'Todos', icon: '📋', label: 'Todos' },
                ].map((cat) => {
                  const isActive = selectedCategory.toLowerCase() === cat.key.toLowerCase();
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition transform group-hover:scale-105 ${
                          isActive
                            ? 'bg-[#FF5A00] ring-4 ring-[#FF5A00]/20 shadow-lg shadow-[#FF5A00]/30'
                            : 'bg-[#27272D] border border-zinc-700/60 group-hover:border-zinc-500'
                        }`}
                      >
                        {cat.icon}
                      </div>
                      <span className={`text-[11px] ${isActive ? 'font-black text-white' : 'font-semibold text-zinc-400 group-hover:text-white'}`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grilla de Productos con Fotos Reales Flotantes en 3D */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Platos de Nano Lomos</span>
                <span className="text-[11px] text-[#FF5A00] font-semibold">Precios vigentes</span>
              </div>

              {loading ? (
                <div className="text-center py-20 text-zinc-400">Cargando menú de Nano Lomos...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pt-8">
                  {filteredMenu.map((item) => {
                    const isBarroluco = item.name.toLowerCase().includes('barroluco');
                    return (
                      <div
                        key={item.id}
                        className={`product-card bg-white text-zinc-900 rounded-[24px] p-4 pt-0 shadow-lg relative flex flex-col justify-between transition hover:shadow-2xl ${
                          isBarroluco ? 'border-2 border-amber-400/50' : ''
                        }`}
                      >
                        {/* Foto Flotante Circular 3D */}
                        <div className="flex justify-center">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl -translate-y-6 shrink-0 bg-zinc-100">
                            <img
                              src={getProductImage(item)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Info del Plato */}
                        <div className="-mt-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-sm text-zinc-900">{item.name}</h4>
                            {isBarroluco && (
                              <span className="text-[10px] font-black text-[#FF5A00] bg-orange-50 px-1.5 py-0.5 rounded">
                                ★ Especial
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                            {item.description || 'Elaborado con ingredientes frescos de la más alta calidad.'}
                          </p>
                        </div>

                        {/* Footer con Precio y Botón (+) */}
                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-3">
                          <div>
                            <span className="text-sm font-black text-[#FF5A00]">
                              ${Number(item.price).toLocaleString('es-AR')}
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-9 h-9 rounded-full border-2 border-[#FF5A00] text-[#FF5A00] hover:bg-[#FF5A00] hover:text-white font-black text-xl flex items-center justify-center transition active:scale-95 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>

        </main>

        {/* ================= MODAL DE LA CARTA OFICIAL COMPLETA ================= */}
        {menuModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">Carta Oficial • Nano Lomos</span>
                  <span className="text-xs text-[#FF5A00] font-semibold">Precios Vigentes</span>
                </div>
                <button
                  onClick={() => setMenuModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex items-center justify-center bg-black">
                <img
                  src="/images/menu/carta-nanolomos.jpg"
                  alt="Carta Completa Nano Lomos"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                />
              </div>
              <div className="p-3 border-t border-zinc-800 bg-zinc-900 text-center text-xs text-zinc-400">
                WhatsApp: 3804 66-1748 • Instagram: @nanolomos • Sabor que se comparte
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
