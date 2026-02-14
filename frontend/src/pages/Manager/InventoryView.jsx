import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import inventoryService from '../../services/inventoryService';
import Button from '../../components/common/Button';

const InventoryView = () => {
  const [ingredients, setIngredients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [purchaseList, setPurchaseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'low-stock', 'purchase-list'
  
  // Modal states
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  // Form states
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    unit: 'unidad',
    currentStock: '',
    minStock: '',
    unitCost: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [ingredientsData, summaryData] = await Promise.all([
        inventoryService.getIngredients(),
        inventoryService.getSummary()
      ]);
      
      setIngredients(ingredientsData);
      setSummary(summaryData);
      
      // Load purchase list if on that tab
      if (activeTab === 'purchase-list') {
        const purchaseData = await inventoryService.getPurchaseList();
        setPurchaseList(purchaseData);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError(error.response?.data?.message || 'Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseList = async () => {
    try {
      const data = await inventoryService.getPurchaseList();
      setPurchaseList(data);
    } catch (error) {
      console.error('Error loading purchase list:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'purchase-list') {
      loadPurchaseList();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Restock handlers
  const openRestockModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setRestockQuantity('');
    setRestockNotes('');
    setShowRestockModal(true);
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockQuantity || parseFloat(restockQuantity) <= 0) return;

    try {
      setActionLoading(true);
      await inventoryService.restockIngredient(
        selectedIngredient.id,
        parseFloat(restockQuantity),
        restockNotes
      );
      setShowRestockModal(false);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar stock');
    } finally {
      setActionLoading(false);
    }
  };

  // Create handlers
  const openCreateModal = () => {
    setFormData({
      name: '',
      unit: 'unidad',
      currentStock: '',
      minStock: '',
      unitCost: ''
    });
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) return;

    try {
      setActionLoading(true);
      await inventoryService.createIngredient({
        name: formData.name,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock) || 0,
        minStock: parseFloat(formData.minStock) || 0,
        unitCost: parseFloat(formData.unitCost) || 0
      });
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear ingrediente');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit handlers
  const openEditModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.current_stock,
      minStock: ingredient.min_stock,
      unitCost: ingredient.unit_cost || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) return;

    try {
      setActionLoading(true);
      await inventoryService.updateIngredient(selectedIngredient.id, {
        name: formData.name,
        unit: formData.unit,
        minStock: parseFloat(formData.minStock) || 0,
        unitCost: parseFloat(formData.unitCost) || 0
      });
      setShowEditModal(false);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar ingrediente');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (ingredient) => {
    if (!window.confirm(`¿Eliminar "${ingredient.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await inventoryService.deleteIngredient(ingredient.id);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar ingrediente');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIngredients = activeTab === 'low-stock' 
    ? ingredients.filter(i => i.is_low_stock)
    : ingredients;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                📦 GESTIÓN DE INVENTARIO
              </h1>
              <p className="text-sm text-orange-100 mt-1">
                Control de ingredientes y materia prima
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/manager/dashboard')}>
                ← Dashboard
              </Button>
              <Button variant="secondary" size="sm" onClick={logout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-orange-100 border border-orange-400 rounded-lg p-4 flex justify-between items-center">
            <p className="text-orange-600 font-semibold">⚠️ {error}</p>
            <button onClick={() => setError('')} className="text-orange-600 hover:text-orange-800">✕</button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 font-semibold mb-1">📦 Total Ingredientes</p>
              <p className="text-4xl font-bold text-gray-800">{summary.total_ingredients}</p>
            </div>
            <div className={`bg-white border rounded-lg p-4 shadow-sm ${summary.low_stock_count > 0 ? 'border-orange-400' : 'border-gray-300'}`}>
              <p className="text-sm text-gray-600 font-semibold mb-1">⚠️ Stock Bajo</p>
              <p className={`text-4xl font-bold ${summary.low_stock_count > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
                {summary.low_stock_count}
              </p>
            </div>
            <div className={`bg-white border rounded-lg p-4 shadow-sm ${summary.out_of_stock_count > 0 ? 'border-orange-500' : 'border-gray-300'}`}>
              <p className="text-sm text-gray-600 font-semibold mb-1">🚫 Sin Stock</p>
              <p className={`text-4xl font-bold ${summary.out_of_stock_count > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                {summary.out_of_stock_count}
              </p>
            </div>
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 font-semibold mb-1">💰 Valor Inventario</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_inventory_value)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg font-bold uppercase transition-all ${
              activeTab === 'all'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Todos ({ingredients.length})
          </button>
          <button
            onClick={() => handleTabChange('low-stock')}
            className={`px-4 py-2 rounded-lg font-bold uppercase transition-all ${
              activeTab === 'low-stock'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Stock Bajo ({ingredients.filter(i => i.is_low_stock).length})
          </button>
          <button
            onClick={() => handleTabChange('purchase-list')}
            className={`px-4 py-2 rounded-lg font-bold uppercase transition-all ${
              activeTab === 'purchase-list'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Lista de Compras
          </button>
          
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={loadData}>
              🔄 Actualizar
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              + Nuevo Ingrediente
            </Button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'purchase-list' ? (
          // Purchase List View
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
              <h2 className="text-lg font-bold text-white">🛒 Lista de Compras Sugerida</h2>
            </div>
            <div className="p-6">
              {purchaseList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">✅ No hay ingredientes con stock bajo</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-200">
                        <th className="pb-3 font-semibold text-gray-700">Ingrediente</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Stock Actual</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Mínimo</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Cantidad Sugerida</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Costo Estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseList.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 font-semibold text-gray-800">{item.name}</td>
                          <td className="py-3 text-right text-orange-500 font-bold">
                            {item.current_stock} {item.unit}
                          </td>
                          <td className="py-3 text-right text-gray-600">
                            {item.min_stock} {item.unit}
                          </td>
                          <td className="py-3 text-right font-bold text-gray-800">
                            {item.suggested_quantity} {item.unit}
                          </td>
                          <td className="py-3 text-right font-bold text-orange-600">
                            {formatCurrency(item.estimated_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan="4" className="py-3 text-right font-bold text-gray-800">
                          Total Estimado:
                        </td>
                        <td className="py-3 text-right text-xl font-bold text-orange-600">
                          {formatCurrency(purchaseList.reduce((sum, i) => sum + i.estimated_cost, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Ingredients List View
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
              <h2 className="text-lg font-bold text-white">
                {activeTab === 'low-stock' ? '⚠️ Ingredientes con Stock Bajo' : '📋 Todos los Ingredientes'}
              </h2>
            </div>
            <div className="p-6">
              {filteredIngredients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {activeTab === 'low-stock' ? '✅ No hay ingredientes con stock bajo' : 'No hay ingredientes registrados'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-200">
                        <th className="pb-3 font-semibold text-gray-700">Ingrediente</th>
                        <th className="pb-3 font-semibold text-gray-700">Unidad</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Stock Actual</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Stock Mínimo</th>
                        <th className="pb-3 font-semibold text-gray-700 text-right">Costo Unit.</th>
                        <th className="pb-3 font-semibold text-gray-700 text-center">Estado</th>
                        <th className="pb-3 font-semibold text-gray-700 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ingredient) => (
                        <tr key={ingredient.id} className={`border-b border-gray-100 ${ingredient.is_low_stock ? 'bg-orange-50' : ''}`}>
                          <td className="py-3 font-semibold text-gray-800">{ingredient.name}</td>
                          <td className="py-3 text-gray-600">{ingredient.unit}</td>
                          <td className={`py-3 text-right font-bold ${ingredient.is_low_stock ? 'text-orange-500' : 'text-gray-800'}`}>
                            {parseFloat(ingredient.current_stock).toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-gray-600">
                            {parseFloat(ingredient.min_stock).toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-gray-600">
                            {ingredient.unit_cost ? formatCurrency(ingredient.unit_cost) : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {ingredient.current_stock == 0 ? (
                              <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full">
                                SIN STOCK
                              </span>
                            ) : ingredient.is_low_stock ? (
                              <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
                                BAJO
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-full">
                                OK
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openRestockModal(ingredient)}
                                className="px-2 py-1 text-xs font-bold bg-orange-600 text-white rounded hover:bg-orange-700"
                                title="Agregar stock"
                              >
                                +Stock
                              </button>
                              <button
                                onClick={() => openEditModal(ingredient)}
                                className="px-2 py-1 text-xs font-bold bg-gray-600 text-white rounded hover:bg-gray-700"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(ingredient)}
                                className="px-2 py-1 text-xs font-bold bg-gray-400 text-white rounded hover:bg-gray-500"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-lg">
              <h3 className="text-lg font-bold text-white">📦 Agregar Stock</h3>
              <p className="text-sm text-orange-100">{selectedIngredient.name}</p>
            </div>
            <form onSubmit={handleRestock} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Stock actual: <strong>{selectedIngredient.current_stock} {selectedIngredient.unit}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Cantidad a agregar ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="Ej: 10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="Ej: Compra proveedor X"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowRestockModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={actionLoading || !restockQuantity}
                  loading={actionLoading}
                >
                  Agregar Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-lg">
              <h3 className="text-lg font-bold text-white">
                {showCreateModal ? '➕ Nuevo Ingrediente' : '✏️ Editar Ingrediente'}
              </h3>
            </div>
            <form onSubmit={showCreateModal ? handleCreate : handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="Ej: Harina"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unidad *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  required
                >
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="l">Litros (l)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="unidad">Unidad</option>
                  <option value="unidades">Unidades</option>
                </select>
              </div>
              {showCreateModal && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Mínimo (alerta)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Costo Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={actionLoading || !formData.name}
                  loading={actionLoading}
                >
                  {showCreateModal ? 'Crear' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
