import { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import orderService from '../services/orderService';
import authService from '../services/authService';

export const OrderContext = createContext(null);

// En producción usa URL relativa (mismo host), en desarrollo usa localhost:3002
const WS_URL = import.meta.env.VITE_WS_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3002');

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    const newSocket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for order events
    newSocket.on('order:new', (order) => {
      console.log('New order received:', order);
      setOrders((prev) => [order, ...prev]);
    });

    newSocket.on('order:assigned', (updatedOrder) => {
      console.log('Order assigned:', updatedOrder);
      updateOrderInState(updatedOrder);
    });

    newSocket.on('order:status_changed', (updatedOrder) => {
      console.log('Order status changed:', updatedOrder);
      updateOrderInState(updatedOrder);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Helper: Update order in state
  const updateOrderInState = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
  };

  // Fetch all orders
  const fetchOrders = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await orderService.getOrders(filters);
      setOrders(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending orders
  const fetchPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getPendingOrders();
      setOrders(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch pending orders:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new order
  const createOrder = useCallback(async (orderData) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      // Order will be added via WebSocket event, but add optimistically
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      updateOrderInState(updatedOrder);
      return updatedOrder;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }, []);

  // Assign order to cook (FR-006A)
  const assignOrderToCook = useCallback(async (orderId, cookId) => {
    try {
      const updatedOrder = await orderService.assignOrderToCook(orderId, cookId);
      updateOrderInState(updatedOrder);
      return updatedOrder;
    } catch (error) {
      console.error('Failed to assign order:', error);
      throw error;
    }
  }, []);

  const value = {
    orders,
    loading,
    connected,
    fetchOrders,
    fetchPendingOrders,
    createOrder,
    updateOrderStatus,
    assignOrderToCook,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
