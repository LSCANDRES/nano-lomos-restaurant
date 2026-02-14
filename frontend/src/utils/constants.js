// Order Status Constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.ASSIGNED]: 'Asignado',
  [ORDER_STATUS.IN_PROGRESS]: 'En Proceso',
  [ORDER_STATUS.COMPLETED]: 'Completado',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [ORDER_STATUS.ASSIGNED]: 'bg-blue-100 text-blue-800 border-blue-300',
  [ORDER_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800 border-purple-300',
  [ORDER_STATUS.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
};

// User Roles
export const USER_ROLES = {
  MANAGER: 'manager',
  COOK: 'cook',
  ORDER_TAKER: 'order_taker',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.MANAGER]: 'Gerente',
  [USER_ROLES.COOK]: 'Cocinero',
  [USER_ROLES.ORDER_TAKER]: 'Tomador de Pedidos',
};
