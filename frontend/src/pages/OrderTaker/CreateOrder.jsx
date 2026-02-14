import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import menuService from '../../services/menuService';
import { useOrders } from '../../hooks/useOrders';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button';

const CreateOrder = () => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('takeaway'); // 'takeaway' o 'dine-in'
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showCartMobile, setShowCartMobile] = useState(false); // Para mostrar/ocultar carrito en móvil
  
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const toast = useToast();

  // Función para obtener el icono según el nombre del producto
  const getProductIcon = (name) => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('hamburguesa')) return '🍔';
    if (nameLower.includes('lomo')) return '🥪';
    if (nameLower.includes('pizza')) return '🍕';
    if (nameLower.includes('ensalada')) return '🥗';
    if (nameLower.includes('pasta')) return '🍝';
    if (nameLower.includes('taco')) return '🌮';
    if (nameLower.includes('pollo')) return '🍗';
    if (nameLower.includes('carne')) return '🥩';
    if (nameLower.includes('bebida') || nameLower.includes('refresco')) return '🥤';
    if (nameLower.includes('café') || nameLower.includes('cafe')) return '☕';
    if (nameLower.includes('postre') || nameLower.includes('helado')) return '🍰';
    if (nameLower.includes('papas') || nameLower.includes('fritas')) return '🍟';
    
    // Default según categoría
    return '🍴';
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const data = await menuService.getMenu();
      const mainMenuItems = data.filter(item => item.category !== 'Adicionales');
      setMenu(mainMenuItems);
    } catch (error) {
      console.error('Error loading menu:', error);
      setError('Error al cargar el menú');
    } finally {
      setMenuLoading(false);
    }
  };

  // Obtener categorías únicas
  const categories = ['Todos', ...new Set(menu.map(item => item.category).filter(Boolean))];

  // Filtrar menú por categoría
  const filteredMenu = activeCategory === 'Todos' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  const addToCart = (menuItem) => {
    const existingItem = cart.find((item) => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          notes: '',
        },
      ]);
    }
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart(
      cart.map((item) => {
        if (item.menuItemId === menuItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart(cart.filter((item) => item.menuItemId !== menuItemId));
  };

  const getCartQuantity = (menuItemId) => {
    const item = cart.find(i => i.menuItemId === menuItemId);
    return item ? item.quantity : 0;
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      setError('Debes agregar al menos un item al pedido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        tableNumber: orderType === 'takeaway' ? 'RETIRA' : 'LOCAL',
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      };

      await createOrder(orderData);
      
      const orderTypeText = orderType === 'takeaway' ? 'Para Llevar' : 'Consumir Local';
      toast.success(`✅ Pedido creado!\nTipo: ${orderTypeText}\nTotal: ${formatCurrency(calculateTotal())}`, 5000);
      
      setCart([]);
      setCustomerName('');
      navigate('/order-taker/dashboard');
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.response?.data?.missingIngredients) {
        const missing = error.response.data.missingIngredients;
        const missingList = missing.map(
          (ing) => `• ${ing.name}: necesitas ${ing.needed}, hay ${ing.available}`
        ).join('\n');
        setError(`⚠️ Stock insuficiente:\n${missingList}`);
      } else {
        setError(error.response?.data?.message || 'Error al crear el pedido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header compacto */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-3 md:px-4 py-2 flex justify-between items-center flex-shrink-0">
        <h1 className="text-lg md:text-xl font-bold text-white">🍔 NUEVO PEDIDO</h1>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm hidden md:inline">
            {cart.length > 0 && `${cart.reduce((s, i) => s + i.quantity, 0)} items`}
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigate('/order-taker/dashboard')}>
            ← Volver
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Menú */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs de categorías */}
          <div className="bg-white border-b px-2 py-2 flex gap-1 overflow-x-auto flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de productos - Optimizado para móvil */}
          <div className="flex-1 overflow-y-auto p-2 pb-24 md:pb-2">
            {menuLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
                {filteredMenu.map((item) => {
                  const qty = getCartQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg border-2 p-3 md:p-2 cursor-pointer transition-all active:scale-95 ${
                        qty > 0 ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:shadow-md'
                      }`}
                      onClick={() => !loading && addToCart(item)}
                    >
                      <div className="text-center">
                        <div className="text-4xl md:text-3xl mb-2 md:mb-1">
                          {getProductIcon(item.name)}
                        </div>
                        <p className="font-bold text-gray-800 text-sm md:text-xs leading-tight line-clamp-2 h-10 md:h-8 flex items-center justify-center">
                          {item.name}
                        </p>
                        <p className="text-orange-600 font-bold text-base md:text-sm mt-2 md:mt-1">
                          {formatCurrency(item.price)}
                        </p>
                        {qty > 0 && (
                          <div className="mt-2 md:mt-1 flex items-center justify-center gap-2 md:gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                              className="w-8 h-8 md:w-6 md:h-6 bg-orange-500 text-white rounded text-base md:text-sm font-bold hover:bg-orange-600 active:bg-orange-700"
                            >
                              −
                            </button>
                            <span className="w-8 md:w-6 text-center font-bold text-orange-600 text-base md:text-sm">{qty}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                              className="w-8 h-8 md:w-6 md:h-6 bg-orange-600 text-white rounded text-base md:text-sm font-bold hover:bg-orange-700 active:bg-orange-800"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Carrito (Desktop) */}
        <div className="hidden md:flex w-72 lg:w-80 bg-white border-l flex-col flex-shrink-0">
          {/* Tipo de pedido */}
          <div className="p-3 border-b flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🛍️ LLEVAR
              </button>
              <button
                type="button"
                onClick={() => setOrderType('dine-in')}
                className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                  orderType === 'dine-in'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🍽️ LOCAL
              </button>
            </div>
            <input
              type="text"
              placeholder="Nombre cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                Toca un producto para agregar
              </p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="bg-gray-50 rounded-lg p-2 border">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-gray-800 text-sm flex-1 pr-1">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-6 h-6 bg-orange-500 text-white rounded text-xs font-bold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-6 h-6 bg-orange-600 text-white rounded text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-orange-600 text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total y botón */}
          <div className="p-3 border-t bg-gray-50 flex-shrink-0">
            {error && (
              <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-600">
                {error}
              </div>
            )}
            
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-gray-800">TOTAL:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || loading}
              className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-all ${
                cart.length === 0 || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {loading ? '⏳ Procesando...' : '✅ CONFIRMAR PEDIDO'}
            </button>
          </div>
        </div>
      </div>

      {/* Botón flotante móvil - Ver carrito */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartMobile(true)}
          className="md:hidden fixed bottom-4 right-4 left-4 bg-orange-600 text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-lg flex items-center justify-between z-50 active:bg-orange-700"
        >
          <span>🛒 Ver Carrito ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          <span className="text-xl">{formatCurrency(calculateTotal())}</span>
        </button>
      )}

      {/* Drawer del carrito (Móvil) */}
      {showCartMobile && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCartMobile(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del drawer */}
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">🛒 Tu Pedido</h2>
              <button
                onClick={() => setShowCartMobile(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Tipo de pedido */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`py-3 px-3 rounded-lg font-bold text-base transition-all ${
                    orderType === 'takeaway'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  🛍️ LLEVAR
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('dine-in')}
                  className={`py-3 px-3 rounded-lg font-bold text-base transition-all ${
                    orderType === 'dine-in'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  🍽️ LOCAL
                </button>
              </div>
              <input
                type="text"
                placeholder="Nombre cliente (opcional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-2 w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Items del carrito */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-800 text-base flex-1 pr-2">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-red-500 hover:text-red-600 text-xl"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-10 h-10 bg-orange-500 text-white rounded text-lg font-bold active:bg-orange-600"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-10 h-10 bg-orange-600 text-white rounded text-lg font-bold active:bg-orange-700"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-orange-600 text-lg">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total y botón */}
            <div className="p-4 border-t bg-gray-50 flex-shrink-0 shadow-lg">
              {error && (
                <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-800 text-lg">TOTAL:</span>
                <span className="text-3xl font-bold text-orange-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || loading}
                className={`w-full py-4 rounded-xl font-bold text-white text-xl transition-all ${
                  cart.length === 0 || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 active:bg-green-700'
                }`}
              >
                {loading ? '⏳ Procesando...' : '✅ CONFIRMAR PEDIDO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
