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

type TabType = 'resumen' | 'proyeccion' | 'inventario' | 'menu' | 'personal';

export default function ManagerDashboard() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [user] = useState<User | null>(() => api.getUser());
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [wsConnected, setWsConnected] = useState<boolean>(() => !!wsClient.getSocket()?.connected);

  // Datos de estado
  const [report, setReport] = useState<DailyReport | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [projections, setProjections] = useState<PurchaseProjectionItem[]>([]);
  const [inventory, setInventory] = useState<IngredientItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);

  // Estado de Arqueo / Cierre de Caja
  const [shiftSummary, setShiftSummary] = useState<CashShiftSummary | null>(null);
  const [initialCashInput, setInitialCashInput] = useState<string>('10000');
  const [loadingShift, setLoadingShift] = useState(false);

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  // Modal para ingreso de stock (Restock)
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [savingRestock, setSavingRestock] = useState(false);

  // Modal para actualizar precio de plato
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Modal para crear nuevo empleado
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'order_taker' | 'waiter' | 'cook' | 'manager'>('order_taker');
  const [savingUser, setSavingUser] = useState(false);

  // Modal para resetear contraseña
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState<StaffUser | null>(null);
  const [resetPwdInput, setResetPwdInput] = useState('');
  const [savingResetPwd, setSavingResetPwd] = useState(false);

  // Modal para editar rol y privilegios de empleado
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editUserRole, setEditUserRole] = useState<string>('waiter');
  const [savingEditRole, setSavingEditRole] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Carga manual o reactiva de lista de empleados
  const loadStaff = useCallback(async () => {
    try {
      setLoadingStaff(true);
      const staff = await api.getUsers(true);
      setStaffUsers(Array.isArray(staff) ? staff : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar lista de empleados';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  // Redirigir si no hay sesión o no es gerente/admin
  useEffect(() => {
    const currentUser = api.getUser();
    if (!currentUser) {
      startTransition(() => router.replace('/login'));
      return;
    }
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
      startTransition(() => router.replace('/waiter'));
    }
  }, [router]);

  // Carga general de datos según pestaña
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedReport, fetchedTop, fetchedProj, fetchedInv, fetchedTrans, fetchedMenu, fetchedStaff, fetchedHistory] =
        await Promise.all([
          api.getDailyReport().catch(() => null),
          api.getTopSellingItems(6).catch(() => []),
          api.getPurchaseProjection().catch(() => []),
          api.getInventory().catch(() => []),
          api.getStockTransactions(20).catch(() => []),
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

      // Cargar arqueo inicial
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
    let active = true;
    (async () => {
      try {
        const [fetchedReport, fetchedTop, fetchedProj, fetchedInv, fetchedTrans, fetchedMenu, fetchedStaff, fetchedHistory] =
          await Promise.all([
            api.getDailyReport().catch(() => null),
            api.getTopSellingItems(6).catch(() => []),
            api.getPurchaseProjection().catch(() => []),
            api.getInventory().catch(() => []),
            api.getStockTransactions(20).catch(() => []),
            api.getMenu(undefined, true).catch(() => []),
            api.getUsers(true).catch(() => []),
            api.getLoginHistory(undefined, 25).catch(() => []),
          ]);
        if (!active) return;
        setReport(fetchedReport);
        setTopItems(fetchedTop);
        setProjections(fetchedProj);
        setInventory(fetchedInv);
        setTransactions(fetchedTrans);
        setMenuItems(fetchedMenu);
        setStaffUsers(fetchedStaff);
        setLoginHistory(fetchedHistory);
        const shift = await api.getCashShiftSummary(10000).catch(() => null);
        if (!active) return;
        if (shift) setShiftSummary(shift);
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Error al cargar datos del panel';
        setFeedback({ text: msg, type: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Conexión y suscripciones WebSocket en tiempo real para gerentes
    const socket = wsClient.connect();
    if (socket) {
      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));
    }

    const unsubCreated = wsClient.on('order:created', () => {
      loadData();
    });

    const unsubStatus = wsClient.on('order:status_changed', () => {
      loadData();
    });

    const unsubStock = wsClient.on('stock:low_alert', (data: unknown) => {
      loadData();
      const alertData = data as { name?: string; current_stock?: number; min_stock?: number } | null;
      if (alertData?.name) {
        setFeedback({
          text: `⚠️ Alerta de stock crítico: ${alertData.name} tiene solo ${alertData.current_stock} unidades (mínimo ${alertData.min_stock})`,
          type: 'error',
        });
      }
    });

    const interval = setInterval(loadData, 30000);
    return () => {
      active = false;
      clearInterval(interval);
      unsubCreated();
      unsubStatus();
      unsubStock();
    };
  }, [loadData]);

  const handleLogout = async () => {
    await api.logout();
    startTransition(() => router.replace('/login'));
  };

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
        text: `Precio de "${selectedMenuItem.name}" actualizado a \$${Number(newPrice).toLocaleString('es-AR')}`,
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

  const handleToggleItemStatus = async (item: MenuItem) => {
    try {
      const newStatus = !item.is_active;
      await api.updateMenuItem(item.id, { is_active: newStatus });
      setFeedback({
        text: `Plato "${item.name}" ${newStatus ? 'activado' : 'pausado'} en el menú`,
        type: 'success',
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del plato';
      setFeedback({ text: msg, type: 'error' });
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword || !newFullName) {
      setFeedback({ text: 'Usuario, nombre completo y contraseña son requeridos', type: 'error' });
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
      setFeedback({
        text: `Empleado "${newFullName}" creado exitosamente con rol ${newRole}`,
        type: 'success',
      });
      setCreateUserModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear empleado';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStaffUser || !resetPwdInput || resetPwdInput.length < 6) {
      setFeedback({ text: 'La nueva contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    try {
      setSavingResetPwd(true);
      await api.resetUserPassword(selectedStaffUser.id, resetPwdInput);
      setFeedback({
        text: `Contraseña de "${selectedStaffUser.full_name}" restablecida con éxito`,
        type: 'success',
      });
      setResetPwdModalOpen(false);
      setResetPwdInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer contraseña';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingResetPwd(false);
    }
  };

  const handleToggleUserStatus = async (staff: StaffUser) => {
    try {
      await api.toggleUserStatus(staff.id);
      setFeedback({
        text: `Estado de "${staff.full_name}" actualizado a ${!staff.is_active ? 'Activo' : 'Suspendido'}`,
        type: 'success',
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado de empleado';
      setFeedback({ text: msg, type: 'error' });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedStaffUser) return;
    try {
      setSavingEditRole(true);
      await api.updateUser(selectedStaffUser.id, { role: editUserRole });
      setFeedback({
        text: `Rol de "${selectedStaffUser.full_name}" actualizado a ${editUserRole.toUpperCase()} con éxito.`,
        type: 'success',
      });
      setEditRoleModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar rol de empleado';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setSavingEditRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Header Corporativo NANO LOMOS */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-nanolomos.png"
              alt="Nano Lomos Logo"
              className="h-10 w-auto object-contain rounded-lg border border-slate-200 bg-slate-900 p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-slate-900 text-base uppercase">NANO LOMOS</span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Panel Gerencial
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-full flex items-center gap-1 ${
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
              <p className="text-xs text-slate-500 font-medium">Control operativo, compras y stock en tiempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span suppressHydrationWarning className="text-xs font-bold text-slate-900">{user?.fullName || 'Gerente'}</span>
              <span suppressHydrationWarning className="text-[11px] text-slate-500 capitalize font-medium">{user?.role || 'Manager'}</span>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              🔄
            </button>
            <button
              onClick={() => router.push('/order-taker')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Ir a pantalla de Cajero Mostrador"
            >
              <span>🛍️</span> Mostrador
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto border-t border-slate-200 pt-3">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'resumen'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            📊 Ventas y Operación
          </button>
          <button
            onClick={() => setActiveTab('proyeccion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'proyeccion'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            🛒 Proyección de Compras
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'inventario'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            📦 Inventario y Stock
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            🍔 Menú y Precios
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            👥 Personal y Equipo
          </button>
        </div>
      </header>

      {/* Banner de Feedback */}
      {feedback && (
        <div
          className={`px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
              : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {loading && !report ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">Sincronizando información de NANO LOMOS...</p>
          </div>
        ) : (
          <>
            {/* ================= PESTAÑA: RESUMEN DE VENTAS Y OPERACIÓN ================= */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                {/* Métricas Principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-[#e8e3d9] shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block mb-1">Recaudación de Hoy</span>
                    <div className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
                      ${report?.total_revenue?.toLocaleString('es-AR') || '0'}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      {report?.paid_orders || 0} pedidos cobrados
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e8e3d9] shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block mb-1">Total Comandas</span>
                    <div className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
                      {report?.total_orders || 0}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      {report?.in_progress_orders || 0} en preparación
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e8e3d9] shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block mb-1">Tiempo Prom. Cocina</span>
                    <div className="text-2xl sm:text-3xl font-serif font-black text-stone-800">
                      {report?.avg_completion_time_minutes || 0} min
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">Desde ingreso hasta despacho</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e8e3d9] shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block mb-1">Pedidos Demorados (&gt;20m)</span>
                    <div
                      className={`text-2xl sm:text-3xl font-serif font-black ${
                        (report?.delayed_orders_count || 0) > 0 ? 'text-rose-700' : 'text-stone-700'
                      }`}
                    >
                      {report?.delayed_orders_count || 0}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">Requieren atención en cocina</span>
                  </div>
                </div>

                {/* Gráficos / Tableros de Estado y Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Desglose de Estado de Comandas */}
                  <div className="p-5 rounded-xl bg-white border border-[#e8e3d9] shadow-xs">
                    <h3 className="font-serif font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
                      <span>⏱️ Estado de Comandas Hoy</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-[#e8e3d9]">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-stone-400" />
                          <span className="text-sm font-medium text-stone-700">Pendientes en Cocina</span>
                        </div>
                        <span className="font-black text-stone-900">{report?.pending_orders || 0}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-[#e8e3d9]">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-amber-600" />
                          <span className="text-sm font-medium text-stone-700">En Preparación / Fuego</span>
                        </div>
                        <span className="font-black text-stone-900">{report?.in_progress_orders || 0}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-[#e8e3d9]">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-[#1e3a2f]" />
                          <span className="text-sm font-medium text-stone-700">Listas para Entregar</span>
                        </div>
                        <span className="font-black text-stone-900">{report?.ready_orders || 0}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-[#e8e3d9]">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-slate-600" />
                          <span className="text-sm font-medium text-stone-700">Entregadas a la Mesa</span>
                        </div>
                        <span className="font-black text-stone-900">{report?.delivered_orders || 0}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-[#e8e3d9]">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-stone-500" />
                          <span className="text-sm font-medium text-stone-700">Cobradas / Finalizadas</span>
                        </div>
                        <span className="font-black text-[#1e3a2f]">{report?.paid_orders || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ranking de Platos Más Vendidos */}
                  <div className="p-5 rounded-xl bg-white border border-[#e8e3d9] shadow-xs">
                    <h3 className="font-serif font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
                      <span>🏆 Platos Más Vendidos (Hoy)</span>
                    </h3>
                    {topItems.length === 0 ? (
                      <p className="text-sm text-stone-500 italic py-8 text-center">
                        Aún no se registraron ventas en la jornada de hoy.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {topItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-[#e8e3d9]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-6 w-6 rounded-full bg-[#f2ece2] text-stone-700 border border-[#e8e3d9] flex items-center justify-center text-xs font-bold">
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-stone-900">{item.name}</h4>
                                <span className="text-[11px] text-stone-500">{item.category || 'General'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-stone-900">{item.totalQuantity} vendidos</div>
                              <div className="text-xs text-stone-700 font-serif font-bold">
                                ${(item.totalRevenue).toLocaleString('es-AR')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Desglose por Método de Pago */}
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>💳</span>
                      <span>Ingresos por Medio de Pago (Hoy)</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Total: ${(report?.total_revenue || 0).toLocaleString('es-AR')}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>💵</span> Efectivo
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          Caja Física
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        ${(report?.payment_breakdown?.cash || 0).toLocaleString('es-AR')}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">Dinero recibido en mano</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>💳</span> Tarjetas
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          Posnet / Bancario
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        ${(report?.payment_breakdown?.card || 0).toLocaleString('es-AR')}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">Débito y crédito en lote</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📱</span> Transferencia / MP
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          Virtual / QR
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        ${(report?.payment_breakdown?.transfer || 0).toLocaleString('es-AR')}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">Acreditación por comprobante</span>
                    </div>
                  </div>
                </div>

                {/* Arqueo y Cierre de Turno de Caja */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <h3 className="font-extrabold text-slate-900 text-lg">Arqueo y Cierre de Turno de Caja</h3>
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          CONTROL EN VIVO
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Auditoría de cajón de dinero, conciliación de cobranzas físicas y balance del turno.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCalculateShift(initialCashInput)}
                        disabled={loadingShift}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-300 disabled:opacity-50 cursor-pointer"
                      >
                        <span>🔄 Recalcular Arqueo</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <span>🖨️ Imprimir Cierre de Turno</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Parámetros de Fondo Inicial */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Fondo de Caja Inicial ($):
                        </label>
                        <p className="text-[11px] text-slate-500 mb-3">
                          Cambio o saldo inicial con el que arrancó el cajón.
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">$</span>
                          <input
                            type="number"
                            value={initialCashInput}
                            onChange={(e) => setInitialCashInput(e.target.value)}
                            onBlur={() => handleCalculateShift(initialCashInput)}
                            placeholder="10000"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                        Presiona enter o haz clic afuera para recalcular automáticamente.
                      </div>
                    </div>

                    {/* Resumen del Cajón (Efectivo Esperado) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Efectivo Esperado en Cajón
                          </span>
                          <span className="text-lg">💵</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2">
                          (Fondo Inicial + Ventas en Efectivo)
                        </p>
                        <div className="text-3xl font-black text-slate-900">
                          ${(shiftSummary?.expected_cash_in_drawer || (parseFloat(initialCashInput) || 0) + (report?.payment_breakdown?.cash || 0)).toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                        {shiftSummary?.total_orders_paid || report?.paid_orders || 0} pedidos cobrados en total
                      </div>
                    </div>

                    {/* Desglose Contable Completo */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex justify-between">
                        <span>Concepto Contable</span>
                        <span>Monto</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Fondo Inicial:</span>
                        <span className="font-mono text-slate-900 font-semibold">
                          ${(shiftSummary?.initial_cash ?? parseFloat(initialCashInput) ?? 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ Ventas Efectivo:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(shiftSummary?.cash_sales ?? report?.payment_breakdown?.cash ?? 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ Ventas Tarjetas:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(shiftSummary?.card_sales ?? report?.payment_breakdown?.card ?? 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>+ Ventas Transferencias:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ${(shiftSummary?.transfer_sales ?? report?.payment_breakdown?.transfer ?? 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                        <span>Total Facturado:</span>
                        <span className="text-slate-900 font-mono">
                          ${(shiftSummary?.total_sales ?? report?.total_revenue ?? 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PESTAÑA: PROYECCIÓN DE COMPRAS ================= */}
            {activeTab === 'proyeccion' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Plan de Reposición por Consumo de Noche Anterior</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Calculado automáticamente según recetas de los platos vendidos en el último turno (carne, pan, huevo, queso, vegetales) contra el stock disponible.
                    </p>
                    {projections[0]?.reference_shift && (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        🌙 Turno de referencia: {projections[0].reference_shift}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Costo estimado total de compra:</span>
                    <span className="text-xl font-black text-slate-900">
                      $
                      {projections
                        .reduce((acc, curr) => acc + curr.estimated_cost, 0)
                        .toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Insumo</th>
                        <th className="px-4 py-3">Stock Actual</th>
                        <th className="px-4 py-3">Mínimo</th>
                        <th className="px-4 py-3 text-slate-700 font-bold">Consumo Noche Anterior</th>
                        <th className="px-4 py-3 text-slate-900 font-bold">Sugerido Comprar</th>
                        <th className="px-4 py-3">Costo Estimado</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {projections.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.is_low_stock ? 'bg-rose-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              {item.is_low_stock && (
                                <span className="h-2 w-2 rounded-full bg-rose-500" title="Stock insuficiente para cubrir la noche o bajo mínimo" />
                              )}
                              <span>{item.name}</span>
                            </div>
                            {item.dishes_summary && (
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate max-w-xs" title={item.dishes_summary}>
                                Receta en: {item.dishes_summary}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.current_stock} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.min_stock} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">
                            {item.consumed_last_night ?? item.consumed_today} {item.unit}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900">
                            {item.suggested_to_buy > 0 ? `${item.suggested_to_buy} ${item.unit}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">
                            {item.estimated_cost > 0 ? `$${item.estimated_cost.toLocaleString('es-AR')}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenRestock(item)}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                            >
                              + Cargar Ingreso
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= PESTAÑA: INVENTARIO ================= */}
            {activeTab === 'inventario' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Inventario de Materia Prima</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Monitoreo de ingredientes, stock mínimo y registro de ingresos por compra.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                      {inventory.filter((i) => i.is_low_stock).length} Insumos Críticos
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        item.is_low_stock
                          ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                          {item.is_low_stock && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                              Stock Bajo
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">Stock Actual</span>
                            <span
                              className={`text-lg font-black ${
                                item.is_low_stock ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {item.current_stock}
                            </span>
                            <span className="text-slate-500 text-[10px] ml-1">{item.unit}</span>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">Stock Mínimo</span>
                            <span className="text-lg font-bold text-slate-700">{item.min_stock}</span>
                            <span className="text-slate-500 text-[10px] ml-1">{item.unit}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 mb-3">
                          Costo Unitario: <span className="font-bold text-slate-800">${item.unit_cost}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenRestock(item)}
                        className="w-full mt-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        📦 Registrar Ingreso / Compra
                      </button>
                    </div>
                  ))}
                </div>

                {/* Movimientos Recientes */}
                <div className="mt-8 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-base mb-4">Últimos Movimientos de Stock</h3>
                  <div className="divide-y divide-slate-200">
                    {transactions.slice(0, 8).map((t) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{t.ingredient_name || `Insumo #${t.ingredient_id}`}</span>
                          <span className="text-slate-500 ml-2">{t.notes}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-black ${
                              t.transaction_type === 'restock' ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {t.unit}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            {new Date(t.created_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= PESTAÑA: MENÚ Y PRECIOS ================= */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Carta y Precios de NANO LOMOS</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Actualización de precios al instante y activación o pausa de platos en la comanda.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {menuItems.length} platos en carta
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {item.is_active ? 'Disponible' : 'Pausado'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 font-semibold mb-2 block">
                          {item.category || 'General'}
                        </span>
                        {item.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>
                        )}
                        <div className="text-xl font-black text-slate-900 my-2">
                          ${Number(item.price).toLocaleString('es-AR')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => handleOpenEditPrice(item)}
                          className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✏️ Modificar Precio
                        </button>
                        <button
                          onClick={() => handleToggleItemStatus(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            item.is_active
                              ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {item.is_active ? 'Pausar' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PESTAÑA: PERSONAL Y EQUIPO ================= */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Gestión de Personal de NANO LOMOS</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Administración de mozos, cocineros y administradores. Modificá los roles para probar los accesos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={loadStaff}
                      disabled={loadingStaff}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300"
                      title="Recargar lista de usuarios desde la base de datos"
                    >
                      <span className={loadingStaff ? 'animate-spin' : ''}>🔄</span> {loadingStaff ? 'Cargando...' : 'Actualizar'}
                    </button>
                    <button
                      onClick={() => {
                        setNewUsername('');
                        setNewFullName('');
                        setNewEmail('');
                        setNewPassword('');
                        setNewRole('waiter');
                        setCreateUserModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>➕</span> Nuevo Empleado
                    </button>
                  </div>
                </div>

                {loadingStaff ? (
                  <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className="inline-block animate-spin text-2xl mb-2">🔄</div>
                    <p className="text-sm font-bold text-slate-700">Cargando lista de empleados...</p>
                    <p className="text-xs text-slate-400 mt-1">Conectando con la base de datos de NANO LOMOS</p>
                  </div>
                ) : staffUsers.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-4xl block mb-3">👥</span>
                    <h4 className="font-black text-slate-800 text-base">No se visualizaron empleados</h4>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                      Puede haber ocurrido que tu sesión expiró o la consulta tardó en responder. Podés recargar ahora o volver a ingresar.
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <button
                        onClick={loadStaff}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                      >
                        <span>🔄</span> Reintentar Carga
                      </button>
                      <button
                        onClick={() => router.replace('/login')}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                      >
                        Reingresar con Admin
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffUsers.map((staff) => (
                      <div
                        key={staff.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                          staff.is_active ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                                {staff.full_name}
                                {staff.provider === 'google' && (
                                  <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-normal" title="Autenticado con Google">
                                    Google
                                  </span>
                                )}
                              </h4>
                              <span className="text-xs text-slate-500 font-mono">@{staff.username}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                staff.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {staff.is_active ? 'Activo' : 'Suspendido'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 my-2">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-bold rounded-md flex items-center gap-1 ${
                                staff.role === 'manager' || staff.role === 'admin'
                                  ? 'bg-slate-800 text-white'
                                  : staff.role === 'order_taker'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : staff.role === 'cook'
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {staff.role === 'manager' || staff.role === 'admin'
                                ? '👑 Gerente / Admin'
                                : staff.role === 'order_taker'
                                ? '🛍️ Cajero Mostrador'
                                : staff.role === 'cook'
                                ? '👨‍🍳 Cocina / KDS'
                                : '🍽️ Mozo (Salón)'}
                            </span>
                            {staff.email && (
                              <span className="text-xs text-slate-500 truncate max-w-[200px]" title={staff.email}>
                                ✉️ {staff.email}
                              </span>
                            )}
                          </div>

                          {staff.last_login_at && (
                            <p className="text-[11px] text-slate-400 mt-2">
                              Último acceso: {new Date(staff.last_login_at).toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => {
                              setSelectedStaffUser(staff);
                              setEditUserRole(staff.role);
                              setEditRoleModalOpen(true);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>🛡️</span> Rol / Permisos
                          </button>
                          {staff.provider !== 'google' && (
                            <button
                              onClick={() => {
                                setSelectedStaffUser(staff);
                                setResetPwdInput('');
                                setResetPwdModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                              title="Cambiar contraseña local"
                            >
                              🔑 Clave
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleUserStatus(staff)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              staff.is_active
                                ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {staff.is_active ? 'Suspender' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Historial de Accesos Recientes */}
                <div className="mt-8 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                    <span>📋 Historial de Ingresos al Sistema</span>
                  </h3>
                  {loginHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No hay registros de ingresos recientes.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {loginHistory.slice(0, 10).map((h) => (
                        <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{h.full_name || h.username || 'Usuario'}</span>
                            <span className="text-slate-500 ml-2">Método: {h.login_method}</span>
                            {h.ip_address && <span className="text-slate-400 ml-2 font-mono text-[11px]">IP: {h.ip_address}</span>}
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                h.status === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {h.status === 'success' ? 'Exitoso' : 'Fallido'}
                            </span>
                            <span className="text-slate-400 text-[10px] block mt-0.5">
                              {new Date(h.created_at).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: Ingreso de Mercadería / Reabastecimiento */}
      {restockModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">Registrar Ingreso de Stock</h3>
            <p className="text-xs text-slate-500 mb-4">
              Insumo: <span className="text-slate-800 font-bold">{selectedIngredient.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cantidad a ingresar ({selectedIngredient.unit}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder={`Ej: 20 ${selectedIngredient.unit}`}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-lg focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nota / Proveedor (opcional):
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Ej: Factura #1234 - Frigorífico Central"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Stock actual: <strong className="text-slate-900">{selectedIngredient.current_stock} {selectedIngredient.unit}</strong> →{' '}
                Nuevo stock estimado:{' '}
                <strong className="text-slate-900">
                  {selectedIngredient.current_stock + (Number(restockQty) || 0)} {selectedIngredient.unit}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setRestockModalOpen(false)}
                disabled={savingRestock}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRestock}
                disabled={savingRestock}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {savingRestock ? 'Guardando...' : 'Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Modificar Precio de Plato */}
      {priceModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">Modificar Precio de Plato</h3>
            <p className="text-xs text-slate-500 mb-4">
              Plato: <span className="text-slate-800 font-bold">{selectedMenuItem.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nuevo Precio ($):</label>
                <input
                  type="number"
                  step="50"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Ej: 5500"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-lg focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setPriceModalOpen(false)}
                disabled={savingPrice}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpdatePrice}
                disabled={savingPrice}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {savingPrice ? 'Guardando...' : 'Actualizar Precio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear Nuevo Empleado */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">Nuevo Empleado</h3>
            <p className="text-xs text-slate-500 mb-4">
              Crea una cuenta para mozo, cocinero o gerente con credenciales de acceso.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Usuario de Acceso:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ej: juan.mozo"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email (opcional):</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="juan@nanolomos.com"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña Inicial:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Puesto / Rol:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'order_taker' | 'waiter' | 'cook' | 'manager')}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                >
                  <option value="order_taker">🛍️ Cajero Mostrador (Pedidos, Asignación, WhatsApp)</option>
                  <option value="waiter">🍽️ Mozo de Salón (Solo mesas del salón)</option>
                  <option value="cook">👨‍🍳 Cocinero / KDS</option>
                  <option value="manager">👑 Gerente / Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setCreateUserModalOpen(false)}
                disabled={savingUser}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={savingUser}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {savingUser ? 'Creando...' : 'Crear Empleado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resetear Contraseña */}
      {resetPwdModalOpen && selectedStaffUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">Restablecer Contraseña</h3>
            <p className="text-xs text-slate-500 mb-4">
              Empleado: <span className="text-slate-800 font-bold">{selectedStaffUser.full_name}</span> (@{selectedStaffUser.username})
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nueva Contraseña:</label>
                <input
                  type="password"
                  value={resetPwdInput}
                  onChange={(e) => setResetPwdInput(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setResetPwdModalOpen(false)}
                disabled={savingResetPwd}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={savingResetPwd}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {savingResetPwd ? 'Guardando...' : 'Guardar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Modificar Rol y Privilegios */}
      {editRoleModalOpen && selectedStaffUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡️</span>
              <h3 className="text-lg font-black text-slate-900">Privilegios y Rol de Usuario</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Empleado: <span className="text-slate-800 font-bold">{selectedStaffUser.full_name}</span> (@{selectedStaffUser.username})
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Seleccionar Perfil de Acceso:</label>
                <div className="space-y-2">
                  <label
                    onClick={() => setEditUserRole('manager')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      editUserRole === 'manager' || editUserRole === 'admin'
                        ? 'bg-slate-100 border-slate-400'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleOption"
                      checked={editUserRole === 'manager' || editUserRole === 'admin'}
                      onChange={() => setEditUserRole('manager')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>👑 Gerente / Administrador</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Acceso total a ventas, arqueo de caja, stock, recetas, precios y gestión de usuarios.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setEditUserRole('order_taker')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      editUserRole === 'order_taker'
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleOption"
                      checked={editUserRole === 'order_taker'}
                      onChange={() => setEditUserRole('order_taker')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>🛍️ Cajero Mostrador (Principal)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Toma de pedidos en mostrador, asignación directa a cocineros, seguimiento de demoras y WhatsApp con clientes.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setEditUserRole('waiter')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      editUserRole === 'waiter'
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleOption"
                      checked={editUserRole === 'waiter'}
                      onChange={() => setEditUserRole('waiter')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>🍽️ Mozo de Salón</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Atención exclusiva de mesas del salón (vista reservada para cuando se habiliten mesas).
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setEditUserRole('cook')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      editUserRole === 'cook'
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleOption"
                      checked={editUserRole === 'cook'}
                      onChange={() => setEditUserRole('cook')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>👨‍🍳 Cocinero / KDS</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pantalla de cocina, toma de comandas, despacho de platos y consulta de recetas.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setEditRoleModalOpen(false)}
                disabled={savingEditRole}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={savingEditRole}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                {savingEditRole ? 'Guardando...' : 'Aplicar Privilegios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
