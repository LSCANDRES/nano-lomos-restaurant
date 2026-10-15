const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007/api';

export interface User {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  role: 'order_taker' | 'waiter' | 'cook' | 'manager' | 'admin';
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

class ApiClient {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  setTokens(accessToken: string, refreshToken: string, user: User) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });
        if (!response.ok) {
          this.clearAuth();
          return null;
        }
        const data = await response.json();
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
          return data.accessToken as string;
        }
        this.clearAuth();
        return null;
      } catch {
        this.clearAuth();
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Si devuelve 401 y no es login/refresh, intentamos refrescar el token
    if (
      response.status === 401 &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/refresh') &&
      !endpoint.startsWith('/auth/google')
    ) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      } else {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en la solicitud: ${response.statusText}`);
    }

    return response.json();
  }

  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken, data.user);
    return data;
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    this.setTokens(data.accessToken, data.refreshToken, data.user);
    return data;
  }

  async me(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  }

  // ==================== MESAS ====================
  async getTables(includeInactive = false): Promise<Table[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return this.request<Table[]>(`/tables${query}`);
  }

  async createTable(data: Partial<Table>): Promise<Table> {
    return this.request<Table>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTable(id: number, data: Partial<Table>): Promise<Table> {
    return this.request<Table>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTable(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tables/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== MENÚ ====================
  async getMenu(category?: string, includeInactive = false): Promise<MenuItem[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (includeInactive) params.append('includeInactive', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<MenuItem[]>(`/menu${query}`);
  }

  async getMenuItem(id: number): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/${id}`);
  }

  async createMenuItem(data: Partial<MenuItem>): Promise<MenuItem> {
    return this.request<MenuItem>('/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(id: number, data: Partial<MenuItem>): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/menu/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== PEDIDOS / COMANDAS ====================
  async createOrder(data: {
    customerId?: number;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    orderType?: 'mostrador' | 'takeaway' | 'delivery' | 'salon';
    tableId?: number;
    tableNumber?: string;
    items: OrderItemInput[];
    paymentMethod?: string;
    paymentNotes?: string;
  }): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params: { status?: string; tableId?: number } = {}): Promise<Order[]> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.tableId) searchParams.append('tableId', params.tableId.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<Order[]>(`/orders${query}`);
  }

  async getOrderById(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async deliverOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}/deliver`, { method: 'PATCH' });
  }

  async payOrder(id: number, paymentMethod: string = 'efectivo', notes?: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentMethod, notes }),
    });
  }

  async cancelOrder(id: number, reason: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getAvailableCooks(): Promise<AvailableCook[]> {
    return this.request<AvailableCook[]>('/orders/cooks');
  }

  async assignCookToOrder(orderId: number, cookId: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/assign-cook`, {
      method: 'PATCH',
      body: JSON.stringify({ cookId }),
    });
  }

  // ==================== COCINA (KDS) ====================
  async getKitchenQueue(): Promise<Order[]> {
    return this.request<Order[]>('/kitchen/queue');
  }

  async getKitchenMyOrders(): Promise<Order[]> {
    return this.request<Order[]>('/kitchen/my-orders');
  }

  async getKitchenReadyOrders(): Promise<Order[]> {
    return this.request<Order[]>('/kitchen/ready');
  }

  async takeKitchenOrder(orderId: number): Promise<Order> {
    return this.request<Order>(`/kitchen/orders/${orderId}/take`, { method: 'PATCH' });
  }

  async startKitchenOrder(orderId: number): Promise<Order> {
    return this.request<Order>(`/kitchen/orders/${orderId}/start`, { method: 'PATCH' });
  }

  async completeKitchenOrder(orderId: number): Promise<Order> {
    return this.request<Order>(`/kitchen/orders/${orderId}/complete`, { method: 'PATCH' });
  }

  async getKitchenRecipe(menuItemId: number): Promise<DishRecipe> {
    return this.request<DishRecipe>(`/kitchen/recipes/${menuItemId}`);
  }

  // ==================== REPORTES / GERENTE ====================
  async getDailyReport(date?: string): Promise<DailyReport> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<DailyReport>(`/reports/daily${query}`);
  }

  async getCashShiftSummary(initialCash: number = 0, date?: string): Promise<CashShiftSummary> {
    const queryParams = new URLSearchParams();
    if (initialCash) queryParams.append('initialCash', initialCash.toString());
    if (date) queryParams.append('date', date);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<CashShiftSummary>(`/reports/cash-shift${query}`);
  }

  async getTopSellingItems(limit = 5): Promise<TopSellingItem[]> {
    return this.request<TopSellingItem[]>(`/reports/top-items?limit=${limit}`);
  }

  async getPurchaseProjection(): Promise<PurchaseProjectionItem[]> {
    return this.request<PurchaseProjectionItem[]>('/reports/purchase-projection');
  }

  // ==================== INVENTARIO ====================
  async getInventory(): Promise<IngredientItem[]> {
    return this.request<IngredientItem[]>('/inventory');
  }

  async restockIngredient(ingredientId: number, quantity: number, notes?: string): Promise<IngredientItem> {
    return this.request<IngredientItem>('/inventory/restock', {
      method: 'POST',
      body: JSON.stringify({ ingredientId, quantity, notes }),
    });
  }

  async getStockTransactions(limit = 50): Promise<StockTransaction[]> {
    return this.request<StockTransaction[]>(`/inventory/transactions?limit=${limit}`);
  }

  // ==================== PERSONAL / EMPLEADOS ====================
  async getUsers(includeInactive = true): Promise<StaffUser[]> {
    return this.request<StaffUser[]>(`/users?includeInactive=${includeInactive}`);
  }

  async createUser(data: {
    username: string;
    email?: string;
    password: string;
    fullName: string;
    role: string;
  }): Promise<StaffUser> {
    return this.request<StaffUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: Partial<{
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>): Promise<StaffUser> {
    return this.request<StaffUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resetUserPassword(id: number, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  }

  async toggleUserStatus(id: number): Promise<{ id: number; username: string; is_active: boolean }> {
    return this.request<{ id: number; username: string; is_active: boolean }>(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async getLoginHistory(userId?: number, limit = 50): Promise<LoginHistoryItem[]> {
    const query = userId ? `?userId=${userId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<LoginHistoryItem[]>(`/users/history${query}`);
  }

  // ==================== WHATSAPP GATEWAY (QR Y MENSAJES) ====================
  async getWhatsAppStatus(): Promise<WhatsAppStatus> {
    return this.request<WhatsAppStatus>('/whatsapp/status');
  }

  async getWhatsAppQR(phone: string = '3804200387'): Promise<{ qrCodeDataUrl: string; targetNumber: string }> {
    return this.request<{ qrCodeDataUrl: string; targetNumber: string }>(`/whatsapp/qr?phone=${encodeURIComponent(phone)}`);
  }

  async connectWhatsApp(phone?: string): Promise<{ status: string; connectedNumber: string }> {
    return this.request<{ status: string; connectedNumber: string }>('/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async disconnectWhatsApp(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/whatsapp/disconnect', {
      method: 'POST',
    });
  }

  async getWhatsAppMessages(): Promise<WhatsAppMessage[]> {
    return this.request<WhatsAppMessage[]>('/whatsapp/messages');
  }

  async sendWhatsAppMessage(phone: string, text: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, text }),
    });
  }

  async simulateWhatsAppIncoming(data: { phone?: string; senderName?: string; text: string }): Promise<WhatsAppMessage> {
    return this.request<WhatsAppMessage>('/whatsapp/simulate-incoming', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markWhatsAppConverted(id: string, orderId?: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/whatsapp/messages/${id}/converted`, {
      method: 'PATCH',
      body: JSON.stringify({ orderId }),
    });
  }
}

export interface WhatsAppMessage {
  id: string;
  phone: string;
  senderName: string;
  text: string;
  timestamp: string;
  isConverted: boolean;
  orderId?: number | null;
}

export interface WhatsAppStatus {
  status: 'disconnected' | 'qr_ready' | 'connected';
  targetNumber: string;
  connectedNumber: string | null;
  qrCodeDataUrl: string | null;
  messagesCount: number;
  unconvertedCount: number;
}

export interface StaffUser {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  role: 'waiter' | 'order_taker' | 'cook' | 'manager' | 'admin';
  provider?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginHistoryItem {
  id: number;
  user_id: number;
  username?: string;
  full_name?: string;
  role?: string;
  login_method: string;
  ip_address?: string | null;
  user_agent?: string | null;
  status: string;
  failure_reason?: string | null;
  created_at: string;
}

export interface Table {
  id: number;
  number: string;
  name: string;
  capacity: number;
  position_x?: number;
  position_y?: number;
  is_active: boolean;
  status: 'libre' | 'pendiente' | 'cocinando' | 'para_entregar';
  currentOrder?: {
    id: number;
    status: string;
    total_amount: number;
    created_at: string;
  } | null;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  recipeCount: number;
  isAvailable: boolean;
  missingIngredients?: Array<{
    name: string;
    required: number;
    current: number;
    unit: string;
  }>;
}

export interface OrderItemInput {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

export interface OrderLine {
  id: number;
  menu_item_id: number;
  quantity: number;
  unit_price?: number;
  notes?: string | null;
  menu_items: {
    id?: number;
    name: string;
    category?: string | null;
    image_url?: string | null;
  };
}

export interface AvailableCook {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  activeOrdersCount: number;
}

export interface Order {
  id: number;
  table_id?: number | null;
  table_number?: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'ready_to_deliver' | 'delivered' | 'paid' | 'cancelled';
  order_type?: 'mostrador' | 'takeaway' | 'delivery' | 'salon';
  delivery_address?: string | null;
  total_amount?: number;
  cancel_reason?: string | null;
  customer_id?: number | null;
  assigned_cook_id?: number | null;
  users_orders_assigned_cook_idTousers?: {
    id: number;
    full_name: string;
    username: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  created_at: string;
  assigned_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  order_lines: OrderLine[];
}

export interface DishRecipe {
  dishId: number;
  dishName: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    instructions?: string | null;
  }>;
}

export interface DailyReport {
  date: string;
  total_orders: number;
  pending_orders: number;
  assigned_orders: number;
  in_progress_orders: number;
  ready_orders: number;
  delivered_orders: number;
  paid_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  payment_breakdown?: {
    cash: number;
    card: number;
    transfer: number;
    other: number;
  };
  avg_completion_time_minutes: number;
  delayed_orders_count: number;
}

export interface CashShiftSummary {
  date: string;
  initial_cash: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  total_sales: number;
  expected_cash_in_drawer: number;
  total_orders_paid: number;
  closed_at: string;
}

export interface TopSellingItem {
  id: number;
  name: string;
  category: string | null;
  totalQuantity: number;
  totalRevenue: number;
}

export interface PurchaseProjectionItem {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  consumed_today: number;
  consumed_last_night?: number;
  reference_shift?: string;
  dishes_summary?: string | null;
  is_low_stock: boolean;
  suggested_to_buy: number;
  estimated_cost: number;
}

export interface IngredientItem {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  is_low_stock: boolean;
}

export interface StockTransaction {
  id: number;
  ingredient_id: number;
  ingredient_name?: string;
  unit?: string;
  transaction_type: string;
  quantity: number;
  reference_id?: number;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export const api = new ApiClient();
