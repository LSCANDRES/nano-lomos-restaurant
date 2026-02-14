import { formatCurrency } from '../../utils/formatters';
import Button from '../common/Button';

const MenuItemCard = ({ item, onAddToCart, disabled = false }) => {
  // Imágenes profesionales de alta calidad
  const defaultImages = {
    'Lomos': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
    'Hamburguesas': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    'Pizzas': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    'Adicionales': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80',
  };

  // Fallback genérico
  const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';

  // Prioridad: 1. Imagen por categoría, 2. Fallback genérico
  const imageUrl = defaultImages[item.category] || fallbackImage;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-200">
      {/* Imagen del plato */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
        />
        <div className="absolute top-2 right-2 bg-orange-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
          {formatCurrency(item.price)}
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
          <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gray-600 rounded">
            {item.category || 'Sin categoría'}
          </span>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}
        
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAddToCart(item)}
          disabled={disabled || !item.is_active}
          fullWidth
        >
          {item.is_active ? '🍽️ Agregar' : 'No disponible'}
        </Button>
      </div>
    </div>
  );
};

export default MenuItemCard;
