'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api, Table, MenuItem, User, Order } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

interface SelectedItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export default function WaiterDashboard() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user] = useState<User | null>(() => api.getUser());
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState<boolean>(() => !!wsClient.getSocket()?.connected);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [activeMode, setActiveMode] = useState<'mostrador' | 'mesas'>('mostrador');

  // Datos del nuevo pedido
  const [orderType, setOrderType] = useState<'mostrador' | 'takeaway' | 'delivery' | 'salon'>('mostrador');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [payImmediately, setPayImmediately] = useState(false);
  const [prepayMethod, setPrepayMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [prepayNotes, setPrepayNotes] = useState('');

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Redirigir según rol
  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      startTransition(() => router.replace('/login'));
      return;
    }
    if (currentUser.role === 'order_taker') {
      startTransition(() => router.replace('/order-taker'));
      return;
    }
    if (currentUser.role === 'cook') {
      startTransition(() => router.replace('/cook'));
    }
  }, [router]);

  // Cargar mesas, menú y órdenes activas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedTables, fetchedMenu, fetchedOrders] = await Promise.all([
        api.getTables().catch(() => []),
        api.getMenu().catch(() => []),
        api.getOrders().catch(() => []),
      ]);
      setTables(fetchedTables);
      setMenuItems(fetchedMenu);
      setActiveOrders(fetchedOrders);

      const uniqueCats = Array.from(new Set(fetchedMenu.map((m) => m.category || 'General')));
      setCategories(['Todos', ...uniqueCats]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos';
      setFeedbackMessage(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [fetchedTables, fetchedMenu, fetchedOrders] = await Promise.all([
          api.getTables().catch(() => []),
          api.getMenu().catch(() => []),
          api.getOrders().catch(() => []),
        ]);
        if (!active) return;
        setTables(fetchedTables);
        setMenuItems(fetchedMenu);
        setActiveOrders(fetchedOrders);
        const uniqueCats = Array.from(new Set(fetchedMenu.map((m) => m.category || 'General')));
        setCategories(['Todos', ...uniqueCats]);
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Error al cargar datos';
        setFeedbackMessage(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Suscripción WebSocket en vivo para mozos / mostrador
    const socket = wsClient.connect();
    if (socket) {
      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));
    }

    const unsubTable = wsClient.on('table:updated', () => {
      loadData();
    });

    const unsubOrderStatus = wsClient.on('order:status_changed', () => {
      loadData();
    });

    const unsubOrderCreated = wsClient.on('order:created', () => {
      loadData();
    });

    return () => {
      active = false;
      unsubTable();
      unsubOrderStatus();
      unsubOrderCreated();
    };
  }, [loadData]);

  const handleLogout = async () => {
    await api.logout();
    startTransition(() => router.replace('/login'));
  };

  const openOrderModal = (table: Table) => {
    setSelectedTable(table);
    setOrderType('salon');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setPayImmediately(false);
    setSelectedItems([]);
    setOrderNotes('');
    setOrderModalOpen(true);
  };

  const openCounterOrderModal = (type: 'mostrador' | 'takeaway' | 'delivery' = 'mostrador') => {
    setSelectedTable(null);
    setOrderType(type);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setPayImmediately(false);
    setSelectedItems([]);
    setOrderNotes('');
    setOrderModalOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) return;
    try {
      setSubmitting(true);
      const isSalon = !!selectedTable;
      const order = await api.createOrder({
        tableId: selectedTable ? selectedTable.id : undefined,
        tableNumber: selectedTable ? selectedTable.number : undefined,
        orderType: orderType,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        paymentMethod: payImmediately ? prepayMethod : undefined,
        paymentNotes: payImmediately ? prepayNotes : undefined,
        items: selectedItems.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      });

      const label = isSalon
        ? selectedTable?.name
        : `${orderType.toUpperCase()} #${order.id} (${customerName || 'Cliente'})`;

      setFeedbackMessage(
        `¡Comanda enviada a Cocina con éxito para ${label}!${payImmediately ? ` (Cobrado vía ${prepayMethod.toUpperCase()})` : ''}`
      );
      setOrderModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar pedido';
      setFeedbackMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Estados para modal de cobro y arqueo
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderToPay, setSelectedOrderToPay] = useState<{ id: number; tableName: string; totalAmount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [payingOrder, setPayingOrder] = useState(false);

  const handleOpenPaymentModal = (orderId: number, tableName: string, totalAmount: number) => {
    setSelectedOrderToPay({ id: orderId, tableName, totalAmount });
    setPaymentMethod('efectivo');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderToPay) return;
    try {
      setPayingOrder(true);
      await api.payOrder(selectedOrderToPay.id, paymentMethod, paymentNotes || undefined);
      setFeedbackMessage(
        `¡Mesa ${selectedOrderToPay.tableName} cobrada ($${selectedOrderToPay.totalAmount.toFixed(2)}) vía ${paymentMethod.toUpperCase()} y liberada con éxito! Stock de ingredientes descontado.`
      );
      setPaymentModalOpen(false);
      setSelectedOrderToPay(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cobrar comanda';
      setFeedbackMessage(msg);
    } finally {
      setPayingOrder(false);
    }
  };

  const handleDeliverOrder = async (orderId: number) => {
    try {
      await api.deliverOrder(orderId);
      setFeedbackMessage('Comanda marcada como entregada / retirada.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al entregar comanda';
      setFeedbackMessage(msg);
    }
  };

  const handleNotifyWhatsApp = (order: Order) => {
    const phone = order.customers?.phone?.replace(/[^0-9]/g, '');
    const clientName = order.customers?.first_name || 'Cliente';
    const tag = order.table_number || `Comanda #${order.id}`;
    const total = order.total_amount ? `$${order.total_amount.toFixed(2)}` : '';

    let text = `¡Hola ${clientName}! 👋 Te escribimos de *Nano Lomos*.\n\n`;
    if (order.status === 'ready_to_deliver') {
      text += `Tu pedido *${tag}* ya está listo para retirar / en camino 🍔🍟.\n`;
    } else {
      text += `Hemos recibido tu pedido *${tag}* y ya está en preparación en cocina 👨‍🍳🔥.\n`;
    }
    if (total) text += `Total: *${total}*\n`;
    text += `\n¡Muchas gracias por elegirnos!`;

    const encoded = encodeURIComponent(text);
    const targetUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(targetUrl, '_blank');
  };

  const addItemToOrder = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const updateItemQuantity = (itemId: number, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.menuItem.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as SelectedItem[]
    );
  };

  const updateItemNotes = (itemId: number, notes: string) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.menuItem.id === itemId ? { ...i, notes } : i))
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getStatusBadge = (status: Table['status']) => {
    switch (status) {
      case 'libre':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Libre</span>;
      case 'pendiente':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Esperando</span>;
      case 'cocinando':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Cocinando</span>;
      case 'para_entregar':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Listo</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
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
                <h1 className="text-base font-black tracking-wider text-slate-900 uppercase">Nano Lomos • Salón</h1>
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
              <p className="text-xs text-slate-500">Terminal de Mozo / Toma de Pedidos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900">{user?.fullName || user?.username}</p>
              <p className="text-[11px] text-slate-500 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all text-xs cursor-pointer"
              title="Refrescar"
            >
              🔄
            </button>
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <button
                onClick={() => router.push('/order-taker')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>🛍️</span> Mostrador
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {feedbackMessage && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm flex justify-between items-center shadow-xs">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-xs underline cursor-pointer">Cerrar</button>
          </div>
        )}

        {/* Barra de Acciones Rápidas para Mostrador / Takeaway / Delivery */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>⚡ Terminal de Venta Rápida</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                POS
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Genera comandas sin mesa física para retiro en el local, mostrador o envío a domicilio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => openCounterOrderModal('mostrador')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>⚡ + Pedido Mostrador</span>
            </button>
            <button
              onClick={() => openCounterOrderModal('takeaway')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>🛍️ + Takeaway / Retiro</span>
            </button>
            <button
              onClick={() => openCounterOrderModal('delivery')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>🛵 + Delivery</span>
            </button>
          </div>
        </section>

        {/* Selector de Modo de Visualización (Mostrador vs Mesas) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode('mostrador')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'mostrador'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>📋 Comandas Activas de Mostrador / Envío</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                activeMode === 'mostrador' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {activeOrders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled' && !o.table_id).length}
              </span>
            </button>

            <button
              onClick={() => setActiveMode('mesas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'mesas'
                  ? 'bg-[#1e3a2f] text-emerald-50 shadow-xs'
                  : 'bg-white text-stone-600 border border-[#e8e3d9] hover:bg-[#faf8f5]'
              }`}
            >
              <span>🍽️ Salón de Mesas</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                activeMode === 'mesas' ? 'bg-[#162d24] text-emerald-200' : 'bg-[#f4f0e8] text-stone-700'
              }`}>
                {tables.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:block">
            {activeMode === 'mostrador' ? 'Mostrando pedidos para entrega rápida' : 'Gestión de mesas físicas de salón'}
          </span>
        </div>

        {/* ================= VISTA DE TICKETS DE MOSTRADOR / RETIRO ================= */}
        {activeMode === 'mostrador' && (
          <section className="space-y-4">
            {activeOrders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled' && !o.table_id).length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-xs">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-sm font-semibold text-slate-700">No hay pedidos pendientes en mostrador ni delivery</p>
                <p className="text-xs text-slate-500 mt-1">
                  Usa los botones de arriba para registrar una nueva comanda rápida.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders
                  .filter((o) => o.status !== 'paid' && o.status !== 'cancelled' && !o.table_id)
                  .map((order) => {
                    const isReady = order.status === 'ready_to_deliver';
                    const isDelivered = order.status === 'delivered';
                    const clientPhone = order.customers?.phone;
                    const isDelivery = order.table_number?.includes('DELIVERY');

                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white shadow-xs ${
                          isReady ? 'border-slate-400 ring-2 ring-slate-400/20' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-base font-extrabold text-slate-900 block">
                                {order.table_number || `Ticket #${order.id}`}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {order.customers ? `${order.customers.first_name} ${order.customers.last_name}` : 'Cliente'}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                isReady
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDelivered
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {isReady ? 'Listo p/ Entregar' : isDelivered ? 'Entregado' : order.status}
                            </span>
                          </div>

                          {/* Items del pedido */}
                          <div className="space-y-1 my-3 py-2 border-y border-slate-200 text-xs">
                            {order.order_lines.map((line) => (
                              <div key={line.id} className="flex justify-between text-slate-700">
                                <span>
                                  <span className="font-bold text-slate-900">{line.quantity}x</span>{' '}
                                  {line.menu_items?.name || 'Plato'}
                                </span>
                                <span className="text-slate-500">${(Number(line.unit_price || 0) * line.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {order.cancel_reason && (
                              <p className="text-[10px] text-slate-500 italic pt-1">{order.cancel_reason}</p>
                            )}
                          </div>
                        </div>

                        {/* Pie del Ticket con Acciones y WhatsApp */}
                        <div className="pt-2 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-black text-slate-900">
                              ${Number(order.total_amount || 0).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            {/* Botón WhatsApp */}
                            <button
                              onClick={() => handleNotifyWhatsApp(order)}
                              title={clientPhone ? `Enviar WhatsApp a ${clientPhone}` : 'Abrir WhatsApp'}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>📱 WA</span>
                            </button>

                            {/* Botón Entregar / Despachar */}
                            {isReady && (
                              <button
                                onClick={() => handleDeliverOrder(order.id)}
                                className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                              >
                                {isDelivery ? '🛵 En Camino' : '✓ Entregar'}
                              </button>
                            )}

                            {/* Botón Cobrar */}
                            <button
                              onClick={() =>
                                handleOpenPaymentModal(
                                  order.id,
                                  order.table_number || `Ticket #${order.id}`,
                                  Number(order.total_amount || 0)
                                )
                              }
                              className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                            >
                              💵 Cobrar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* ================= VISTA DE SALÓN DE MESAS ================= */}
        {activeMode === 'mesas' && (
          <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mesas del Salón</h2>
              <p className="text-xs text-slate-500">Selecciona una mesa para tomar o consultar el pedido</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Libre
              </span>
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Ocupada
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => {
                const isOccupied = table.status !== 'libre';
                return (
                  <button
                    key={table.id}
                    onClick={() => openOrderModal(table)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-32 cursor-pointer shadow-xs ${
                      isOccupied
                        ? 'bg-white border-slate-400 ring-2 ring-slate-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-lg font-bold text-slate-900 tracking-tight">
                        {table.number === 'BARRA' ? 'Barra' : `Mesa ${table.number}`}
                      </span>
                      {getStatusBadge(table.status)}
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-500">{table.name}</p>
                      <p className="text-[10px] text-slate-400">Cap: {table.capacity} pers.</p>
                      {table.currentOrder && (
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            ${Number(table.currentOrder.total_amount).toFixed(2)}
                          </span>
                          <div className="flex gap-1">
                            {table.status === 'para_entregar' && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeliverOrder(table.currentOrder!.id);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Entregar
                              </span>
                            )}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPaymentModal(
                                  table.currentOrder!.id,
                                  table.name,
                                  Number(table.currentOrder!.total_amount)
                                );
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Cobrar
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>

      {/* Modal de Carga de Pedido (Salón, Mostrador, Takeaway o Delivery) */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>
                    {orderType === 'delivery'
                      ? '🛵 Pedido Delivery'
                      : orderType === 'takeaway'
                      ? '🛍️ Pedido Takeaway / Retiro'
                      : selectedTable
                      ? `🍽️ Mesa ${selectedTable.number}`
                      : '⚡ Pedido Mostrador'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                    {orderType}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Selecciona los platos para enviar a cocina</p>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body: Split View (Menú a la izquierda, Comanda a la derecha) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
              {/* Catálogo de Menú */}
              <div className="md:col-span-2 p-4 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col overflow-hidden bg-white">
                {/* Filtros */}
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar plato (ej. Lomo, Hamburguesa, Papas)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500"
                  />
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Platos */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                          <span className="text-xs font-bold text-slate-900">${item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                        )}
                        {!item.isAvailable && (
                          <span className="inline-block mt-1 text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Sin stock suficiente
                          </span>
                        )}
                      </div>

                      <button
                        disabled={!item.isAvailable}
                        onClick={() => addItemToOrder(item)}
                        className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        + Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comanda Actual */}
              <div className="p-4 flex flex-col justify-between bg-slate-50 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                    Comanda ({selectedItems.length} items)
                  </h4>

                  {selectedItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                      <span>🛒</span>
                      <p className="mt-2">Agrega platos del menú para armar el pedido</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {selectedItems.map((item) => (
                        <div
                          key={item.menuItem.id}
                          className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2 shadow-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-900">{item.menuItem.name}</span>
                            <span className="font-bold text-slate-900">
                              ${(item.menuItem.price * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.menuItem.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer border border-slate-300"
                              >
                                -
                              </button>
                              <span className="font-bold text-slate-900 px-1">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.menuItem.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer border border-slate-300"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                            placeholder="Notas (ej. sin cebolla)..."
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-300 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Datos del Cliente y Modalidad (si no es mesa de salón) */}
                <div className="pt-3 border-t border-slate-200 space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre del Cliente..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="WhatsApp (ej. 351...)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {orderType === 'delivery' && (
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Dirección de entrega (Calle y altura)..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  )}

                  {/* Cobro Inmediato en Mostrador */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={payImmediately}
                        onChange={(e) => setPayImmediately(e.target.checked)}
                        className="rounded border-slate-300 text-slate-800"
                      />
                      <span>Cobrar de inmediato en caja</span>
                    </label>

                    {payImmediately && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrepayMethod('efectivo')}
                            className={`py-1 rounded-lg text-[10px] font-bold border ${
                              prepayMethod === 'efectivo'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Efectivo
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrepayMethod('tarjeta')}
                            className={`py-1 rounded-lg text-[10px] font-bold border ${
                              prepayMethod === 'tarjeta'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Tarjeta
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrepayMethod('transferencia')}
                            className={`py-1 rounded-lg text-[10px] font-bold border ${
                              prepayMethod === 'transferencia'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Transferencia
                          </button>
                        </div>
                        <input
                          type="text"
                          value={prepayNotes}
                          onChange={(e) => setPrepayNotes(e.target.value)}
                          placeholder="Ref. o nro de cupón/MP..."
                          className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-300 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Notas generales del pedido..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-500">Total a Pagar:</span>
                    <span className="text-lg font-bold text-slate-900">${calculateTotal().toFixed(2)}</span>
                  </div>

                  <button
                    disabled={selectedItems.length === 0 || submitting}
                    onClick={handleSubmitOrder}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  >
                    {submitting
                      ? 'Enviando a Cocina...'
                      : payImmediately
                      ? `Confirmar, Cobrar ($${calculateTotal().toFixed(2)}) y Despachar`
                      : 'Confirmar y Enviar a Cocina'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Cobro y Cierre de Mesa */}
      {paymentModalOpen && selectedOrderToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cobrar {selectedOrderToPay.tableName}</h3>
                  <p className="text-xs text-slate-500">Comanda #{selectedOrderToPay.id}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-5 space-y-5">
              {/* Monto Total Destacado */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total a Cobrar</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  ${selectedOrderToPay.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Selector de Método de Pago */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Forma de Pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'efectivo'
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">💵</span>
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'tarjeta'
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'transferencia'
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">📱</span>
                    <span>Transferencia</span>
                  </button>
                </div>
              </div>

              {/* Referencia / Notas opcional */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 block">
                  Referencia / N° Comprobante (opcional):
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={
                    paymentMethod === 'transferencia'
                      ? 'Ej. N° Operación Mercado Pago 7412...'
                      : paymentMethod === 'tarjeta'
                      ? 'Ej. Cupón Débito / Lote 04'
                      : 'Ej. Pago justo / cambio entregado'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Info Stock */}
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                <span>ℹ️</span>
                <span>Al confirmar, la mesa se liberará automáticamente y se descontará el stock de recetas.</span>
              </p>

              {/* Botones de Acción */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={payingOrder}
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={payingOrder}
                  onClick={handleConfirmPayment}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {payingOrder ? (
                    'Procesando...'
                  ) : (
                    <>
                      <span>✓ Confirmar Cobro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
