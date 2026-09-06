import React, { useEffect, useState } from 'react';
import {
  MessageCircle,
  Truck,
  ShieldCheck,
  Headphones,
  Clock,
  Star,
  ShoppingBag,
  Eye,
  HeadphonesIcon,
  Shirt,
  CookingPot,
  Sparkles,
  Watch,
  Footprints,
  Baby,
  BookOpen,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

const CATEGORY_ICON_MAP = [
  { match: /electronic|gadget|phone|audio|headphone/i, Icon: HeadphonesIcon },
  { match: /fashion|apparel|cloth|wear/i, Icon: Shirt },
  { match: /home|kitchen|cook|decor|furniture/i, Icon: CookingPot },
  { match: /beauty|cosmetic|makeup|lipstick/i, Icon: Sparkles },
  { match: /watch|accessor/i, Icon: Watch },
  { match: /shoe|footwear|sneaker/i, Icon: Footprints },
  { match: /kid|toy|baby|game/i, Icon: Baby },
  { match: /book|stationery/i, Icon: BookOpen },
];

export const getCategoryIcon = (name = '') => {
  const found = CATEGORY_ICON_MAP.find(({ match }) => match.test(name));
  return found ? found.Icon : Layers;
};

export const StorefrontHero = ({ storeData, themeConfig, onShopNow }) => {
  const whatsappPhone = storeData?.whatsappWidget?.phoneNumber;
  const heroImages = [...new Set([storeData?.bannerImage, themeConfig.heroImage].filter(Boolean))];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [storeData?.bannerImage, themeConfig.heroImage]);

  useEffect(() => {
    if (heroImages.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  const showPreviousImage = () => setActiveImage((current) => (current - 1 + heroImages.length) % heroImages.length);
  const showNextImage = () => setActiveImage((current) => (current + 1) % heroImages.length);

  const handleShopNow = () => {
    if (onShopNow) {
      onShopNow();
      return;
    }
    if (whatsappPhone) {
      const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
      const msg = `Hi! I'd like to browse products at ${storeData?.name || 'your store'}.`;
      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={`relative overflow-hidden rounded-2xl ${themeConfig.heroGradient} p-8 md:p-12 shadow-lg`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-5 z-10">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight ${themeConfig.heroTextColor || 'text-slate-900'} ${themeConfig.fontHeading || ''}`}>
            Shop on WhatsApp
            <span className="block" style={{ color: themeConfig.accentColor }}>Quick, Easy &amp; Secure</span>
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${themeConfig.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {storeData?.storeDescription ||
              storeData?.welcomeMessage ||
              'Buy our latest and high-quality products directly on WhatsApp. Simple & Convenient.'}
          </p>
          <ul className="space-y-2.5">
            {[
              { label: 'Cash on Delivery', icon: Truck },
              { label: 'Secure Payments', icon: ShieldCheck },
              { label: '24/7 Support', icon: Headphones },
            ].map(({ label, icon: Icon }) => (
              <li key={label} className={`flex items-center gap-2.5 text-sm ${themeConfig.isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <Icon className="w-4 h-4" style={{ color: themeConfig.primaryColor }} />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <button
            onClick={handleShopNow}
            className={`inline-flex items-center gap-2 px-6 py-3.5 text-white font-bold rounded-xl text-sm shadow-md transition-transform active:scale-95 ${themeConfig.primaryBtn}`}
          >
            <MessageCircle className="w-5 h-5" />
            Shop on WhatsApp Now
          </button>
        </div>

        <div className="w-full md:w-2/5 flex justify-center z-10">
          <div className="relative">
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl bg-white/60 backdrop-blur-sm shadow-xl flex items-center justify-center overflow-hidden">
              {heroImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`Shop on WhatsApp showcase ${index + 1}`}
                  className={`absolute inset-0 h-full w-full rounded-3xl object-cover transition-opacity duration-700 ${index === activeImage ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              {heroImages.length > 1 && (
                <>
                  <button type="button" onClick={showPreviousImage} aria-label="Previous hero image" className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-md transition hover:bg-white">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={showNextImage} aria-label="Next hero image" className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-md transition hover:bg-white">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-900/35 px-2 py-1">
                    {heroImages.map((image, index) => (
                      <button type="button" key={image} onClick={() => setActiveImage(index)} aria-label={`Show hero image ${index + 1}`} className={`h-1.5 w-1.5 rounded-full transition-colors ${index === activeImage ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={`absolute -bottom-3 -right-3 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${themeConfig.cartBtn}`}>
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const StorefrontCategoryRow = ({ categories, selectedCategory, onSelectCategory }) => {
  if (!categories.length) return null;

  return (
    <section id="categories" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Shop by Categories</h2>
        <button
          onClick={() => onSelectCategory('all')}
          className="text-sm font-semibold text-[#25D366] hover:text-[#128C7E] transition-colors"
        >
          View All Categories
        </button>
      </div>

      <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#25D366] text-white shadow-md ring-4 ring-[#dcf8e8]'
                : 'bg-[#f0fdf4] text-[#128C7E] group-hover:bg-[#dcf8e8]'
            }`}
          >
            <Layers className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-slate-700 text-center max-w-[72px]">All</span>
        </button>

        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.name);
          const catKey = cat.slug || cat._id;
          const isActive = selectedCategory === catKey;

          return (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(catKey)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#25D366] text-white shadow-md ring-4 ring-[#dcf8e8]'
                    : 'bg-[#f0fdf4] text-[#128C7E] group-hover:bg-[#dcf8e8]'
                }`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center max-w-[72px] line-clamp-2">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export const StorefrontAdvertisements = ({ advertisements = [] }) => {
  if (!advertisements.length) return null;

  return (
    <section aria-label="Store advertisements" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Featured Offers</h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sponsored</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {advertisements.map((ad) => {
          const content = (
            <div className="relative min-h-36 overflow-hidden rounded-2xl bg-slate-900 shadow-sm group">
              <img src={ad.imageUrl} alt={ad.title} className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-transparent" />
              <div className="relative z-10 max-w-md p-5 text-white">
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Featured offer</p>
                <h3 className="mt-1 text-lg font-black">{ad.title}</h3>
                {ad.description && <p className="mt-1 text-xs text-white/80 line-clamp-2">{ad.description}</p>}
                {ad.linkUrl && <span className="inline-block mt-3 text-xs font-bold underline underline-offset-2">Shop offer</span>}
              </div>
            </div>
          );

          return ad.linkUrl ? <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noreferrer">{content}</a> : <div key={ad.id}>{content}</div>;
        })}
      </div>
    </section>
  );
};

export const StorefrontAdvertisementPopup = ({ advertisements = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [advertisement, setAdvertisement] = useState(null);

  useEffect(() => {
    const nextAdvertisement = advertisements[0];
    if (!nextAdvertisement) return undefined;

    const dismissedKey = `storefront-ad-dismissed-${nextAdvertisement.id}`;
    if (sessionStorage.getItem(dismissedKey)) return undefined;

    const timer = window.setTimeout(() => {
      setAdvertisement(nextAdvertisement);
      setIsOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [advertisements]);

  const closePopup = () => {
    if (advertisement?.id) {
      sessionStorage.setItem(`storefront-ad-dismissed-${advertisement.id}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !advertisement) return null;

  const content = (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
      <img src={advertisement.imageUrl} alt={advertisement.title} className="h-52 w-full object-cover opacity-90 sm:h-64" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Special offer</p>
        <h2 className="mt-1 text-xl font-black sm:text-2xl">{advertisement.title}</h2>
        {advertisement.description && <p className="mt-1 max-w-md text-xs leading-relaxed text-white/80">{advertisement.description}</p>}
        {advertisement.linkUrl && <span className="mt-3 inline-block text-xs font-bold underline underline-offset-2">Shop offer</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={advertisement.title}>
      <div className="relative w-full max-w-lg animate-slide-up">
        <button onClick={closePopup} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/75" aria-label="Close advertisement">
          <X className="h-4 w-4" />
        </button>
        {advertisement.linkUrl ? (
          <a href={advertisement.linkUrl} target="_blank" rel="noreferrer" onClick={closePopup}>{content}</a>
        ) : content}
      </div>
    </div>
  );
};

export const StorefrontFeaturesBar = () => (
  <section className="bg-[#f0fdf4] rounded-2xl py-8 px-4 sm:px-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { icon: Truck, title: '1-2 Day Delivery', desc: 'On all orders' },
        { icon: ShieldCheck, title: 'Quality Products', desc: '100% Guaranteed' },
        { icon: Clock, title: 'Fast Delivery', desc: 'Inside the city' },
        { icon: Headphones, title: '24/7 Support', desc: 'Live Chat / Email' },
      ].map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <Icon className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const StorefrontPromoBanner = ({ storeData, onShopNow }) => {
  const coupon = storeData?.featuredCoupon;
  const discountLabel = coupon
    ? coupon.discountType === 'percentage'
      ? `${coupon.discountValue}% OFF`
      : `${formatCurrency(coupon.discountValue)} OFF`
    : '10% OFF';
  const couponCode = coupon?.code || 'WELCOME10';

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#128C7E] to-[#25D366] p-8 md:p-10 text-white">
      <div className="relative z-10 max-w-lg space-y-3">
        <h3 className="text-2xl sm:text-3xl font-black">Get {discountLabel}</h3>
        <p className="text-white/90 text-sm sm:text-base">
          On your first order. Use Code:{' '}
          <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{couponCode}</span>
        </p>
        <button
          onClick={onShopNow}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#128C7E] font-bold rounded-lg text-sm hover:bg-white/90 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Shop on WhatsApp
        </button>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:flex items-center justify-center opacity-20">
        <MessageCircle className="w-48 h-48" />
      </div>
    </section>
  );
};

export const StorefrontTestimonials = () => {
  const reviews = [
    { name: 'Sarah M.', text: 'Ordering via WhatsApp was so easy! Got my products delivered in 2 days.', rating: 5 },
    { name: 'James K.', text: 'Great prices and the WhatsApp support team answered all my questions instantly.', rating: 5 },
    { name: 'Priya R.', text: 'Love the cash on delivery option. Will definitely order again!', rating: 5 },
  ];

  return (
    <section id="testimonials" className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center">What Our Customers Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reviews.map((review) => (
          <div key={review.name} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-0.5 mb-3">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
            <p className="text-xs font-bold text-slate-900">{review.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const WhatsAppProductCard = ({
  product,
  themeConfig,
  storeName,
  storeLogo,
  storeWhatsAppPhone,
  onQuickView,
  onQuickAdd,
  isAdded,
}) => {
  const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
  const price = hasDiscount ? product.salePrice : product.price;
  const discountPct = hasDiscount ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  const handleWhatsAppOrder = (e) => {
    e.stopPropagation();
    const cleanPhone = (storeWhatsAppPhone || '+14155552671').replace(/[^0-9]/g, '');
    const msg = `Hi! I want to order "${product.name}" for ${formatCurrency(price)}.`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className={`group cursor-pointer overflow-visible transition-all duration-300 ${themeConfig?.productCard || 'bg-white border border-slate-100 shadow-sm hover:shadow-lg'} ${themeConfig?.cardRadius || 'rounded-2xl'} flex flex-col`}
    >
      {product.badge && (
        <span className={`absolute -top-3 left-3 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md -rotate-3 ${themeConfig?.saleBadge || 'bg-[#25D366] text-white'}`}>
          {product.badge}
        </span>
      )}
      {hasDiscount && (
        <span className={`absolute -top-3 ${product.badge ? 'right-3' : 'left-3'} z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md rotate-3 bg-rose-600 text-white`}>
          {discountPct}% OFF
        </span>
      )}
      <div className="aspect-square bg-slate-50 relative overflow-hidden">
        <img
          src={product.thumbnail || 'https://via.placeholder.com/400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider">
          <span className="text-slate-400 truncate">
            {product.categoryId?.name || 'General'}
          </span>
          <span className={`shrink-0 ${product.stockQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
          </span>
        </div>
        <div className="flex items-center gap-0.5 mb-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <h3 className={`font-semibold text-sm line-clamp-2 mb-2 group-hover:opacity-70 transition-colors ${themeConfig?.isDark ? 'text-white' : 'text-slate-900'} ${themeConfig?.fontHeading || ''}`}>
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mb-3 mt-auto">
          <span className={`text-lg font-black ${themeConfig?.isDark ? 'text-white' : ''}`} style={{ color: themeConfig?.isDark ? undefined : themeConfig?.primaryColor }}>{formatCurrency(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through font-mono">{formatCurrency(product.price)}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleWhatsAppOrder}
            className={`flex-1 py-2 px-3 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${themeConfig?.primaryBtn || 'bg-[#25D366] hover:bg-[#20ba59]'}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Order on WhatsApp
          </button>
          <button
            onClick={(e) => onQuickAdd(product, e)}
            className={`p-2 rounded-lg border transition-colors ${themeConfig?.isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} ${isAdded ? 'cart-add-pop' : ''}`}
            title="Add to cart"
          >
            <ShoppingBag className={`w-4 h-4 ${isAdded ? 'cart-add-icon' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const WhatsAppStoreFooter = ({ storeData, slug }) => {
  const address = storeData?.address;
  const social = storeData?.socialLinks || {};
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    setSubscribing(true);
    try {
      const res = await api.post('/storefront/newsletter/subscribe', { email: email.trim() });
      if (res.data?.success) {
        toast.success(res.data.message || 'Subscribed successfully!');
        setEmail('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer id="contact" className="mt-auto bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <p className="font-bold text-lg text-slate-900">{storeData?.name || 'WhatsApp Store'}</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {storeData?.storeDescription || 'Your trusted online store with instant WhatsApp ordering.'}
            </p>
            <div className="flex items-center gap-3">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] text-xs font-semibold">
                  FB
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] text-xs font-semibold">
                  IG
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] text-xs font-semibold">
                  X
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] text-xs font-semibold">
                  YT
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#25D366]">Home</button></li>
              <li><button onClick={() => scrollTo('products')} className="hover:text-[#25D366]">Shop</button></li>
              <li><button onClick={() => scrollTo('categories')} className="hover:text-[#25D366]">Collection</button></li>
              <li><button onClick={() => scrollTo('contact')} className="hover:text-[#25D366]">About Us</button></li>
              <li><a href={`/store/${slug}/customer/orders`} className="hover:text-[#25D366]">Track Order</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3">Customer Service</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><button onClick={() => scrollTo('contact')} className="hover:text-[#25D366]">Help Center</button></li>
              <li><button onClick={() => scrollTo('contact')} className="hover:text-[#25D366]">Returns</button></li>
              <li><button onClick={() => scrollTo('contact')} className="hover:text-[#25D366]">Shipping</button></li>
              <li><button onClick={() => scrollTo('contact')} className="hover:text-[#25D366]">Privacy Policy</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3">Contact Us</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              {address?.street && <li>{address.street}</li>}
              {(address?.city || address?.country) && (
                <li>{[address.city, address.state, address.country].filter(Boolean).join(', ')}</li>
              )}
              {storeData?.whatsappWidget?.phoneNumber && (
                <li>{storeData.whatsappWidget.phoneNumber}</li>
              )}
              {storeData?.email && <li>{storeData.email}</li>}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3">Newsletter</h4>
            <p className="text-xs text-slate-500 mb-3">Subscribe for updates and offers.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {subscribing ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>{storeData?.copyrightText || '© WhatsStore. All rights reserved.'}</p>
          <div className="flex items-center gap-3 opacity-60">
            <span className="font-semibold">Visa</span>
            <span className="font-semibold">Mastercard</span>
            <span className="font-semibold">UPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
