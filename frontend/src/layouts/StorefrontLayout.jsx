import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  LogOut,
  MapPin,
  Search,
  MessageCircle,
  Heart,
  Menu,
  ChevronDown,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getThemeConfig } from '../themes/themeRegistry';
import { WhatsAppFloatingWidget } from '../components/common/WhatsAppFloatingWidget';
import { CartDrawer } from '../pages/storefront/CartDrawer';
import { CookieConsentBanner } from '../components/common/CookieConsentBanner';
import { StorefrontAdvertisementPopup, WhatsAppStoreFooter } from '../pages/storefront/StorefrontSections';
import api from '../api/axios';

const StorefrontCatalogContext = createContext(null);

export const useStorefrontCatalog = () => useContext(StorefrontCatalogContext);

const WhatsAppStoreHeader = ({
  slug,
  storeData,
  themeConfig,
  user,
  logout,
  totalItemCount,
  setIsDrawerOpen,
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Shop', action: () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Collection', action: () => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'About Us', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Track Order', action: () => navigate(`/store/${slug}/customer/orders`) },
    { label: 'Contact Us', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
  ];

  return (
    <>
      {/* Top promo bar */}
      {storeData?.welcomeMessage && (
        <div className="bg-[#128C7E] text-white text-[11px] py-2 px-4 text-center font-medium">
          {storeData.welcomeMessage}
        </div>
      )}

      <header className={`sticky top-0 z-30 ${themeConfig.headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Logo, search, actions */}
          <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100">
            <Link to={`/store/${slug}`} className="flex items-center gap-2.5 shrink-0 group">
              {storeData?.logo ? (
                <img src={storeData.logo} alt={storeData.name} className="h-9 w-auto object-contain rounded-md" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
              )}
              <span className="text-lg font-bold text-slate-900 hidden sm:block">{storeData?.name || 'WhatsApp Store'}</span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-xl mx-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-2 text-slate-500 hover:text-[#25D366] transition-colors hidden sm:block" title="Wishlist">
                <Heart className="w-5 h-5" />
              </button>

              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="p-2 text-slate-600 hover:text-[#25D366] transition-colors"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 z-40 text-xs">
                        <Link to={`/store/${slug}/customer/profile`} onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                          My Profile
                        </Link>
                        <Link to={`/store/${slug}/customer/orders`} onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                          My Orders
                        </Link>
                        <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-medium flex items-center">
                          <LogOut className="w-3.5 h-3.5 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link to={`/store/${slug}/customer/login`} className="p-2 text-slate-600 hover:text-[#25D366] transition-colors">
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>

              <button
                onClick={() => setIsDrawerOpen(true)}
                className={`relative inline-flex items-center px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 ${themeConfig.cartBtn}`}
              >
                <ShoppingBag className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Cart</span>
                {totalItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-[#25D366] border-2 border-[#25D366] rounded-full text-[10px] font-black flex items-center justify-center">
                    {totalItemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="p-2 text-slate-600 lg:hidden"
              >
                {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Row 2: Categories + Nav */}
          <div className="hidden lg:flex items-center gap-6 py-2.5">
            <div className="relative">
              <button
                onClick={() => setIsCatMenuOpen(!isCatMenuOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Menu className="w-4 h-4" />
                Categories
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {isCatMenuOpen && categories.length > 0 && (
                <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40">
                  <button
                    onClick={() => { setSelectedCategory('all'); setIsCatMenuOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-[#f0fdf4] hover:text-[#128C7E]"
                  >
                    All Products
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setSelectedCategory(c.slug || c._id);
                        setIsCatMenuOpen(false);
                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-[#f0fdf4] hover:text-[#128C7E] ${
                        selectedCategory === (c.slug || c._id) ? 'text-[#25D366] bg-[#f0fdf4]' : 'text-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="flex items-center gap-5">
              {navLinks.map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="text-xs font-medium text-slate-600 hover:text-[#25D366] transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {isMobileNavOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {navLinks.map(({ label, action }) => (
                <button
                  key={label}
                  onClick={() => { action(); setIsMobileNavOpen(false); }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-[#f0fdf4] hover:text-[#25D366]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export const StorefrontLayout = () => {
  const { slug } = useParams();
  const { user, logout } = useAuth();
  const { setIsDrawerOpen, totalItemCount, initStoreCart } = useCart();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPreviewMode = searchParams.get('preview') === '1' || location.pathname.endsWith('/preview');

  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (slug) {
      initStoreCart(slug);
      const fetchStore = async () => {
        try {
          const res = await api.get(`/storefront/${slug}`);
          if (res.data?.success) {
            setStoreData(res.data.data.store);
          }
        } catch (err) {
          console.error('Failed to load store:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchStore();
    }
  }, [slug]);

  useEffect(() => {
    if (isPreviewMode && slug) {
      const previewName = searchParams.get('name') || slug;
      const previewTheme = searchParams.get('theme') || 'theme-whatsapp-store';
      setStoreData((prev) => ({
        ...prev,
        name: previewName,
        theme: previewTheme,
        welcomeMessage: 'Preview mode: live storefront preview without sign-in.',
        whatsappWidget: { phoneNumber: '+14155552671' },
      }));
    }
  }, [isPreviewMode, slug, location.search]);

  useEffect(() => {
    if (!slug) return;
    const fetchCategories = async () => {
      try {
        const res = await api.get(`/storefront/${slug}/products`, { params: { category: undefined, search: '' } });
        if (res.data?.success) {
          setCategories(res.data.data.categories || []);
        }
      } catch {
        /* categories optional for header */
      }
    };
    fetchCategories();
  }, [slug]);

  useEffect(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, [location.pathname]);

  const themeConfig = getThemeConfig(storeData?.theme || 'theme-home-decor');
  const isWhatsAppStore = themeConfig.isWhatsAppStore;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#25D366] border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-500">Opening store...</p>
        </div>
      </div>
    );
  }

  const catalogContext = {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
  };

  return (
    <StorefrontCatalogContext.Provider value={catalogContext}>
      <div className={`storefront-theme-shell min-h-screen ${themeConfig.bgPage} ${themeConfig.id} text-slate-900 flex flex-col transition-colors duration-300 font-sans ${isWhatsAppStore ? 'theme-whatsapp-store' : ''}`}>
        {isPreviewMode && (
          <div className="bg-amber-500 text-white text-[11px] font-bold tracking-wide uppercase text-center py-2 px-4">
            Live storefront preview • no sign-in required
          </div>
        )}

        {isWhatsAppStore ? (
          <WhatsAppStoreHeader
            slug={slug}
            storeData={storeData}
            themeConfig={themeConfig}
            user={user}
            logout={logout}
            totalItemCount={totalItemCount}
            setIsDrawerOpen={setIsDrawerOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        ) : (
          <>
            {storeData?.welcomeMessage && (
              <div className="bg-slate-900 text-white text-[11px] py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
                <span>{storeData.welcomeMessage}</span>
                {storeData.address?.city && (
                  <span className="hidden sm:inline opacity-75">• Fast shipping from {storeData.address.city}, {storeData.address.country}</span>
                )}
              </div>
            )}

            <header className={`sticky top-0 z-30 ${themeConfig.headerBg} transition-all`}>
              <div className="max-w-7xl mx-auto flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link to={`/store/${slug}`} className="flex items-center space-x-3 group">
                  {storeData?.logo ? (
                    <img src={storeData.logo} alt={storeData.name} className="h-10 w-auto object-contain rounded-md" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {storeData?.name?.[0] || 'S'}
                    </div>
                  )}
                  <div>
                    <span className={`text-xl font-bold tracking-tight ${themeConfig.fontHeading} text-inherit block leading-tight`}>
                      {storeData?.name || 'WhatsStore'}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                      {themeConfig.name}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user ? (
                      <div>
                        <button
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center space-x-2 py-1.5 px-3 rounded-full border border-slate-200 hover:bg-slate-100/80 text-xs font-semibold"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{user.name?.split(' ')[0]}</span>
                        </button>

                        {isUserMenuOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1 z-40 text-xs">
                            <Link to={`/store/${slug}/customer/profile`} onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                              My Profile
                            </Link>
                            <Link to={`/store/${slug}/customer/orders`} onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
                              My Orders
                            </Link>
                            <button
                              onClick={() => { logout(); setIsUserMenuOpen(false); }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-medium flex items-center"
                            >
                              <LogOut className="w-3.5 h-3.5 mr-2" />
                              Sign Out
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link to={`/store/${slug}/customer/login`} className="inline-flex items-center py-1.5 px-3 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors">
                        <User className="w-3.5 h-3.5 mr-1" />
                        Sign In
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className={`relative inline-flex items-center px-4 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 shadow-sm ${themeConfig.cartBtn}`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    <span>Cart</span>
                    {totalItemCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 bg-white text-slate-900 rounded-full text-[10px] font-black">
                        {totalItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </header>
          </>
        )}

        <main className={`flex-1 w-full mx-auto ${isWhatsAppStore ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
          <Outlet context={{ storeData, themeConfig }} />
        </main>

        <CartDrawer storeSlug={slug} themeConfig={themeConfig} />
        <StorefrontAdvertisementPopup advertisements={storeData?.advertisements} />
        <WhatsAppFloatingWidget config={storeData?.whatsappWidget} storeName={storeData?.name} />
        <CookieConsentBanner />

        {isWhatsAppStore ? (
          <WhatsAppStoreFooter storeData={storeData} slug={slug} />
        ) : (
          <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-xs text-slate-600 text-xs py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="font-bold text-sm text-slate-900 mb-1">{storeData?.name}</p>
                <p className="text-slate-400">{storeData?.copyrightText || '© WhatsStore. All rights reserved.'}</p>
              </div>

              {storeData?.address?.street && (
                <div className="flex items-center space-x-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{storeData.address.street}, {storeData.address.city}, {storeData.address.country}</span>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <span className="text-[11px] text-slate-400">Powered by</span>
                <span className="font-extrabold text-slate-900 tracking-tight">WhatsStore SaaS</span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </StorefrontCatalogContext.Provider>
  );
};
