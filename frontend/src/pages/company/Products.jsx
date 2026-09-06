import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Layers,
  DollarSign,
  Image as ImageIcon,
  Tag,
  CheckCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

export const Products = () => {
  const { activeStore, setActiveStore } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [merchantStores, setMerchantStores] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('list');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('basic');

  // Form State (6 Tabs)
  const [productForm, setProductForm] = useState({
    storeId: '',
    name: '',
    sku: '',
    badge: '',
    categoryId: '',
    description: '',
    richDescription: '',
    price: 0,
    salePrice: 0,
    costPrice: 0,
    taxId: '',
    trackInventory: true,
    stockQuantity: 50,
    lowStockThreshold: 5,
    hasVariants: false,
    variants: [],
    thumbnail: '',
    images: [],
    seoTitle: '',
    seoDescription: '',
    customFields: [{ name: 'Material', value: 'Solid Oak & Linen' }],
    status: 'active',
  });

  const fetchStores = async () => {
    try {
      const res = await api.get('/company/stores');
      if (res.data?.success) {
        const stores = res.data.data.stores || [];
        setMerchantStores(stores);

        if (stores.length === 0) {
          setActiveStore(null);
          return;
        }

        const nextStore = stores.find((s) => s._id === activeStore?._id) || stores[0];
        setActiveStore(nextStore);
      }
    } catch (err) {
      console.error('Failed to load merchant stores:', err);
    }
  };

  const fetchData = async () => {
    const targetStoreId = activeStore?._id || 'all';
    setLoading(true);
    try {
      const [prodRes, catRes, taxRes] = await Promise.all([
        api.get('/company/products', { params: { storeId: targetStoreId, search, categoryId: selectedCategory } }),
        api.get('/company/categories', { params: { storeId: targetStoreId } }),
        api.get('/company/taxes', { params: { storeId: targetStoreId } }),
      ]);
      if (prodRes.data?.success) setProducts(prodRes.data.data.products || prodRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data.categories || catRes.data.data);
      if (taxRes.data?.success) setTaxes(taxRes.data.data.taxes || taxRes.data.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeStore, search, selectedCategory]);

  useEffect(() => {
    if (activeStore && !productForm.storeId) {
      setProductForm((prev) => ({ ...prev, storeId: activeStore._id }));
    }
  }, [activeStore, productForm.storeId]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const selectedStoreId = productForm.storeId || activeStore?._id;

    if (!selectedStoreId) {
      toast.error('Please choose a store before saving the product.');
      return;
    }

    try {
      const payload = {
        ...productForm,
        storeId: selectedStoreId,
        categoryId: productForm.categoryId || null,
        taxId: productForm.taxId || null,
        coverImage: productForm.thumbnail || productForm.coverImage || '',
        isDisplay: true,
        status: productForm.status || 'active',
      };
      delete payload.thumbnail;
      if (editingProduct) {
        await api.put(`/company/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/company/products', payload);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await fetchData();
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      storeId: activeStore?._id || merchantStores[0]?._id || '',
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      badge: 'NEW',
      categoryId: categories.length > 0 ? categories[0]._id : '',
      description: '',
      richDescription: '',
      price: 99,
      salePrice: 0,
      costPrice: 50,
      taxId: '',
      trackInventory: true,
      stockQuantity: 100,
      lowStockThreshold: 10,
      hasVariants: false,
      variants: [],
      thumbnail: '',
      images: [],
      seoTitle: '',
      seoDescription: '',
      customFields: [{ name: 'Warranty', value: '1 Year Manufacturer' }],
      status: 'active',
    });
    setActiveFormTab('basic');
    setIsProductModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      storeId: p.storeId?._id || p.storeId || activeStore?._id || '',
      name: p.name,
      sku: p.sku || '',
      badge: p.badge || '',
      categoryId: p.categoryId?._id || p.categoryId || '',
      description: p.description || '',
      richDescription: p.richDescription || p.description || '',
      price: p.price,
      salePrice: p.salePrice || 0,
      costPrice: p.costPrice || 0,
      taxId: p.taxId?._id || p.taxId || '',
      trackInventory: p.trackInventory ?? true,
      stockQuantity: p.stockQuantity ?? 10,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      hasVariants: p.hasVariants || false,
      variants: p.variants || [],
      thumbnail: p.coverImage || p.thumbnail || '',
      images: p.images || [],
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || '',
      customFields: p.customFields || [],
      status: p.status || 'active',
    });
    setActiveFormTab('basic');
    setIsProductModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product from catalog?')) {
      try {
        await api.delete(`/company/products/${id}`);
        await fetchData();
        toast.success('Product deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const addGalleryImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 8 - productForm.images.length);
    files.slice(0, remainingSlots).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 2MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProductForm((previous) => ({
          ...previous,
          images: [...previous.images, reader.result],
          thumbnail: previous.thumbnail || reader.result,
        }));
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const formTabs = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'pricing', label: '2. Pricing & Taxes' },
    { id: 'inventory', label: '3. Inventory & Variants' },
    { id: 'media', label: '4. Gallery Media' },
    { id: 'seo', label: '5. SEO Meta' },
    { id: 'specs', label: '6. Custom Specs' },
  ];

  const updateVariant = (index, field, value) => {
    const variants = [...productForm.variants];
    variants[index] = { ...variants[index], [field]: value };
    setProductForm({ ...productForm, variants });
  };

  const addVariant = () => {
    setProductForm({
      ...productForm,
      hasVariants: true,
      variants: [...productForm.variants, { name: 'Size', options: ['S', 'M', 'L'] }],
    });
  };

  const columns = [
    {
      header: 'Product',
      render: (p) => (
        <div className="space-y-1">
          <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
          <span className="text-[11px] text-slate-400 font-mono block">SKU: {p.sku || '—'}</span>
          <span className="text-[10px] text-slate-500 block">{p.description || 'No description'}</span>
        </div>
      ),
    },
    {
      header: 'Store',
      className: 'hidden lg:table-cell',
      render: (p) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {p.storeId?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Category',
      className: 'hidden md:table-cell',
      render: (p) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {p.categoryId?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      header: 'Price',
      render: (p) => {
        const hasDiscount = p.salePrice > 0 && p.salePrice < p.price;
        const discountPct = hasDiscount ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0;
        return (
          <div>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(hasDiscount ? p.salePrice : p.price)}
            </span>
            {hasDiscount && (
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 line-through font-mono">
                  {formatCurrency(p.price)}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  -{discountPct}%
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Stock',
      className: 'hidden sm:table-cell',
      render: (p) => (
        <span className={`text-xs font-mono font-bold ${p.stockQuantity <= (p.lowStockThreshold || 5) ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
          {p.stockQuantity} in stock
        </span>
      ),
    },
    {
      header: 'Status',
      className: 'hidden lg:table-cell',
      render: (p) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
          {p.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end space-x-1">
          <button onClick={() => openEditModal(p)} className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(p._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Product Catalog</h1>
          <p className="text-xs text-slate-500">Manage merchandise, categories, discounts, variants & price tiers</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        showViewToggle={true}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterComponents={
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        }
        renderGridItem={(p) => {
          const hasDiscount = p.salePrice > 0 && p.salePrice < p.price;
          const discountPct = hasDiscount ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0;

          return (
            <div key={p._id} className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[160px]">{p.name}</span>
                <div className="text-right">
                  <span className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                    {formatCurrency(hasDiscount ? p.salePrice : p.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] text-slate-400 line-through font-mono block">
                      {formatCurrency(p.price)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>SKU: {p.sku || '—'}</div>
                <div>Store: {p.storeId?.name || '—'}</div>
                <div>Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.categoryId?.name || 'General'}</span></div>
                <div>Stock: {p.stockQuantity}</div>
                {p.badge && <div>Badge: <span className="font-bold text-emerald-600">{p.badge}</span></div>}
                {hasDiscount && <div>Discount: <span className="font-bold text-rose-600">-{discountPct}% OFF</span></div>}
              </div>
              <div className="pt-2 mt-2 border-t flex items-center justify-between">
                <button onClick={() => openEditModal(p)} className="text-xs font-semibold text-emerald-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(p._id)} className="text-xs text-rose-500 hover:text-rose-700">
                  Delete
                </button>
              </div>
            </div>
          );
        }}
      />

      {/* 6-Tab Product Create / Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-left">
          <Tabs tabs={formTabs} activeTab={activeFormTab} onChange={setActiveFormTab} variant="pills" />

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            {/* Tab 1: Basic Info */}
            {activeFormTab === 'basic' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ergonomic Velvet Armchair"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU / Code *</label>
                    <input
                      type="text"
                      required
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store *</label>
                  <select
                    required
                    value={productForm.storeId}
                    onChange={(e) => setProductForm({ ...productForm, storeId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="">Select Store</option>
                    {merchantStores.map((store) => (
                      <option key={store._id} value={store._id}>{store.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="">Select Category (General)</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  {productForm.categoryId && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                      Selected: {categories.find((c) => c._id === productForm.categoryId)?.name || 'Category'}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Product Badge</label>
                    <span className="text-[10px] text-slate-400">Quick presets:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {['NEW', 'HOT', 'SALE', 'BESTSELLER', 'TRENDING', 'LIMITED'].map((badgePreset) => (
                      <button
                        key={badgePreset}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, badge: badgePreset })}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-colors ${
                          productForm.badge === badgePreset
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {badgePreset}
                      </button>
                    ))}
                    {productForm.badge && (
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, badge: '' })}
                        className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-rose-500"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={24}
                    placeholder="NEW, BESTSELLER, LIMITED"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg uppercase font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Shown on the storefront product image. Leave blank to hide it.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="Brief 1-liner summary for listings"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description (Rich Text)</label>
                  <RichTextEditor
                    value={productForm.richDescription}
                    onChange={(val) => setProductForm({ ...productForm, richDescription: val })}
                    rows={6}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Pricing & Taxes */}
            {activeFormTab === 'pricing' && (() => {
              const regularPrice = Number(productForm.price) || 0;
              const salePrice = Number(productForm.salePrice) || 0;
              const hasDiscount = salePrice > 0 && salePrice < regularPrice;
              const discountPct = hasDiscount ? Math.round(((regularPrice - salePrice) / regularPrice) * 100) : 0;
              const savings = hasDiscount ? regularPrice - salePrice : 0;
              const isInvalidSale = salePrice >= regularPrice && salePrice > 0;

              const applyDiscountPercent = (pct) => {
                if (pct <= 0 || regularPrice <= 0) {
                  setProductForm((prev) => ({ ...prev, salePrice: 0 }));
                } else {
                  const computedSale = Math.round(regularPrice * (1 - pct / 100) * 100) / 100;
                  setProductForm((prev) => ({ ...prev, salePrice: Math.max(0, computedSale) }));
                }
              };

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Regular Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sale / Discounted Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={productForm.salePrice}
                        onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={productForm.costPrice}
                        onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Quick Discount Presets */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Discount Presets</span>
                      {hasDiscount && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          {discountPct}% Discount Applied
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[10, 15, 20, 25, 30, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => applyDiscountPercent(pct)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                            discountPct === pct
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pct}% OFF
                        </button>
                      ))}
                      {productForm.salePrice > 0 && (
                        <button
                          type="button"
                          onClick={() => applyDiscountPercent(0)}
                          className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                        >
                          Clear Discount
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live Discount & Badge Preview */}
                  {hasDiscount && (
                    <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Live Price &amp; Badge Preview</span>
                        <div className="flex items-center space-x-1.5">
                          {productForm.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-xs">
                              {productForm.badge}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                            {discountPct}% OFF
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Original Price</span>
                          <span className="font-mono text-slate-400 line-through">{formatCurrency(regularPrice)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Customer Saves</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(savings)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Customer Pays</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">{formatCurrency(salePrice)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isInvalidSale && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                      Warning: Sale price ({formatCurrency(salePrice)}) should be less than the regular price ({formatCurrency(regularPrice)}) for a discount to take effect.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tax Rule</label>
                    <select
                      value={productForm.taxId}
                      onChange={(e) => setProductForm({ ...productForm, taxId: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    >
                      <option value="">No Tax Applied</option>
                      {taxes.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.type === 'percentage' ? `${t.rate}%` : `₹${t.rate}`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })()}

            {/* Tab 3: Inventory & Variants */}
            {activeFormTab === 'inventory' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.lowStockThreshold}
                      onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.hasVariants}
                    onChange={(e) => setProductForm({ ...productForm, hasVariants: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>This product has multiple options (e.g. Size, Color)</span>
                </label>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Options shown to customers</span>
                    <button type="button" onClick={addVariant} className="text-xs font-bold text-emerald-600 hover:underline">
                      + Add option group
                    </button>
                  </div>
                  {productForm.variants.map((variant, index) => (
                    <div key={`${variant.name}-${index}`} className="grid grid-cols-[110px_1fr_auto] gap-2 items-center">
                      <input
                        value={variant.name || ''}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        placeholder="Size"
                        className="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                      <input
                        value={(variant.options || []).join(', ')}
                        onChange={(e) => updateVariant(index, 'options', e.target.value.split(',').map((option) => option.trim()).filter(Boolean))}
                        placeholder="S, M, L, XL"
                        className="px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, variants: productForm.variants.filter((_, itemIndex) => itemIndex !== index) })}
                        className="text-xs text-rose-500 hover:text-rose-700"
                        title="Remove option group"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Media Gallery */}
            {activeFormTab === 'media' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Main Cover Thumbnail URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={productForm.thumbnail}
                    onChange={(e) => setProductForm({ ...productForm, thumbnail: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block font-semibold">Product Gallery</label>
                      <p className="text-[10px] text-slate-400">Add up to 8 photos. First photo is used as the cover.</p>
                    </div>
                    <label className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-700">
                      Upload Photos
                      <input type="file" accept="image/*" multiple onChange={addGalleryImages} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {productForm.images.map((image, index) => (
                      <div key={`${image.slice(0, 20)}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={image} alt={`Product gallery ${index + 1}`} className="w-full h-full object-cover" />
                        {productForm.thumbnail === image && (
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/75 text-white text-[9px] text-center py-0.5">Cover</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setProductForm((previous) => {
                            const images = previous.images.filter((_, imageIndex) => imageIndex !== index);
                            return { ...previous, images, thumbnail: previous.thumbnail === image ? images[0] || '' : previous.thumbnail };
                          })}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold"
                          title="Remove photo"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: SEO */}
            {activeFormTab === 'seo' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={productForm.seoTitle}
                    onChange={(e) => setProductForm({ ...productForm, seoTitle: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={productForm.seoDescription}
                    onChange={(e) => setProductForm({ ...productForm, seoDescription: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Tab 6: Custom Specifications */}
            {activeFormTab === 'specs' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">Add technical specifications and product characteristics:</p>
                {productForm.customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Spec Name (e.g. Dimensions)"
                      value={field.name || field.key || ''}
                      onChange={(e) => {
                        const copy = [...productForm.customFields];
                        copy[idx].name = e.target.value;
                        setProductForm({ ...productForm, customFields: copy });
                      }}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 120 x 80 cm)"
                      value={field.value}
                      onChange={(e) => {
                        const copy = [...productForm.customFields];
                        copy[idx].value = e.target.value;
                        setProductForm({ ...productForm, customFields: copy });
                      }}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm({
                          ...productForm,
                          customFields: productForm.customFields.filter((_, i) => i !== idx),
                        });
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setProductForm({
                      ...productForm,
                      customFields: [...productForm.customFields, { name: '', value: '' }],
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200"
                >
                  + Add Specification
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                Save Product
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
