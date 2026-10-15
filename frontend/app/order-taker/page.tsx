'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  User,
  Order,
  MenuItem,
  AvailableCook,
  WhatsAppMessage,
  WhatsAppStatus,
} from '@/lib/api';
import { wsClient } from '@/lib/websocket';

interface SelectedItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface DeliveryDriver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
}

const DEFAULT_DRIVERS: DeliveryDriver[] = [
  { id: 1, name: 'Franco (Delivery)', phone: '3804200387', vehicle: 'Moto Honda Wave' },
  { id: 2, name: 'Lucas (Delivery)', phone: '3804334455', vehicle: 'Moto Smash 110' },
];

export default function OrderTakerDashboard() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user] = useState<User | null>(() => api.getUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cooks, setCooks] = useState<AvailableCook[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState<boolean>(() => !!wsClient.getSocket()?.connected);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filtro de lista de comandas (sobrio)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'in_kitchen' | 'ready' | 'delayed'>('all');

  // Reloj para actualizar cronómetros cada 20 segundos
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(timer);
  }, []);

  // ================= ESTADO DE WHATSAPP =================
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([]);
  const [waQRModalOpen, setWaQRModalOpen] = useState(false);
  const [waQRDataUrl, setWaQRDataUrl] = useState<string | null>(null);
  const [waDrawerOpen, setWaDrawerOpen] = useState(true); // panel lateral de chats
  const [targetNumber] = useState<string>('3804200387');

  // ================= AGENDA DE REPARTIDORES (DELIVERY) =================
  const [deliveryDrivers, setDeliveryDrivers] = useState<DeliveryDriver[]>(DEFAULT_DRIVERS);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [manageDriversModalOpen, setManageDriversModalOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');

  // Cargar repartidores desde almacenamiento local
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nano_lomos_drivers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDeliveryDrivers(parsed);
          }
        }
      } catch {}
    }
  }, []);

  const saveDriversList = (drivers: DeliveryDriver[]) => {
    setDeliveryDrivers(drivers);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nano_lomos_drivers', JSON.stringify(drivers));
      } catch {}
    }
  };

  // ================= FORMULARIO GRANDE DE NUEVO PEDIDO =================
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'mostrador' | 'takeaway' | 'delivery' | 'salon'>('mostrador');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [assignCookAtCreate, setAssignCookAtCreate] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [generalOrderNotes, setGeneralOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Categorías fijas de la carta oficial de Nano Lomos
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<'Lomitos' | 'Hamburguesas' | 'Pizzas' | 'Especiales' | 'Otros'>('Lomitos');
  const [searchMenuQuery, setSearchMenuQuery] = useState('');
  const [referencedWAMessageId, setReferencedWAMessageId] = useState<string | null>(null);
  const [referencedWAText, setReferencedWAText] = useState<string | null>(null);

  // ================= MODALES DE ACCIONES =================
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPay, setProcessingPay] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);

  // Proteger ruta
  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      startTransition(() => router.replace('/login'));
      return;
    }
    if (currentUser.role !== 'order_taker' && currentUser.role !== 'manager' && currentUser.role !== 'admin') {
      startTransition(() => router.replace('/waiter'));
    }
  }, [router]);

  // Carga general de datos
  const loadData = useCallback(async () => {
    try {
      const [fetchedOrders, fetchedMenu, fetchedCooks, fetchedWAStatus, fetchedWAMessages] = await Promise.all([
        api.getOrders().catch(() => []),
        api.getMenu().catch(() => []),
        api.getAvailableCooks().catch(() => []),
        api.getWhatsAppStatus().catch(() => null),
        api.getWhatsAppMessages().catch(() => []),
      ]);

      setOrders(fetchedOrders);
      setMenuItems(fetchedMenu);
      setCooks(fetchedCooks);
      if (fetchedWAStatus) {
        setWaStatus(fetchedWAStatus);
        setWaQRDataUrl(fetchedWAStatus.qrCodeDataUrl);
      }
      setWaMessages(fetchedWAMessages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos del mostrador';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const socket = wsClient.connect();
    if (socket) {
      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));
    }

    const unsubCreated = wsClient.on('order:created', () => loadData());
    const unsubStatus = wsClient.on('order:status_changed', () => loadData());
    const unsubWAMessage = wsClient.on('whatsapp:new_message', (msg: unknown) => {
      setWaMessages((prev) => [msg as WhatsAppMessage, ...prev]);
      setFeedback({
        text: `📲 Nuevo mensaje de WhatsApp de ${(msg as WhatsAppMessage).senderName}`,
        type: 'info',
      });
    });

    return () => {
      unsubCreated();
      unsubStatus();
      unsubWAMessage();
    };
  }, [loadData]);

  // Cálculo de minutos transcurridos
  const getElapsedMinutes = useCallback((createdAt: string): number => {
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return 0;
    return Math.max(0, Math.floor((now - created) / 60000));
  }, [now]);

  // Comandas activas (no cobradas ni canceladas)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled');
  }, [orders]);

  // Métricas
  const metrics = useMemo(() => {
    const total = activeOrders.length;
    const unassigned = activeOrders.filter((o) => o.status === 'pending' || !o.assigned_cook_id).length;
    const inKitchen = activeOrders.filter((o) => o.status === 'assigned' || o.status === 'in_progress').length;
    const ready = activeOrders.filter((o) => o.status === 'ready_to_deliver').length;
    const delayed = activeOrders.filter((o) => {
      const mins = getElapsedMinutes(o.created_at);
      return mins >= 25 && o.status !== 'ready_to_deliver' && o.status !== 'delivered';
    }).length;
    return { total, unassigned, inKitchen, ready, delayed };
  }, [activeOrders, getElapsedMinutes]);

  // Filtrado de comandas
  const filteredOrders = useMemo(() => {
    return activeOrders.filter((o) => {
      const mins = getElapsedMinutes(o.created_at);
      if (statusFilter === 'unassigned') return o.status === 'pending' || !o.assigned_cook_id;
      if (statusFilter === 'in_kitchen') return o.status === 'assigned' || o.status === 'in_progress';
      if (statusFilter === 'ready') return o.status === 'ready_to_deliver';
      if (statusFilter === 'delayed') return mins >= 25 && o.status !== 'ready_to_deliver' && o.status !== 'delivered';
      return true;
    });
  }, [activeOrders, statusFilter, getElapsedMinutes]);

  // ================= CONECTAR / DESCONECTAR WHATSAPP =================
  const handleOpenQRModal = async () => {
    try {
      const qrRes = await api.getWhatsAppQR(targetNumber);
      setWaQRDataUrl(qrRes.qrCodeDataUrl);
      setWaQRModalOpen(true);
    } catch {
      setFeedback({ text: 'Error al generar código QR de WhatsApp', type: 'error' });
    }
  };

  const handleConfirmQRScanned = async () => {
    try {
      const res = await api.connectWhatsApp(targetNumber);
      setWaStatus((prev) => (prev ? { ...prev, status: 'connected', connectedNumber: res.connectedNumber } : null));
      setWaQRModalOpen(false);
      setFeedback({ text: `WhatsApp vinculado con éxito al número ${targetNumber}`, type: 'success' });
      loadData();
    } catch {
      setFeedback({ text: 'Error al vincular WhatsApp', type: 'error' });
    }
  };

  const handleDisconnectWA = async () => {
    try {
      await api.disconnectWhatsApp();
      setWaStatus((prev) => (prev ? { ...prev, status: 'disconnected', connectedNumber: null } : null));
      setFeedback({ text: 'Sesión de WhatsApp desconectada', type: 'info' });
      loadData();
    } catch {
      setFeedback({ text: 'Error al desconectar WhatsApp', type: 'error' });
    }
  };

  // Convertir un mensaje de WhatsApp entrante en comanda nueva
  const handleCreateOrderFromWAMessage = (msg: WhatsAppMessage) => {
    setReferencedWAMessageId(msg.id);
    setReferencedWAText(msg.text);
    setCustomerName(msg.senderName);
    setCustomerPhone(msg.phone);
    setGeneralOrderNotes(`Mensaje de WhatsApp: "${msg.text}"`);

    // Detección automática de ubicación de Google Maps o dirección en el mensaje
    const mapsRegex = /(https?:\/\/(?:www\.)?(?:maps\.google\.com|google\.com\/maps|maps\.app\.goo\.gl)[^\s]+)/i;
    const mapsMatch = msg.text.match(mapsRegex);

    const isDeliveryIntent =
      Boolean(mapsMatch) ||
      msg.text.toLowerCase().includes('delivery') ||
      msg.text.toLowerCase().includes('enviar') ||
      msg.text.toLowerCase().includes('envio') ||
      msg.text.toLowerCase().includes('envío') ||
      msg.text.toLowerCase().includes('calle') ||
      msg.text.toLowerCase().includes('av') ||
      msg.text.toLowerCase().includes('barrio') ||
      msg.text.toLowerCase().includes('b°') ||
      msg.text.toLowerCase().includes('casa') ||
      msg.text.toLowerCase().includes('manzana');

    if (isDeliveryIntent) {
      setOrderType('delivery');
      if (mapsMatch) {
        setDeliveryAddress(mapsMatch[0]);
      } else {
        setDeliveryAddress(msg.text);
      }
    } else {
      setOrderType('takeaway');
      setDeliveryAddress('');
    }

    setSelectedItems([]);
    setSelectedDriverId(null);
    setDeliveryFee(0);
    setCreateOrderModalOpen(true);
  };

  // ================= PLACAS Y SELECCIÓN DE MENÚ =================
  const currentCategoryItems = useMemo(() => {
    return menuItems.filter((m) => {
      if (!m.is_active) return false;
      const matchCat =
        selectedMenuCategory === 'Lomitos'
          ? m.category === 'Lomitos' || m.category === 'Sandwiches'
          : selectedMenuCategory === 'Hamburguesas'
          ? m.category === 'Hamburguesas'
          : selectedMenuCategory === 'Pizzas'
          ? m.category === 'Pizzas'
          : selectedMenuCategory === 'Especiales'
          ? m.category === 'Especiales'
          : m.category === 'Otros' || m.category === 'Bebidas';

      const matchSearch =
        !searchMenuQuery ||
        m.name.toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchMenuQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [menuItems, selectedMenuCategory, searchMenuQuery]);

  const handleAddItem = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((i) => i.menuItem.id === item.id);
      if (idx >= 0) {
        return prev.map((i, index) => (index === idx ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQty = (itemId: number, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => (i.menuItem.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleUpdateNotes = (itemId: number, notes: string) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.menuItem.id === itemId ? { ...i, notes } : i))
    );
  };

  const orderTotalAmount = useMemo(() => {
    const itemsTotal = selectedItems.reduce((acc, curr) => acc + Number(curr.menuItem.price) * curr.quantity, 0);
    return itemsTotal + (orderType === 'delivery' ? deliveryFee : 0);
  }, [selectedItems, orderType, deliveryFee]);

  // Guardar y enviar comanda
  const handleSaveOrder = async () => {
    if (selectedItems.length === 0) {
      setFeedback({ text: 'Por favor, selecciona al menos un plato de la carta.', type: 'error' });
      return;
    }

    try {
      setSubmittingOrder(true);
      
      // Armar notas con chofer si corresponde
      let notesToSave = generalOrderNotes.trim();
      if (orderType === 'delivery' && selectedDriverId) {
        const driverObj = deliveryDrivers.find((d) => d.id === selectedDriverId);
        if (driverObj) {
          const driverStr = `[Cadete: ${driverObj.name} - Tel: ${driverObj.phone}]`;
          notesToSave = notesToSave ? `${notesToSave} ${driverStr}` : driverStr;
        }
      }
      if (orderType === 'delivery' && deliveryFee > 0) {
        const feeStr = `[Envío: $${deliveryFee.toLocaleString('es-AR')}]`;
        notesToSave = notesToSave ? `${notesToSave} ${feeStr}` : feeStr;
      }

      const created = await api.createOrder({
        orderType,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() || undefined : undefined,
        items: selectedItems.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes.trim() || undefined,
        })),
        paymentNotes: notesToSave || undefined,
      });

      // Si se asignó cocinero al crearlo
      if (assignCookAtCreate) {
        await api.assignCookToOrder(created.id, assignCookAtCreate).catch(() => {});
      }

      // Si venía de un mensaje de WhatsApp, marcarlo como convertido
      if (referencedWAMessageId) {
        await api.markWhatsAppConverted(referencedWAMessageId, created.id).catch(() => {});
        setReferencedWAMessageId(null);
        setReferencedWAText(null);
      }

      setFeedback({
        text: `Comanda #${created.id} creada y enviada a cocina exitosamente.`,
        type: 'success',
      });

      setCreateOrderModalOpen(false);
      setSelectedItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setGeneralOrderNotes('');
      setSelectedDriverId(null);
      setDeliveryFee(0);
      setAssignCookAtCreate(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear pedido';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Asignar cocinero a comanda existente
  const handleAssignCook = async (orderId: number, cookId: number) => {
    try {
      await api.assignCookToOrder(orderId, cookId);
      const cookObj = cooks.find((c) => c.id === cookId);
      setFeedback({
        text: `Comanda #${orderId} asignada a ${cookObj?.fullName || 'cocinero'}.`,
        type: 'success',
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al asignar cocinero';
      setFeedback({ text: msg, type: 'error' });
    }
  };

  // Marcar entregado
  const handleDeliver = async (order: Order) => {
    try {
      await api.deliverOrder(order.id);
      setFeedback({ text: `Comanda #${order.id} entregada.`, type: 'success' });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al despachar pedido';
      setFeedback({ text: msg, type: 'error' });
    }
  };

  // Cobrar comanda
  const handleConfirmPay = async () => {
    if (!orderToPay) return;
    try {
      setProcessingPay(true);
      await api.payOrder(orderToPay.id, paymentMethod, paymentNotes.trim() || undefined);
      setFeedback({
        text: `Comanda #${orderToPay.id} cobrada exitosamente (\$${Number(orderToPay.total_amount).toLocaleString('es-AR')}). Stock descontado.`,
        type: 'success',
      });
      setPayModalOpen(false);
      setOrderToPay(null);
      setPaymentNotes('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar cobro';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setProcessingPay(false);
    }
  };

  // Cancelar comanda
  const handleConfirmCancel = async () => {
    if (!orderToCancel || !cancelReason.trim()) {
      setFeedback({ text: 'Indique un motivo para anular.', type: 'error' });
      return;
    }
    try {
      setProcessingCancel(true);
      await api.cancelOrder(orderToCancel.id, cancelReason.trim());
      setFeedback({ text: `Comanda #${orderToCancel.id} anulada.`, type: 'info' });
      setCancelModalOpen(false);
      setOrderToCancel(null);
      setCancelReason('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al anular comanda';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setProcessingCancel(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* ================= HEADER SOBRIO Y PROFESIONAL ================= */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo-nanolomos.png"
              alt="Nano Lomos Logo"
              className="h-10 w-auto object-contain rounded-lg border border-slate-200 bg-slate-900 p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-slate-900 text-base uppercase">NANO LOMOS</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Cajero Mostrador
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 ${
                    wsConnected ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  {wsConnected ? 'Conectado' : 'Reconectando'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Recepción de pedidos, WhatsApp y coordinación de cocina
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Estado de WhatsApp QR */}
            {waStatus?.status === 'connected' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-bold text-slate-800 font-mono">WA: +54 9 {waStatus.connectedNumber || targetNumber}</span>
                <button
                  onClick={handleDisconnectWA}
                  className="text-slate-400 hover:text-slate-700 text-[10px] ml-1 underline cursor-pointer"
                  title="Desconectar sesión de WhatsApp"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenQRModal}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Escanear código QR para conectar WhatsApp"
              >
                <span>📲</span> Conectar WhatsApp ({targetNumber})
              </button>
            )}

            {(user?.role === 'manager' || user?.role === 'admin') && (
              <button
                onClick={() => router.push('/manager')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Gerencia
              </button>
            )}

            <button
              onClick={() => {
                api.clearAuth();
                router.replace('/login');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* FEEDBACK SUTIL */}
      {feedback && (
        <div
          className={`px-4 py-2 text-center text-xs font-semibold transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
              : feedback.type === 'success'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-800 border-b border-slate-200'
          }`}
        >
          {feedback.text}
          <button onClick={() => setFeedback(null)} className="ml-3 underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-4">
        {/* BARRA SUPERIOR DE RESUMEN Y BOTÓN NUEVO PEDIDO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todas las comandas ({activeOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('unassigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'unassigned'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Sin asignar ({metrics.unassigned})
            </button>
            <button
              onClick={() => setStatusFilter('in_kitchen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'in_kitchen'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              En cocina ({metrics.inKitchen})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'ready'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Listos ({metrics.ready})
            </button>

            {/* SOLO SI HAY DEMORADOS SE MUESTRA ESTE BOTÓN DESTACADO */}
            {metrics.delayed > 0 && (
              <button
                onClick={() => setStatusFilter('delayed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  statusFilter === 'delayed'
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                ⚠️ Demorados ({metrics.delayed})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setManageDriversModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Agendar y gestionar números de repartidores/cadetes"
            >
              <span>🛵</span> Repartidores ({deliveryDrivers.length})
            </button>
            <button
              onClick={() => setWaDrawerOpen(!waDrawerOpen)}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>💬</span> {waDrawerOpen ? 'Ocultar WhatsApp' : `Ver Chats (${waMessages.length})`}
            </button>
            <button
              onClick={() => {
                setReferencedWAMessageId(null);
                setReferencedWAText(null);
                setSelectedItems([]);
                setCustomerName('');
                setCustomerPhone('');
                setDeliveryAddress('');
                setOrderType('mostrador');
                setAssignCookAtCreate(null);
                setGeneralOrderNotes('');
                setCreateOrderModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>➕</span> NUEVO PEDIDO
            </button>
          </div>
        </div>

        {/* LAYOUT: GRILLA PRINCIPAL Y BANDEJA DE WHATSAPP */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* COLUMNA DE COMANDAS ACTIVAS */}
          <div className={waDrawerOpen ? 'lg:col-span-3 space-y-3' : 'lg:col-span-4 space-y-3'}>
            {loading ? (
              <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                Cargando comandas en curso...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600 font-bold text-sm">No hay pedidos en este filtro</p>
                <p className="text-slate-400 text-xs mt-1">
                  Usa el botón &ldquo;Nuevo Pedido&rdquo; o selecciona un mensaje de WhatsApp para comenzar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredOrders.map((order) => {
                  const elapsedMins = getElapsedMinutes(order.created_at);
                  const isVeryDelayed = elapsedMins >= 25 && order.status !== 'ready_to_deliver' && order.status !== 'delivered';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isVeryDelayed
                          ? 'bg-rose-50/40 border-rose-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Cabecera del ticket */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 text-base">#{order.id}</span>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {order.order_type === 'delivery'
                                  ? 'Delivery'
                                  : order.order_type === 'takeaway'
                                  ? 'Retiro'
                                  : 'Mostrador'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                            </span>
                          </div>

                          {/* Cronómetro sobrio: solo rojo si está muy demorado */}
                          <div>
                            {isVeryDelayed ? (
                              <span className="text-xs font-black text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                                ⚠️ DEMORADO ({elapsedMins} min)
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                ⏱️ {elapsedMins} min
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Datos del cliente */}
                        <div className="py-2 text-xs space-y-0.5">
                          <p className="font-bold text-slate-800">
                            👤 {order.customers?.first_name || 'Cliente'} {order.customers?.last_name || ''}
                          </p>
                          {order.customers?.phone && (
                            <p className="text-slate-500 font-mono text-[11px]">
                              📱 {order.customers.phone}
                            </p>
                          )}
                          {order.delivery_address && (
                            <div className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 mt-1">
                              <span className="text-slate-700 truncate max-w-[190px]">📍 {order.delivery_address}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = order.delivery_address!.startsWith('http')
                                    ? order.delivery_address!
                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address!)}`;
                                  window.open(url, '_blank');
                                }}
                                className="text-slate-700 hover:text-black font-bold underline shrink-0 cursor-pointer text-[10px]"
                                title="Abrir ubicación en Google Maps"
                              >
                                🗺️ Maps
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Asignación de Cocinero */}
                        <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-slate-500 text-[11px]">Cocinero:</span>
                            <span className="font-bold text-slate-800 text-[11px]">
                              {order.users_orders_assigned_cook_idTousers?.full_name || 'Sin asignar'}
                            </span>
                          </div>
                          <select
                            value={order.assigned_cook_id || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) handleAssignCook(order.id, Number(val));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-700"
                          >
                            <option value="">{order.assigned_cook_id ? 'Cambiar cocinero...' : 'Asignar cocinero...'}</option>
                            {cooks.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.fullName} ({c.activeOrdersCount} en curso)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Detalle de ítems */}
                        <div className="space-y-1 my-2 max-h-32 overflow-y-auto pr-1">
                          {order.order_lines.map((line) => (
                            <div key={line.id} className="text-xs flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-800">{line.quantity}x</span>{' '}
                                <span className="text-slate-700">{line.menu_items.name}</span>
                                {line.notes && <p className="text-[10px] text-slate-500 italic">({line.notes})</p>}
                              </div>
                              <span className="text-slate-500 font-mono text-[11px]">
                                ${(Number(line.unit_price || 0) * line.quantity).toLocaleString('es-AR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pie con Total y Botones de acción */}
                      <div className="pt-2.5 border-t border-slate-200 mt-2 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Total:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            ${Number(order.total_amount || 0).toLocaleString('es-AR')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {order.status !== 'delivered' && (
                            <button
                              onClick={() => handleDeliver(order)}
                              className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 cursor-pointer text-center"
                            >
                              Despachar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setOrderToPay(order);
                              setPaymentMethod('efectivo');
                              setPaymentNotes('');
                              setPayModalOpen(true);
                            }}
                            className={`py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer text-center ${
                              order.status === 'delivered' ? 'col-span-2' : ''
                            }`}
                          >
                            Cobrar
                          </button>
                        </div>

                        <div className="flex flex-wrap justify-between items-center text-[11px] pt-0.5 gap-1">
                          <div className="flex items-center gap-2">
                            {order.customers?.phone ? (
                              <a
                                href={`https://api.whatsapp.com/send?phone=549${order.customers.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(
                                  order.status === 'ready_to_deliver'
                                    ? `¡Hola ${order.customers.first_name || 'Cliente'}! Tu pedido #${order.id} de Nano Lomos ya está listo y saliendo hacia tu dirección.`
                                    : `¡Hola ${order.customers.first_name || 'Cliente'}! Tu pedido #${order.id} de Nano Lomos ya está en preparación.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 hover:text-slate-900 underline font-medium"
                                title="Enviar mensaje al cliente por WhatsApp"
                              >
                                💬 WA Cliente
                              </a>
                            ) : null}

                            {order.order_type === 'delivery' && deliveryDrivers.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const driver = deliveryDrivers[0];
                                  const itemsText = order.order_lines.map((l) => `${l.quantity}x ${l.menu_items.name}`).join(', ');
                                  const msg = `🛵 *NANO LOMOS - COMANDA #${order.id}*\n👤 Cliente: ${order.customers?.first_name || 'Cliente'} (${order.customers?.phone || 'Sin tel'})\n📍 Dirección: ${order.delivery_address || 'A coordinar'}\n🍔 Pedido: ${itemsText}\n💵 Total a cobrar: $${Number(order.total_amount || 0).toLocaleString('es-AR')}`;
                                  window.open(`https://api.whatsapp.com/send?phone=549${driver.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="text-slate-700 hover:text-black font-semibold underline cursor-pointer"
                                title="Enviar comanda completa al cadete por WhatsApp"
                              >
                                🛵 Enviar a Cadete
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setOrderToCancel(order);
                              setCancelReason('');
                              setCancelModalOpen(true);
                            }}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            Anular
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMNA LATERAL: BANDEJA DE ENTRADA DE WHATSAPP (3804200387) */}
          {waDrawerOpen && (
            <div className="lg:col-span-1 bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">💬</span>
                  <h3 className="font-bold text-slate-800 text-xs">Mensajes de WhatsApp</h3>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  {waMessages.length}
                </span>
              </div>

              {waMessages.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No hay mensajes entrantes aún.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
                  {waMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                        msg.isConverted
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-slate-700 text-[11px] bg-slate-50 p-2 rounded border border-slate-200/70 font-sans">
                        &ldquo;{msg.text}&rdquo;
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500 font-mono">📱 {msg.phone}</span>

                        {msg.isConverted ? (
                          <span className="text-[10px] text-slate-500 font-bold">✓ Comanda #{msg.orderId || ''}</span>
                        ) : (
                          <button
                            onClick={() => handleCreateOrderFromWAMessage(msg)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] cursor-pointer"
                          >
                            ⚡ Crear Pedido
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ================= MODAL GRANDE: CREAR PEDIDO POR CATEGORÍAS (POS FULL SCREEN) ================= */}
      {createOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-2xl w-full h-[96vh] max-w-[98vw] p-3 sm:p-5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header del modal POS con tipografía suave */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xl shadow-xs">
                  🛒
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                    Nueva Comanda de Mostrador
                  </h3>
                  {referencedWAText ? (
                    <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">
                      📩 Basado en mensaje de WhatsApp: &ldquo;{referencedWAText}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 font-normal">
                      Selecciona los platos de la carta y envía la comanda a cocina
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOrderModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="text-sm leading-none">✕</span>
                  <span>Cerrar</span>
                </button>
              </div>
            </div>

            {/* Cuerpo del formulario en 2 columnas maximizadas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 flex-1 overflow-hidden min-h-0">
              {/* COLUMNA IZQUIERDA (7 cols en desktop): CATÁLOGO DE LA CARTA */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 h-full space-y-3">
                {/* Selector de Categorías de la Carta - Botones táctiles claros */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 shrink-0">
                  {(['Lomitos', 'Hamburguesas', 'Pizzas', 'Especiales', 'Otros'] as const).map((cat) => {
                    const isSelected = selectedMenuCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedMenuCategory(cat)}
                        className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border text-center ${
                          isSelected
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className="text-base">
                          {cat === 'Lomitos'
                            ? '🥪'
                            : cat === 'Hamburguesas'
                            ? '🍔'
                            : cat === 'Pizzas'
                            ? '🍕'
                            : cat === 'Especiales'
                            ? '⭐'
                            : '🍟'}
                        </span>
                        <span className="truncate">
                          {cat === 'Lomitos'
                            ? 'Lomitos'
                            : cat === 'Hamburguesas'
                            ? 'Hamburguesas'
                            : cat === 'Pizzas'
                            ? 'Pizzas'
                            : cat === 'Especiales'
                            ? 'Especiales'
                            : 'Otros / Bebidas'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Buscador grande de platos */}
                <div className="relative shrink-0">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchMenuQuery}
                    onChange={(e) => setSearchMenuQuery(e.target.value)}
                    placeholder={`Buscar plato en ${selectedMenuCategory}... (o escribe para filtrar)`}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white transition-colors"
                  />
                  {searchMenuQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchMenuQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Lista de Platos - Letras suaves y precios claros */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                  {currentCategoryItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm font-normal">
                      No se encontraron platos con ese criterio en esta sección.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 pb-2">
                      {currentCategoryItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xl cursor-pointer transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group active:scale-[0.99]"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <h4 className="font-semibold text-slate-800 text-xs sm:text-sm group-hover:text-slate-900 leading-snug">
                                {item.name}
                              </h4>
                            </div>
                            {item.description ? (
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic">Nano Lomos clásico</p>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm sm:text-base font-semibold text-slate-700 font-mono">
                              ${Number(item.price).toLocaleString('es-AR')}
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-slate-100 group-hover:bg-slate-800 text-slate-700 group-hover:text-white font-medium text-xs transition-colors">
                              + Agregar
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA (5 cols en desktop): DATOS DEL CLIENTE, DELIVERY Y TICKET */}
              <div className="lg:col-span-5 xl:col-span-4 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 min-h-0 h-full overflow-hidden">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0">
                  {/* Selector de Modalidad */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Modalidad del pedido:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOrderType('mostrador')}
                        className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          orderType === 'mostrador'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🍽️ Mostrador
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('takeaway')}
                        className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          orderType === 'takeaway'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🛍️ Retiro
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          orderType === 'delivery'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🛵 Delivery
                      </button>
                    </div>
                  </div>

                  {/* Datos del Cliente */}
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Cliente:</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nombre del cliente"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-normal text-slate-800 focus:outline-none focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">WhatsApp / Cel:</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="3804200387"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono font-normal text-slate-800 focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* SECCIÓN ESPECÍFICA DE DELIVERY: UBICACIÓN, MAPS Y CADETE */}
                    {orderType === 'delivery' && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[11px] font-semibold text-slate-700">
                              📍 Dirección o Ubicación:
                            </label>
                            {deliveryAddress && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = deliveryAddress.startsWith('http')
                                    ? deliveryAddress
                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress)}`;
                                  window.open(url, '_blank');
                                }}
                                className="text-[10px] text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                              >
                                🗺️ Abrir en Google Maps
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Calle, número, barrio o link de Google Maps..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[11px] font-semibold text-slate-700">
                                🛵 Repartidor:
                              </label>
                              <button
                                type="button"
                                onClick={() => setManageDriversModalOpen(true)}
                                className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                              >
                                ⚙️ Agendar
                              </button>
                            </div>
                            <select
                              value={selectedDriverId || ''}
                              onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-700"
                            >
                              <option value="">Sin cadete asignado aún</option>
                              {deliveryDrivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.phone})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                              💵 Costo Envío:
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">$</span>
                              <input
                                type="number"
                                value={deliveryFee || ''}
                                onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                                placeholder="0"
                                className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Asignar a Cocinero:</label>
                      <select
                        value={assignCookAtCreate || ''}
                        onChange={(e) => setAssignCookAtCreate(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-700"
                      >
                        <option value="">Cola general de cocina (sin asignar)</option>
                        {cooks.map((c) => (
                          <option key={c.id} value={c.id}>
                            👨‍🍳 {c.fullName} ({c.activeOrdersCount} comanda{c.activeOrdersCount === 1 ? '' : 's'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ítems Seleccionados en el Ticket */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Comanda Actual ({selectedItems.length}):</span>
                      {selectedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedItems([])}
                          className="text-[11px] font-medium text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          Vaciar ticket
                        </button>
                      )}
                    </div>

                    {selectedItems.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                        <p className="text-xs text-slate-400 font-normal">
                          👈 Toca los platos a la izquierda para sumarlos a este ticket.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[28vh] overflow-y-auto pr-1">
                        {selectedItems.map((i) => (
                          <div
                            key={i.menuItem.id}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 truncate max-w-[160px] sm:max-w-[200px]">
                                {i.menuItem.name}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(i.menuItem.id, -1)}
                                  className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  -
                                </button>
                                <span className="font-semibold text-slate-800 w-5 text-center">{i.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(i.menuItem.id, 1)}
                                  className="h-6 w-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  +
                                </button>
                                <span className="font-mono font-semibold text-slate-700 ml-1.5 text-xs">
                                  ${(Number(i.menuItem.price) * i.quantity).toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={i.notes}
                              onChange={(e) => handleUpdateNotes(i.menuItem.id, e.target.value)}
                              placeholder="Aclaración: sin cebolla, extra mayo, término..."
                              className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Total y Botón de Confirmación Suave */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5 shrink-0 bg-slate-50">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total a cobrar:</span>
                      {orderType === 'delivery' && deliveryFee > 0 && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Incluye ${deliveryFee.toLocaleString('es-AR')} de envío)
                        </span>
                      )}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                      ${orderTotalAmount.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveOrder}
                    disabled={submittingOrder || selectedItems.length === 0}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-sm hover:shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <span>{submittingOrder ? 'Enviando comanda...' : '✓ Confirmar y Enviar a Cocina'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CÓDIGO QR DE WHATSAPP ================= */}
      {waQRModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
            <h3 className="font-black text-slate-900 text-base mb-1">Vincular WhatsApp de Nano Lomos</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              Número configurado: +54 9 {targetNumber}
            </p>

            {waQRDataUrl ? (
              <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-2xs">
                <img src={waQRDataUrl} alt="WhatsApp QR Code" className="h-56 w-56 object-contain mx-auto" />
              </div>
            ) : (
              <div className="h-56 w-56 flex items-center justify-center mx-auto text-xs text-slate-400">
                Generando código QR...
              </div>
            )}

            <div className="text-left text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 my-4 space-y-1">
              <p className="font-bold text-slate-800">Pasos en tu teléfono:</p>
              <p>1. Abre WhatsApp en tu celular.</p>
              <p>2. Toca <strong>Dispositivos vinculados</strong>.</p>
              <p>3. Apunta la cámara a este código QR.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setWaQRModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handleConfirmQRScanned}
                className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Ya lo escaneé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE COBRO ================= */}
      {payModalOpen && orderToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-sm w-full p-5 shadow-xl">
            <h3 className="font-black text-slate-900 text-base mb-1">Cobrar Comanda #{orderToPay.id}</h3>
            <p className="text-xs text-slate-500 mb-3">
              Total: <strong className="text-slate-900 font-black text-sm">${Number(orderToPay.total_amount).toLocaleString('es-AR')}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Método de pago:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`py-1.5 rounded-lg border font-bold ${
                      paymentMethod === 'efectivo'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`py-1.5 rounded-lg border font-bold ${
                      paymentMethod === 'tarjeta'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`py-1.5 rounded-lg border font-bold ${
                      paymentMethod === 'transferencia'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas de cobro (opcional):</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Pagó con \$20.000..."
                  className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Al confirmar, se descontará automáticamente el stock de insumos según la receta.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                disabled={processingPay}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                {processingPay ? 'Cobrando...' : 'Confirmar Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GESTIÓN Y AGENDA DE REPARTIDORES ================= */}
      {manageDriversModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛵</span>
                <h3 className="font-bold text-slate-800 text-base">Agenda de Repartidores (Delivery)</h3>
              </div>
              <button
                type="button"
                onClick={() => setManageDriversModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Lista actual de choferes */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-xs font-semibold text-slate-600 block">Cadetes registrados ({deliveryDrivers.length}):</span>
              {deliveryDrivers.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No hay repartidores agendados.</p>
              ) : (
                deliveryDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{driver.name}</p>
                      <p className="text-slate-500 font-mono text-[11px]">📱 WhatsApp: +54 9 {driver.phone}</p>
                      {driver.vehicle && <p className="text-[10px] text-slate-400">🛵 {driver.vehicle}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?phone=549${driver.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-semibold text-slate-700 hover:text-black underline"
                      >
                        Chatear
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = deliveryDrivers.filter((d) => d.id !== driver.id);
                          saveDriversList(filtered);
                        }}
                        className="text-[11px] text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                        title="Eliminar repartidor"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para agendar nuevo repartidor */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <span className="text-xs font-semibold text-slate-700 block">+ Agendar nuevo repartidor:</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Nombre del cadete (ej. Franco)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
                <input
                  type="tel"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="Celular / WhatsApp (ej. 3804200387)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white"
                />
                <input
                  type="text"
                  value={newDriverVehicle}
                  onChange={(e) => setNewDriverVehicle(e.target.value)}
                  placeholder="Vehículo (ej. Moto Honda Wave)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setManageDriversModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newDriverName.trim() || !newDriverPhone.trim()) return;
                    const newDriver: DeliveryDriver = {
                      id: Date.now(),
                      name: newDriverName.trim(),
                      phone: newDriverPhone.trim(),
                      vehicle: newDriverVehicle.trim() || 'Moto',
                    };
                    const updated = [...deliveryDrivers, newDriver];
                    saveDriversList(updated);
                    setNewDriverName('');
                    setNewDriverPhone('');
                    setNewDriverVehicle('');
                  }}
                  disabled={!newDriverName.trim() || !newDriverPhone.trim()}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar Cadete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
