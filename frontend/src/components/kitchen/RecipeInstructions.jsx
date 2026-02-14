import { formatCurrency } from '../../utils/formatters';
import Button from '../common/Button';

const RecipeInstructions = ({ recipe, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-orange-600 mx-auto"></div>
        <p className="text-center text-gray-700 mt-4">Cargando receta...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        <p className="text-center text-gray-600">⚠️ No hay receta disponible para este item</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-orange-600">
          📋 {recipe.menu_item_name}
        </h2>
      </div>

      {/* Ingredientes */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          🥘 Ingredientes Necesarios
        </h3>
        <div className="space-y-2">
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${
                  ingredient.current_stock >= ingredient.quantity_required
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-orange-50 border-orange-400'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800">
                      {ingredient.name}
                    </span>
                    {ingredient.current_stock < ingredient.quantity_required && (
                      <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-bold">
                        ⚠️ STOCK BAJO
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-gray-700 font-bold">
                      {ingredient.quantity_required} {ingredient.unit}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      (Stock: {ingredient.current_stock} {ingredient.unit})
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No hay ingredientes registrados</p>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      {recipe.instructions && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            👨‍🍳 Instrucciones de Preparación
          </h3>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {recipe.instructions}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeInstructions;
