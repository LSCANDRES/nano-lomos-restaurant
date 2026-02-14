import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime, getMinutesDiff } from '../../utils/formatters';
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';
import Button from '../common/Button';

const OrderCard = ({ order, onAssignToCook, onUpdateStatus, showActions = true, cooks = [] }) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCook, setSelectedCook] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleAssign = async () => {
    if (!selectedCook) return;
    
    setIsAssigning(true);
    try {
      await onAssignToCook(order.id, parseInt(selectedCook));
      setSelectedCook('');
    } catch (error) {
      console.error('Error assigning order:', error);
      toast.error('❌ Error al asignar pedido', 3000);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('❌ Error al actualizar estado', 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const getElapsedTime = () => {
    if (!order.created_at) return '';
    const minutes = getMinutesDiff(order.created_at);
    return minutes;
  };

  const elapsedMinutes = getElapsedTime();
  const isDelayed = elapsedMinutes > 30;

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${
      isDelayed ? 'border-orange-500' : 'border-gray-200'
    } p-4 hover:shadow-lg transition-all`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-orange-600">
            Pedido #{order.id}
          </h3>
          <p className="text-sm text-gray-700">
            {order.table_number || 'Sin mesa'}
            {order.customer_name && ` - ${order.customer_name}`}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${
            ORDER_STATUS_COLORS[order.status]
          }`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          
          {elapsedMinutes > 0 && (
            <span className={`text-xs font-bold ${
              isDelayed ? 'text-orange-500 animate-pulse' : 'text-gray-500'
            }`}>
              {isDelayed ? '⚠️ ' : ''}{elapsedMinutes} min
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 border-t-2 border-gray-200 pt-3">
        <h4 className="text-sm font-bold text-gray-700 mb-2">🍽️ Items:</h4>
        <div className="space-y-1">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-700">
                <span className="text-orange-600 font-bold">{item.quantity}x</span> {item.menu_item_name}
                {item.notes && (
                  <span className="text-gray-400 italic ml-2">({item.notes})</span>
                )}
              </span>
              <span className="text-gray-800 font-bold">
                {formatCurrency(item.unit_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-3 pb-3 border-b-2 border-gray-200">
        <span className="text-base font-bold text-gray-700">Total:</span>
        <span className="text-2xl font-bold text-orange-600">
          {formatCurrency(order.total_amount)}
        </span>
      </div>

      {/* Assigned Cook Info */}
      {order.assigned_cook_name && (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <p className="text-sm text-gray-700">
            👨‍🍳 <strong className="text-orange-600">Asignado a:</strong> {order.assigned_cook_name}
          </p>
          {order.assigned_at && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDateTime(order.assigned_at)}
            </p>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 space-y-1 mb-3">
        <p>📅 <span className="text-gray-700">Creado:</span> {formatDateTime(order.created_at)}</p>
        {order.started_at && <p>🔥 <span className="text-gray-700">Iniciado:</span> {formatDateTime(order.started_at)}</p>}
        {order.completed_at && <p>✅ <span className="text-gray-700">Completado:</span> {formatDateTime(order.completed_at)}</p>}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="space-y-2">
          {/* Manual Assignment (FR-006A) - Only for pending/assigned orders */}
          {(order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.ASSIGNED) && 
           cooks.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedCook}
                onChange={(e) => setSelectedCook(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-300 bg-white text-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                disabled={isAssigning}
              >
                <option value="">👨‍🍳 Seleccionar cocinero...</option>
                {cooks.map((cook) => (
                  <option key={cook.id} value={cook.id}>
                    {cook.full_name}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAssign}
                disabled={!selectedCook || isAssigning}
                loading={isAssigning}
              >
                Asignar
              </Button>
            </div>
          )}

          {/* Status Update Buttons (FR-006B) - Order taker can update status */}
          {order.status !== ORDER_STATUS.COMPLETED && (
            <div className="flex gap-2">
              {order.status === ORDER_STATUS.PENDING && (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => handleStatusChange(ORDER_STATUS.ASSIGNED)}
                  disabled={isUpdating || !order.assigned_cook_id}
                  loading={isUpdating}
                >
                  Marcar Asignado
                </Button>
              )}
              
              {order.status === ORDER_STATUS.ASSIGNED && (
                <Button
                  variant="warning"
                  size="sm"
                  fullWidth
                  onClick={() => handleStatusChange(ORDER_STATUS.IN_PROGRESS)}
                  disabled={isUpdating}
                  loading={isUpdating}
                >
                  Iniciar Preparación
                </Button>
              )}
              
              {order.status === ORDER_STATUS.IN_PROGRESS && (
                <Button
                  variant="success"
                  size="sm"
                  fullWidth
                  onClick={() => handleStatusChange(ORDER_STATUS.COMPLETED)}
                  disabled={isUpdating}
                  loading={isUpdating}
                >
                  Marcar Completado
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
