import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import Button from '../common/Button';
import RecipeInstructions from '../kitchen/RecipeInstructions';
import recipeService from '../../services/recipeService';

const AssignedOrder = ({ order, onUpdateStatus, loading = false }) => {
  const [showRecipes, setShowRecipes] = useState({});
  const [recipes, setRecipes] = useState({});
  const [loadingRecipes, setLoadingRecipes] = useState({});

  const loadRecipe = async (menuItemId) => {
    if (recipes[menuItemId]) {
      // Ya está cargada, solo toggle visibility
      setShowRecipes(prev => ({ ...prev, [menuItemId]: !prev[menuItemId] }));
      return;
    }

    try {
      setLoadingRecipes(prev => ({ ...prev, [menuItemId]: true }));
      const recipe = await recipeService.getRecipeWithInstructions(menuItemId);
      setRecipes(prev => ({ ...prev, [menuItemId]: recipe }));
      setShowRecipes(prev => ({ ...prev, [menuItemId]: true }));
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoadingRecipes(prev => ({ ...prev, [menuItemId]: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'gray-400',
      in_progress: 'gray-500',
      completed: 'gray-600',
    };
    return colors[status] || 'gray-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      assigned: '🕐 Asignado',
      in_progress: '🔥 En Proceso',
      completed: '✅ Completado',
    };
    return labels[status] || status;
  };

  const getElapsedTime = () => {
    const created = new Date(order.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - created) / 60000);
    return diffMinutes;
  };

  const isDelayed = () => {
    return getElapsedTime() > 30;
  };

  if (!order) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">☕</div>
        <p className="text-2xl font-bold text-orange-600 mb-2">
          No hay pedidos asignados
        </p>
        <p className="text-gray-700">
          Solicitá el siguiente pedido cuando estés listo
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border-2 ${isDelayed() ? 'border-orange-500' : 'border-gray-300'} rounded-lg p-6 space-y-4`}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-orange-600">
            🍽️ Pedido #{order.id}
          </h2>
          <p className="text-lg text-gray-700 mt-1">
            Mesa: <strong className="text-orange-600">{order.table_number}</strong>
          </p>
          {order.customer_name && (
            <p className="text-gray-700">
              Cliente: <strong>{order.customer_name}</strong>
            </p>
          )}
        </div>
        
        <div className="text-right">
          <span className="inline-block px-4 py-2 rounded-lg font-bold text-sm bg-gray-100 border-2 border-gray-300 text-gray-700">
            {getStatusLabel(order.status)}
          </span>
          <p className={`text-sm mt-2 ${isDelayed() ? 'text-orange-500 animate-pulse font-bold' : 'text-gray-500'}`}>
            ⏱️ {getElapsedTime()} min
          </p>
        </div>
      </div>

      {/* Items */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          🍔 Items del Pedido
        </h3>
        <div className="space-y-3">
          {order.items && Array.isArray(order.items) && order.items.map((item, index) => (
            <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className="font-bold text-gray-800 text-lg">
                    {item.name}
                  </span>
                  <span className="ml-3 text-orange-600 font-bold">
                    x{item.quantity}
                  </span>
                </div>
                <span className="text-gray-800 font-bold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
              
              {item.notes && (
                <p className="text-sm text-gray-500 italic mb-2">
                  📝 {item.notes}
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRecipe(item.menu_item_id)}
                disabled={loadingRecipes[item.menu_item_id]}
                className="w-full mt-2"
              >
                {loadingRecipes[item.menu_item_id] ? (
                  'Cargando receta...'
                ) : showRecipes[item.menu_item_id] ? (
                  '🔼 Ocultar Receta'
                ) : (
                  '📋 Ver Receta e Ingredientes'
                )}
              </Button>

              {showRecipes[item.menu_item_id] && recipes[item.menu_item_id] && (
                <div className="mt-4">
                  <RecipeInstructions recipe={recipes[item.menu_item_id]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-700">TOTAL:</span>
          <span className="text-3xl font-bold text-orange-600">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t-2 border-gray-200 pt-4 space-y-3">
        {order.status === 'assigned' && (
          <Button
            variant="warning"
            size="lg"
            onClick={() => onUpdateStatus(order.id, 'in_progress')}
            disabled={loading}
            className="w-full text-xl py-4"
          >
            🔥 Comenzar a Preparar
          </Button>
        )}
        
        {order.status === 'in_progress' && (
          <Button
            variant="success"
            size="lg"
            onClick={() => onUpdateStatus(order.id, 'completed')}
            disabled={loading}
            className="w-full text-xl py-4"
          >
            ✅ Marcar como Completado
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssignedOrder;
