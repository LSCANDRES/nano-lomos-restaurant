'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  User,
  DailyReport,
  TopSellingItem,
  PurchaseProjectionItem,
  IngredientItem,
  StockTransaction,
  MenuItem,
  StaffUser,
  LoginHistoryItem,
  CashShiftSummary,
} from '@/lib/api';
import { wsClient } from '@/lib/websocket';

type TabType = 'resumen' | 'inventario' | 'proyeccion' | 'menu' | 'personal';

export default function ManagerDashboard() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user] = useState<User | null>(() => api.getUser());
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [wsConnected, setWsConnected] = useState<boolean>(() => !!wsClient.getSocket()?.connected);

  // Datos del backend
  const [report, setReport] = useState<DailyReport | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [projections, setProjections] = useState<PurchaseProjectionItem[]>([]);
  const [inventory, setInventory] = useState<IngredientItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);

  // Arqueo y Caja
  const [shiftSummary, setShiftSummary] = useState<CashShiftSummary | null>(null);
  const [initialCashInput, setInitialCashInput] = useState<string>('15000');
  const [loadingShift, setLoadingShift] = useState(false);

  // Filtros y búsquedas
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Estados de carga y feedback
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [lowStockBanner, setLowStockBanner] = useState<{ name: string; current: number; min: number; unit: string } | null>(null);

  // Modales
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [savingRestock, setSavingRestock] = useState(false);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'order_taker' | 'waiter' | 'cook' | 'manager'>('order_taker');
  const [savingUser, setSavingUser] = useState(false);

  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState<StaffUser | null>(null);
  const [resetPwdInput, setResetPwdInput] = useState('');
  const [savingResetPwd, setSavingResetPwd] = useState(false);

  // Redirigir si no hay sesión o no es gerente/admin
  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      startTransition(() => router.replace('/login'));
      return;
    }
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
      startTransition(() => router.replace('/order-taker'));
    }
  }, [router]);

  // Cálculo del Arqueo de Caja
  const handleCalculateShift = useCallback(async (cashValue?: string) => {
    try {
      setLoadingShift(true);
      const val = parseFloat(cashValue !== undefined ? cashValue : initialCashInput) || 0;
      const res = await api.getCashShiftSummary(val);
      setShiftSummary(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al calcular arqueo de caja';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setLoadingShift(false);
    }
  }, [initialCashInput]);

  // Carga general de datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        fetchedReport,
        fetchedTop,
        fetchedProj,
        fetchedInv,
        fetchedTrans,
        fetchedMenu,
        fetchedStaff,
        fetchedHistory,
      ] = await Promise.all([
        api.getDailyReport().catch(() => null),
        api.getTopSellingItems(8).catch(() => []),
        api.getPurchaseProjection().catch(() => []),
        api.getInventory().catch(() => []),
        api.getStockTransactions(30).catch(() => []),
        api.getMenu(undefined, true).catch(() => []),
        api.getUsers(true).catch(() => []),
        api.getLoginHistory(undefined, 25).catch(() => []),
      ]);

      setReport(fetchedReport);
      setTopItems(fetchedTop);
      setProjections(fetchedProj);
      setInventory(fetchedInv);
      setTransactions(fetchedTrans);
      setMenuItems(fetchedMenu);
      setStaffUsers(fetchedStaff);
      setLoginHistory(fetchedHistory);

      const val = parseFloat(initialCashInput) || 0;
      api.getCashShiftSummary(val).then((s) => setShiftSummary(s)).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos del panel';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [initialCashInput]);

  useEffect(() => {
    loadData();

    // Conexión y oyentes WebSocket en tiempo real
    const socket = wsClient.connect();
    if (socket) {
      setWsConnected(socket.connected);

      const onConnect = () => setWsConnected(true);
      const onDisconnect = () => setWsConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
    }

    const unsubCreated = wsClient.on('order:created', () => {
      loadData();
    });

    const unsubStatus = wsClient.on('order:status_changed', () => {
      loadData();
    });

    const unsubStock = wsClient.on('stock:low_alert', (data: any) => {
      setLowStockBanner({
        name: data?.name || 'Insumo',
        current: Number(data?.current_stock || 0),
        min: Number(data?.min_stock || 0),
        unit: data?.unit || 'u',
      });
      loadData();
    });

    const interval = setInterval(loadData, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
      }
      unsubCreated();
      unsubStatus();
      unsubStock();
    };
  }, [loadData]);

  const handleLogout = async () => {
    await api.logout();
    startTransition(() => router.replace('/login'));
  };

  // Acciones de Reposición (Restock)
  const handleOpenRestock = (item: IngredientItem | PurchaseProjectionItem) => {
    const fullItem = inventory.find((i) => i.id === item.id) || {
      id: item.id,
      name: item.name,
      unit: item.unit,
      current_stock: item.current_stock,
      min_stock: item.min_stock,
      unit_cost: item.unit_cost,
      is_low_stock: item.is_low_stock,
    };
    setSelectedIngredient(fullItem);
    setRestockQty('');
    setRestockNotes('');
    setRestockModalOpen(true);
  };

  const handleConfirmRestock = async () => {
    if (!selectedIngredient || !restockQty || Number(restockQty) <= 0) {
      setFeedback({ text: 'Por favor ingrese una cantidad válida mayor a 0', type: 'error' });
      return;
    }

    try {
      setSavingRestock(true);
      await api.restockIngredient(
        selectedIngredient.id,
        Number(restockQty),
        restockNotes.trim() || undefined
      );
      setFeedback({
        text: `Stock actualizado con éxito: +${restockQty} ${selectedIngredient.unit} de ${selectedIngredient.name}`,
        type: 'success',
      });
      setRestockModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar stock';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingRestock(false);
    }
  };

  // Acciones de Precios
  const handleOpenEditPrice = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setNewPrice(item.price.toString());
    setPriceModalOpen(true);
  };

  const handleConfirmUpdatePrice = async () => {
    if (!selectedMenuItem || !newPrice || Number(newPrice) < 0) {
      setFeedback({ text: 'Ingrese un precio válido', type: 'error' });
      return;
    }

    try {
      setSavingPrice(true);
      await api.updateMenuItem(selectedMenuItem.id, { price: Number(newPrice) });
      setFeedback({
        text: `Precio de "${selectedMenuItem.name}" actualizado a $${Number(newPrice).toLocaleString('es-AR')}`,
        type: 'success',
      });
      setPriceModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar precio';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingPrice(false);
    }
  };

  // Acciones de Empleados
  const handleConfirmCreateUser = async () => {
    if (!newUsername || !newFullName || !newPassword) {
      setFeedback({ text: 'Nombre de usuario, nombre completo y contraseña son obligatorios', type: 'error' });
      return;
    }

    try {
      setSavingUser(true);
      await api.createUser({
        username: newUsername.trim(),
        fullName: newFullName.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword,
        role: newRole,
      });
      setFeedback({ text: `Empleado "${newFullName}" creado exitosamente`, type: 'success' });
      setCreateUserModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al dar de alta empleado';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenResetPwd = (staff: StaffUser) => {
    setSelectedStaffUser(staff);
    setResetPwdInput('');
    setResetPwdModalOpen(true);
  };

  const handleConfirmResetPwd = async () => {
    if (!selectedStaffUser || !resetPwdInput || resetPwdInput.length < 6) {
      setFeedback({ text: 'La nueva contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    try {
      setSavingResetPwd(true);
      await api.resetUserPassword(selectedStaffUser.id, resetPwdInput);
      setFeedback({ text: `Contraseña de ${selectedStaffUser.full_name} actualizada con éxito`, type: 'success' });
      setResetPwdModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al resetear contraseña';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingResetPwd(false);
    }
  };

  // Categorías del Menú
  const categories = ['todos', ...Array.from(new Set(menuItems.map((m) => m.category || 'Otros')))];
  const filteredMenuItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'todos' || (item.category || 'Otros') === selectedCategory;
    const matchText = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchText;
  });

  const filteredInventory = inventory.filter((ing) =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;

  return (
    <div className="min-h-screen bg-[#121214] text-[#EDEDED] flex flex-col font-sans selection:bg-[#FF5A00] selection:text-white">
      {/* Alerta flotante de Stock Crítico vía WebSocket */}
      {lowStockBanner && (
        <div className="bg-red-500/15 border-b border-red-500/40 text-red-200 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <span>
              <strong>¡Stock Crítico en Cocina!</strong> El insumo{' '}
              <strong className="text-white underline">{lowStockBanner.name}</strong> bajó a{' '}
              <span className="font-bold text-red-300">
                {lowStockBanner.current} {lowStockBanner.unit}
              </span>{' '}
              (Mínimo de seguridad: {lowStockBanner.min} {lowStockBanner.unit}).
            </span>
          </div>
          <button
            onClick={() => setLowStockBanner(null)}
            className="text-red-300 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-red-950/40"
          >
            Cerrar ✕
          </button>
        </div>
      )}

      {/* Header Corporativo NANO LOMOS */}
      <header className="border-b border-[#242429] bg-[#18181B] sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo Vector Oficial NANO LOMOS */}
            <div className="bg-[#121214] border border-[#FF5A00]/50 rounded-xl px-3 py-1 flex items-center gap-2 shadow-xs">
              <span className="text-white font-black tracking-widest text-base">
                N<span className="text-[#FF5A00]">▲</span>N<span className="text-[#FF5A00]">■</span>
              </span>
              <span className="text-[#FF5A00] text-xs font-black tracking-widest">— LOMOS —</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-[#FF5A00]/15 text-[#FF5A00] border border-[#FF5A00]/30 tracking-wider uppercase">
                Panel Gerencial Takeaway
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {wsConnected ? 'En vivo' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Acciones de usuario y accesos rápidos */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/order-taker')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#242429] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 transition"
            >
              🛒 POS Mostrador
            </button>
            <button
              onClick={() => router.push('/turnero')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#242429] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 transition"
            >
              📺 Turnero TV
            </button>
            <button
              onClick={() => router.push('/cook')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#242429] text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/60 transition"
            >
              👨‍🍳 Cocina KDS
            </button>

            <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 hidden md:inline">
                {user?.fullName || user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <nav className="bg-[#18181B] border-b border-[#242429] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'resumen'
                ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#242429]'
            }`}
          >
            <span>📊</span>
            <span>Resumen & Arqueo de Caja</span>
          </button>

          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'inventario'
                ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#242429]'
            }`}
          >
            <span>🥩</span>
            <span>Insumos & Stock en Vivo</span>
            {lowStockCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('proyeccion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'proyeccion'
                ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#242429]'
            }`}
          >
            <span>🛒</span>
            <span>Proyección de Compras</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#242429]'
            }`}
          >
            <span>🍔</span>
            <span>Carta Oficial & Precios ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#242429]'
            }`}
          >
            <span>👥</span>
            <span>Personal & Auditoría</span>
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 1: RESUMEN Y ARQUEO DE CAJA EXPRESS                   */}
        {/* ============================================================== */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            {/* Tarjetas Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recaudación Total Hoy</span>
                <div className="mt-2 text-3xl font-black text-white">
                  ${Number(report?.total_revenue || 0).toLocaleString('es-AR')}
                </div>
                <div className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span>✓</span> Mostrador & Takeaway activo
                </div>
              </div>

              <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Comandas</span>
                <div className="mt-2 text-3xl font-black text-white">
                  {report?.total_orders || 0}
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {report?.paid_orders || 0} cobradas · {report?.pending_orders || 0} en cocina
                </div>
              </div>

              <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Demora Promedio</span>
                <div className="mt-2 text-3xl font-black text-[#FF5A00]">
                  {report?.avg_completion_time_minutes || 0} <span className="text-base text-zinc-400">min</span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {report?.delayed_orders_count ? (
                    <span className="text-amber-400">⚠️ {report.delayed_orders_count} pedidos demorados</span>
                  ) : (
                    <span className="text-emerald-400">⚡ Servicio rápido al día</span>
                  )}
                </div>
              </div>

              <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alerta de Insumos</span>
                <div className="mt-2 text-3xl font-black text-white">
                  {lowStockCount > 0 ? (
                    <span className="text-red-400">{lowStockCount} <span className="text-base">críticos</span></span>
                  ) : (
                    <span className="text-emerald-400">100% <span className="text-base">óptimo</span></span>
                  )}
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {lowStockCount > 0 ? 'Reponer para el turno noche' : 'Stock de seguridad completo'}
                </div>
              </div>
            </div>

            {/* SECCIÓN ARQUEO Y CIERRE DE CAJA EXPRESS */}
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A30] pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>💵</span> Arqueo & Balance de Caja del Turno
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Control de dinero en efectivo vs ventas digitales (QR Mercado Pago y Tarjetas)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#121214] border border-zinc-700/60 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-zinc-400">Fondo Inicial $:</span>
                    <input
                      type="number"
                      value={initialCashInput}
                      onChange={(e) => {
                        setInitialCashInput(e.target.value);
                        handleCalculateShift(e.target.value);
                      }}
                      className="w-24 bg-transparent text-white font-black text-sm text-right focus:outline-hidden"
                    />
                  </div>
                  <button
                    onClick={() => handleCalculateShift()}
                    disabled={loadingShift}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#FF5A00] text-white hover:bg-[#e04f00] transition disabled:opacity-50"
                  >
                    {loadingShift ? 'Calculando...' : 'Recalcular'}
                  </button>
                </div>
              </div>

              {/* Tarjetas del Arqueo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#121214] border border-emerald-500/30 rounded-xl p-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Efectivo en Cajón Esperado</span>
                  <div className="mt-1.5 text-2xl font-black text-emerald-300">
                    ${Number(shiftSummary?.expected_cash_in_drawer || 0).toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    Fondo (${Number(shiftSummary?.initial_cash || 0).toLocaleString('es-AR')}) + Ventas ($
                    {Number(shiftSummary?.cash_sales || 0).toLocaleString('es-AR')})
                  </div>
                </div>

                <div className="bg-[#121214] border border-sky-500/30 rounded-xl p-4">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">QR / Mercado Pago</span>
                  <div className="mt-1.5 text-2xl font-black text-sky-300">
                    ${Number(shiftSummary?.transfer_sales || 0).toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">Transferencias y cobros con QR</div>
                </div>

                <div className="bg-[#121214] border border-purple-500/30 rounded-xl p-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tarjetas (POSnet)</span>
                  <div className="mt-1.5 text-2xl font-black text-purple-300">
                    ${Number(shiftSummary?.card_sales || 0).toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">Débito y Crédito procesadas</div>
                </div>

                <div className="bg-[#121214] border border-[#FF5A00]/40 rounded-xl p-4">
                  <span className="text-xs font-bold text-[#FF5A00] uppercase tracking-wider">Ventas Netas del Turno</span>
                  <div className="mt-1.5 text-2xl font-black text-white">
                    ${Number(shiftSummary?.total_sales || 0).toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {shiftSummary?.total_orders_paid || 0} pedidos cobrados
                  </div>
                </div>
              </div>
            </div>

            {/* Platos Estrella Más Vendidos */}
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⭐</span> Especialidades Más Vendidas de la Jornada
              </h3>

              {topItems.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Aún no se registraron ventas de platos en la jornada actual.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-[#121214] border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                          <span className="text-[#FF5A00]">#{idx + 1}</span>
                          <span>{item.category || 'Nano Lomos'}</span>
                        </div>
                        <div className="font-black text-white text-sm mt-0.5">{item.name}</div>
                        <div className="text-xs text-emerald-400 font-semibold mt-1">
                          ${Number(item.totalRevenue).toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className="bg-[#242429] px-3 py-1.5 rounded-lg border border-zinc-700/60 text-center">
                        <span className="text-lg font-black text-[#FF5A00]">{item.totalQuantity}</span>
                        <span className="block text-[10px] text-zinc-400 uppercase font-bold">Unidades</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: INSUMOS Y STOCK EN VIVO                            */}
        {/* ============================================================== */}
        {activeTab === 'inventario' && (
          <div className="space-y-6">
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>🥩</span> Estado del Inventario de Cocina en Tiempo Real
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Deducción automática según las recetas oficiales de cada plato vendido
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Buscar insumo (carne, pan, queso)..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="bg-[#121214] border border-zinc-700/60 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FF5A00] w-64"
                  />
                  <button
                    onClick={loadData}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#242429] text-zinc-300 hover:text-white transition"
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121214] text-zinc-400 font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Insumo</th>
                      <th className="p-3">Unidad</th>
                      <th className="p-3">Stock Actual</th>
                      <th className="p-3">Mínimo Seguridad</th>
                      <th className="p-3">Nivel de Stock</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {filteredInventory.map((ing) => {
                      const cur = Number(ing.current_stock || 0);
                      const min = Number(ing.min_stock || 0);
                      const ratio = min > 0 ? Math.min(100, Math.round((cur / (min * 2)) * 100)) : 100;
                      const isLow = cur < min;

                      return (
                        <tr key={ing.id} className="hover:bg-[#202025] transition">
                          <td className="p-3 font-bold text-white">{ing.name}</td>
                          <td className="p-3 text-zinc-400">{ing.unit}</td>
                          <td className="p-3 font-black text-sm text-white">
                            {cur} <span className="text-xs font-normal text-zinc-400">{ing.unit}</span>
                          </td>
                          <td className="p-3 text-zinc-400">
                            {min} {ing.unit}
                          </td>
                          <td className="p-3 w-40">
                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isLow ? 'bg-red-500' : cur < min * 1.5 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(5, ratio)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 font-bold text-[11px]">
                                ⚠️ Reponer
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                                ✓ Óptimo
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleOpenRestock(ing)}
                              className="px-2.5 py-1 rounded-lg bg-[#FF5A00]/15 hover:bg-[#FF5A00] text-[#FF5A00] hover:text-white border border-[#FF5A00]/30 text-xs font-bold transition"
                            >
                              + Reponer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Movimientos de Stock Recientes */}
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>📋</span> Movimientos Recientes de Inventario (Auditoría)
              </h3>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121214] text-zinc-400 font-bold border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Fecha/Hora</th>
                      <th className="p-2.5">Insumo</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Cantidad</th>
                      <th className="p-2.5">Detalle / Comanda</th>
                      <th className="p-2.5">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium text-zinc-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#202025]">
                        <td className="p-2.5 text-zinc-400">
                          {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('es-AR') : '-'}
                        </td>
                        <td className="p-2.5 font-bold text-white">{tx.ingredient_name || `#${tx.ingredient_id}`}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              tx.transaction_type === 'usage'
                                ? 'bg-amber-500/15 text-amber-300'
                                : tx.transaction_type === 'reversal'
                                ? 'bg-sky-500/15 text-sky-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="p-2.5 font-black text-white">
                          {Number(tx.quantity) > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                        </td>
                        <td className="p-2.5 text-zinc-400 truncate max-w-xs">{tx.notes || '-'}</td>
                        <td className="p-2.5 text-zinc-400">{tx.created_by || 'Sistema'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: PROYECCIÓN INTELIGENTE DE COMPRAS                  */}
        {/* ============================================================== */}
        {activeTab === 'proyeccion' && (
          <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A30] pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🛒</span> Proyección de Compra para el Próximo Servicio
                </h2>
                <p className="text-xs text-zinc-400">
                  Cálculo algorítmico basado en el consumo exacto de recetas del último turno sin quebrar stock
                </p>
              </div>

              <div className="bg-[#121214] border border-[#FF5A00]/40 rounded-xl px-4 py-2 text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Costo Total Estimado</span>
                <div className="text-xl font-black text-[#FF5A00]">
                  $
                  {projections
                    .reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0)
                    .toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121214] text-zinc-400 font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Insumo</th>
                    <th className="p-3">Stock Actual</th>
                    <th className="p-3">Consumido Último Turno</th>
                    <th className="p-3">Sugerido Comprar</th>
                    <th className="p-3">Costo Est. ($)</th>
                    <th className="p-3">Platos que lo demandaron</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {projections.map((proj) => (
                    <tr key={proj.id} className="hover:bg-[#202025]">
                      <td className="p-3 font-bold text-white">{proj.name}</td>
                      <td className="p-3">
                        <span className={proj.is_low_stock ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                          {proj.current_stock} {proj.unit}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300">
                        {proj.consumed_last_night} {proj.unit}
                      </td>
                      <td className="p-3">
                        {proj.suggested_to_buy > 0 ? (
                          <span className="text-emerald-400 font-black text-sm">
                            +{proj.suggested_to_buy} {proj.unit}
                          </span>
                        ) : (
                          <span className="text-zinc-500">Suficiente</span>
                        )}
                      </td>
                      <td className="p-3 text-zinc-300 font-semibold">
                        {proj.estimated_cost > 0 ? `$${proj.estimated_cost.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="p-3 text-zinc-400 text-[11px] max-w-xs truncate">
                        {proj.dishes_summary || 'Sin consumo reciente'}
                      </td>
                      <td className="p-3 text-right">
                        {proj.suggested_to_buy > 0 && (
                          <button
                            onClick={() => handleOpenRestock(proj)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition"
                          >
                            Pedir Insumo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: GESTIÓN DE CARTA OFICIAL Y PRECIOS                 */}
        {/* ============================================================== */}
        {activeTab === 'menu' && (
          <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A30] pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🍔</span> Carta Oficial de Nano Lomos ({menuItems.length} platos)
                </h2>
                <p className="text-xs text-zinc-400">
                  Ajuste instantáneo de precios y disponibilidad para POS Mostrador y Delivery
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Buscar especialidad..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="bg-[#121214] border border-zinc-700/60 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FF5A00] w-56"
                />
              </div>
            </div>

            {/* Selector de Categorías */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                    selectedCategory === cat
                      ? 'bg-[#FF5A00] text-white'
                      : 'bg-[#121214] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#FF5A00] uppercase tracking-wider">
                        {item.category || 'Nano Lomos'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {item.is_active ? 'Activo' : 'Pausado'}
                      </span>
                    </div>

                    <h4 className="font-black text-white text-base mt-1">{item.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.description || '-'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xl font-black text-white">
                      ${Number(item.price).toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => handleOpenEditPrice(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#242429] hover:bg-[#FF5A00] text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-bold transition"
                    >
                      ✏️ Editar Precio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 5: PERSONAL Y AUDITORÍA                               */}
        {/* ============================================================== */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>👥</span> Equipo de Trabajo de Nano Lomos
                  </h2>
                  <p className="text-xs text-zinc-400">Cajeros de mostrador, cocineros y supervisores activos</p>
                </div>

                <button
                  onClick={() => setCreateUserModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#FF5A00] text-white hover:bg-[#e04f00] text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#FF5A00]/20"
                >
                  <span>+</span> Dar de Alta Empleado
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121214] text-zinc-400 font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Último Ingreso</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {staffUsers.map((st) => (
                      <tr key={st.id} className="hover:bg-[#202025]">
                        <td className="p-3 font-bold text-white">{st.full_name}</td>
                        <td className="p-3 text-zinc-400">@{st.username}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              st.role === 'manager'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : st.role === 'cook'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {st.role === 'order_taker' ? 'Cajero Mostrador' : st.role}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{st.email || '-'}</td>
                        <td className="p-3 text-zinc-400">
                          {st.last_login_at ? new Date(st.last_login_at).toLocaleString('es-AR') : 'Nunca'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenResetPwd(st)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auditoría de Logins */}
            <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🛡️</span> Historial de Inicios de Sesión
              </h3>

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121214] text-zinc-400 font-bold border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Usuario</th>
                      <th className="p-2.5">Método</th>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium text-zinc-300">
                    {loginHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-[#202025]">
                        <td className="p-2.5 text-zinc-400">
                          {h.created_at ? new Date(h.created_at).toLocaleString('es-AR') : '-'}
                        </td>
                        <td className="p-2.5 font-bold text-white">{h.username || h.full_name || `#${h.user_id}`}</td>
                        <td className="p-2.5 text-zinc-400">{h.login_method}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-zinc-400">{h.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: INGRESO DE STOCK (RESTOCK)                              */}
      {/* ============================================================== */}
      {restockModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>🥩</span> Ingreso de Stock: {selectedIngredient.name}
            </h3>
            <p className="text-xs text-zinc-400">
              Stock actual: <strong className="text-white">{selectedIngredient.current_stock} {selectedIngredient.unit}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Cantidad a ingresar ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  placeholder="Ej: 10"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white font-bold focus:outline-hidden focus:border-[#FF5A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Notas / Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej: Carnicería Don Carlos remito #884"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white text-xs focus:outline-hidden focus:border-[#FF5A00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRestockModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRestock}
                disabled={savingRestock}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5A00] text-white hover:bg-[#e04f00] disabled:opacity-50"
              >
                {savingRestock ? 'Guardando...' : 'Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITAR PRECIO                                          */}
      {/* ============================================================== */}
      {priceModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white">Editar Precio: {selectedMenuItem.name}</h3>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Nuevo Precio ($)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white font-black text-lg focus:outline-hidden focus:border-[#FF5A00]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPriceModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdatePrice}
                disabled={savingPrice}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5A00] text-white hover:bg-[#e04f00] disabled:opacity-50"
              >
                {savingPrice ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ALTA DE EMPLEADO                                        */}
      {/* ============================================================== */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>👥</span> Dar de Alta Nuevo Empleado
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Lucas Gómez"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-[#FF5A00]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Usuario</label>
                <input
                  type="text"
                  placeholder="Ej: lucas.mostrador"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-[#FF5A00]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Rol Operativo</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-[#FF5A00]"
                >
                  <option value="order_taker">Cajero Mostrador / Pedidos (order_taker)</option>
                  <option value="cook">Cocinero (cook)</option>
                  <option value="manager">Gerente / Supervisor (manager)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white focus:outline-hidden focus:border-[#FF5A00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCreateUser}
                disabled={savingUser}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5A00] text-white hover:bg-[#e04f00] disabled:opacity-50"
              >
                {savingUser ? 'Creando...' : 'Crear Empleado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RESET PASSWORD                                         */}
      {/* ============================================================== */}
      {resetPwdModalOpen && selectedStaffUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#18181B] border border-[#2A2A30] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white">Resetear Clave: {selectedStaffUser.full_name}</h3>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={resetPwdInput}
                onChange={(e) => setResetPwdInput(e.target.value)}
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-2.5 text-white text-sm focus:outline-hidden focus:border-[#FF5A00]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResetPwdModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetPwd}
                disabled={savingResetPwd}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5A00] text-white hover:bg-[#e04f00] disabled:opacity-50"
              >
                {savingResetPwd ? 'Guardando...' : 'Actualizar Clave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
