import React, { useState } from 'react';
import { Search, Plus, AlertTriangle,Edit2, Trash2, X, Package, BarChart2, List } from 'lucide-react';
import type{ Product } from '../types';

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const Inventory: React.FC<InventoryProps> = ({ products, setProducts }) => {
  const [view, setView] = useState<'list' | 'valuation'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const initialFormState = {
    name: '',
    sku: '',
    category: 'Electronics',
    price: 0,
    cost: 0,
    stock: 0,
    minStockLevel: 5,
    supplier: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filter Logic
  const filteredProducts = products.filter(p => 
    (filterCategory === 'All' || p.category === filterCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // --- Valuation Logic ---
  
  const calculateValuation = (product: Product, method: 'FIFO' | 'LIFO' | 'AVG'): number => {
    if (!product.batches || product.batches.length === 0) {
      return product.stock * product.cost;
    }

    let remainingStock = product.stock;
    let totalValue = 0;
    
    // Sort batches based on method
    // FIFO: We want the NEWEST batches (Last In are what remain). Items sold are First In.
    // LIFO: We want the OLDEST batches (First In are what remain). Items sold are Last In.
    const sortedBatches = [...product.batches].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return method === 'FIFO' ? dateB - dateA : dateA - dateB;
    });

    if (method === 'AVG') {
      const totalBatchCost = product.batches.reduce((sum, b) => sum + (b.quantity * b.cost), 0);
      const totalBatchQty = product.batches.reduce((sum, b) => sum + b.quantity, 0);
      const avgCost = totalBatchQty > 0 ? totalBatchCost / totalBatchQty : product.cost;
      return product.stock * avgCost;
    }

    // Calculation for FIFO / LIFO
    for (const batch of sortedBatches) {
      if (remainingStock <= 0) break;
      const take = Math.min(remainingStock, batch.quantity);
      totalValue += take * batch.cost;
      remainingStock -= take;
    }

    // Fallback if batches don't cover full stock
    if (remainingStock > 0) {
      totalValue += remainingStock * product.cost;
    }

    return totalValue;
  };

  const totalFifo = products.reduce((acc, p) => acc + calculateValuation(p, 'FIFO'), 0);
  const totalLifo = products.reduce((acc, p) => acc + calculateValuation(p, 'LIFO'), 0);
  const totalAvg = products.reduce((acc, p) => acc + calculateValuation(p, 'AVG'), 0);

  // --- Actions ---

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStockLevel: product.minStockLevel,
      supplier: product.supplier
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? {
        ...p,
        ...formData
      } : p));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formData
      };
      setProducts([newProduct, ...products]);
    }
    
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory Management</h2>
          <p className="text-slate-500 mt-1">Manage stock, prices, and suppliers.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex bg-white rounded-lg border border-slate-200 p-1 mr-2">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setView('valuation')}
              className={`p-2 rounded-md transition-all ${view === 'valuation' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              title="Valuation Reports"
            >
              <BarChart2 size={20} />
            </button>
           </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {view === 'valuation' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-slate-500 text-sm font-medium mb-2">FIFO Valuation (First-In First-Out)</h4>
                <div className="text-2xl font-bold text-slate-900">${totalFifo.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <p className="text-xs text-slate-400 mt-2">Best for rising costs (higher tax, higher profit).</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-slate-500 text-sm font-medium mb-2">LIFO Valuation (Last-In First-Out)</h4>
                <div className="text-2xl font-bold text-slate-900">${totalLifo.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <p className="text-xs text-slate-400 mt-2">Best for rising costs (lower tax, lower profit).</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-primary">
                <h4 className="text-slate-500 text-sm font-medium mb-2">Weighted Average Cost</h4>
                <div className="text-2xl font-bold text-primary">${totalAvg.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <p className="text-xs text-slate-400 mt-2">Standard industry practice.</p>
             </div>
           </div>

           {/* Valuation Table */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-800">Product Valuation Report</h3>
             </div>
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Stock</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">FIFO Value</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">LIFO Value</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Avg Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => {
                    const fifo = calculateValuation(p, 'FIFO');
                    const lifo = calculateValuation(p, 'LIFO');
                    const avg = calculateValuation(p, 'AVG');
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                        <td className="px-6 py-4 text-right text-slate-600">{p.stock}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-700">${fifo.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-700">${lifo.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono text-primary font-medium">${avg.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
             </div>
           </div>
        </div>
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name or SKU..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors
                    ${filterCategory === cat 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Package size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-500">{product.supplier}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{product.sku}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock <= product.minStockLevel ? (
                          <span className="flex items-center text-red-600 text-sm font-medium bg-red-50 w-fit px-2 py-1 rounded">
                            <AlertTriangle size={14} className="mr-1.5" />
                            Low Stock ({product.stock})
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600 font-medium">
                            {product.stock} Units
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <Package size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No products found</h3>
                <p className="mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="e.g. Wireless Mouse"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="e.g. WM-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price ($)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price ($)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="5"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                    placeholder="e.g. TechDistro Inc"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};