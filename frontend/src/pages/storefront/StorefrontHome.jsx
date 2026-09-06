import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Search, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { QuickViewModal } from './QuickViewModal';
import { useCart } from '../../context/CartContext';
import { useStorefrontCatalog } from '../../layouts/StorefrontLayout';
import {
  StorefrontHero,
  StorefrontAdvertisements,
  StorefrontCategoryRow,
  StorefrontFeaturesBar,
  StorefrontPromoBanner,
  StorefrontTestimonials,
  WhatsAppProductCard,
} from './StorefrontSections';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/currency';

export const StorefrontHome = () => {
  const { slug } = useParams();
  const { storeData, themeConfig } = useOutletContext();
  const { addToCart, setIsDrawerOpen } = useCart();
  const catalog = useStorefrontCatalog();

  const isWhatsAppStore = themeConfig.isWhatsAppStore;

  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState('all');

  const searchQuery = isWhatsAppStore ? (catalog?.searchQuery ?? '') : localSearch;
  const setSearchQuery = isWhatsAppStore ? (catalog?.setSearchQuery ?? setLocalSearch) : setLocalSearch;
  const selectedCategory = isWhatsAppStore ? (catalog?.selectedCategory ?? 'all') : localCategory;
  const setSelectedCategory = isWhatsAppStore ? (catalog?.setSelectedCategory ?? setLocalCategory) : setLocalCategory;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/storefront/${slug}/products`, {
          params: {
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery || undefined,
          },
        });
        if (isMounted && res.data?.success) {
          setProducts(res.data.data.products || []);
          setCategories(res.data.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load store catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, [slug, selectedCategory, searchQuery]);

  const handleQuickAdd = (p, e) => {
    e.stopPropagation();
    addToCart({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      price: p.salePrice > 0 ? p.salePrice : p.price,
      salePrice: p.salePrice,
      thumbnail: p.thumbnail,
      coverImage: p.coverImage || p.thumbnail,
      stockQuantity: p.stockQuantity,
      taxId: p.taxId,
    }, 1, null);
    setIsDrawerOpen(true);
    setAddedProductId(p._id);
    window.setTimeout(() => setAddedProductId(null), 650);
  };

  const openQuickView = (p) => {
    setQuickViewProduct(p);
    setIsQuickViewOpen(true);
  };

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isWhatsAppStore) {
    const isFiltered = selectedCategory !== 'all' || searchQuery.trim().length > 0;
    const displayProducts = products;

    return (
      <div className="space-y-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <StorefrontHero storeData={storeData} themeConfig={themeConfig} onShopNow={scrollToProducts} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StorefrontAdvertisements advertisements={storeData?.advertisements} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StorefrontCategoryRow
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              scrollToProducts();
            }}
          />
        </div>

        <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isFiltered ? 'Products' : 'Trending Products'}
            </h2>
            <span className="text-xs text-slate-500">{products.length} items</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-sm font-semibold text-[#25D366] hover:text-[#128C7E] transition-colors"
            >
              View All Products
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#25D366] border-t-transparent mb-2" />
              <p className="text-xs">Loading products...</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 p-8">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-400 mt-1">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayProducts.map((product) => (
                <WhatsAppProductCard
                  key={product._id}
                  product={product}
                  themeConfig={themeConfig}
                  storeName={storeData?.name}
                  storeLogo={storeData?.logo}
                  storeWhatsAppPhone={storeData?.whatsappWidget?.phoneNumber}
                  onQuickView={openQuickView}
                  onQuickAdd={handleQuickAdd}
                  isAdded={addedProductId === product._id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StorefrontFeaturesBar />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StorefrontPromoBanner storeData={storeData} onShopNow={scrollToProducts} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <StorefrontTestimonials />
        </div>

        {quickViewProduct && (
          <QuickViewModal
            isOpen={isQuickViewOpen}
            onClose={() => setIsQuickViewOpen(false)}
            product={quickViewProduct}
            storeWhatsAppPhone={storeData?.whatsappWidget?.phoneNumber}
          />
        )}
      </div>
    );
  }

  /* Default theme layout (unchanged functionality) */
  return (
    <div className="space-y-8 text-left">
      <div className={`storefront-hero relative isolate overflow-hidden rounded-[2rem] shadow-xl ${themeConfig.heroGradient} px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14 text-white flex flex-col md:flex-row items-center justify-between gap-10`}>
        <div className="storefront-hero-glow absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-2xl" />
        <div className="storefront-hero-copy relative z-10 max-w-xl space-y-5">
          <div className="storefront-hero-badge inline-flex items-center space-x-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{themeConfig.badgeText || 'Special Collection'}</span>
          </div>
          <h1 className={`storefront-hero-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.02] ${themeConfig.fontHeading}`}>
            {storeData?.name || 'Welcome to Our Store'}
          </h1>
          <p className="storefront-hero-description max-w-lg text-sm sm:text-base opacity-80 leading-relaxed">
            {storeData?.welcomeMessage || 'Browse our catalog and enjoy instant, frictionless WhatsApp checkout.'}
          </p>
          <div className="storefront-hero-pills flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1.5">Curated products</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">Fast delivery</span>
          </div>
        </div>

        {themeConfig.heroImage && (
          <div className="storefront-hero-image relative z-10 flex w-full justify-center md:w-2/5">
            <img
              src={storeData?.bannerImage || themeConfig.heroImage}
              alt="Hero Showcase"
              className="aspect-square w-full max-w-[290px] rounded-[1.5rem] border border-white/20 bg-white/10 object-cover p-2 shadow-2xl transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>
        )}
      </div>

      <StorefrontAdvertisements advertisements={storeData?.advertisements} />

      <div className={`storefront-collection-panel space-y-4 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:p-5 ${themeConfig.isDark ? 'border-white/10 bg-slate-900/75' : 'border-slate-200/70 bg-white/70'}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Browse collection</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Find something you&apos;ll love</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products in store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs text-slate-900 dark:text-white"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium sm:hidden">Showing {products.length} products</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c.slug || c._id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === (c.slug || c._id)
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
          </div>
          <span className="hidden shrink-0 text-xs font-medium text-slate-500 sm:inline">{products.length} products</span>
        </div>
      </div>

      <div className="storefront-arrivals-heading flex items-end justify-between gap-4 pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">The collection</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Latest arrivals</h2>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex">
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-2" />
          <p className="text-xs">Loading store catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No products found</h3>
          <p className="text-xs text-slate-400 mt-1">Try refining your search query or selecting a different category.</p>
        </div>
      ) : (
        <div className="storefront-product-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => {
            const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
            const discountPct = hasDiscount ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

            return (
              <div
                key={product._id}
                onClick={() => openQuickView(product)}
                style={{ '--product-index': index }}
                className={`storefront-product-card group cursor-pointer overflow-visible transition-all duration-300 ${themeConfig.productCard} ${themeConfig.cardRadius || 'rounded-2xl'} flex flex-col justify-between`}
              >
                <div>
                  {product.badge && (
                    <span className={`absolute -top-3 left-3 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md -rotate-3 ${themeConfig.saleBadge || 'bg-slate-900 text-white'}`}>
                      {product.badge}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className={`absolute -top-3 ${product.badge ? 'right-3' : 'left-3'} z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md rotate-3 bg-rose-600 text-white`}>
                      {discountPct}% OFF
                    </span>
                  )}
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={product.thumbnail || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${themeConfig.isDark ? 'bg-slate-950/60 object-contain p-6' : 'object-cover'}`}
                    />

                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick View</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-400 dark:text-slate-400 truncate">
                        {product.categoryId?.name || 'General'}
                      </span>
                      <span className={`shrink-0 ${product.stockQuantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} IN STOCK` : 'OUT OF STOCK'}
                      </span>
                    </div>
                    <h3 className={`font-bold text-sm line-clamp-2 group-hover:opacity-70 transition-colors ${themeConfig.isDark ? 'text-white' : 'text-slate-900'} ${themeConfig.fontHeading}`}>
                      {product.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between">
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`text-base font-black font-mono ${themeConfig.isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(hasDiscount ? product.salePrice : product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className={`p-2.5 rounded-xl transition-transform active:scale-95 shadow-2xs ${themeConfig.cartBtn} ${addedProductId === product._id ? 'cart-add-pop' : ''}`}
                    title="Add to cart"
                  >
                    <ShoppingBag className={`w-4 h-4 ${addedProductId === product._id ? 'cart-add-icon' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quickViewProduct && (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          product={quickViewProduct}
          storeWhatsAppPhone={storeData?.whatsappWidget?.phoneNumber}
        />
      )}
    </div>
  );
};
