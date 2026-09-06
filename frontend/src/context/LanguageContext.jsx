import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const DEFAULT_DICTIONARY = {
  en: {
    dashboard: 'Dashboard',
    companies: 'Companies',
    stores: 'Stores',
    products: 'Products',
    categories: 'Categories',
    orders: 'Orders',
    customers: 'Customers',
    coupons: 'Coupons',
    shipping: 'Shipping',
    analytics: 'Analytics',
    settings: 'Settings',
    plans: 'Plans',
    referral: 'Referral Program',
    media_library: 'Media Library',
    landing_builder: 'Landing Page Builder',
    email_templates: 'Email Templates',
    notification_templates: 'Notification Templates',
    logout: 'Sign Out',
    save_changes: 'Save Changes',
    create_new: 'Create New',
    search: 'Search...',
    apply_filters: 'Apply Filters',
    reset: 'Reset',
    export_csv: 'Export CSV',
    actions: 'Actions',
    status: 'Status',
    price: 'Price',
    add_to_cart: 'Add to Cart',
    checkout: 'Checkout',
    order_now_whatsapp: 'Order via WhatsApp',
  },
  es: {
    dashboard: 'Panel Principal',
    companies: 'Empresas',
    stores: 'Tiendas',
    products: 'Productos',
    categories: 'Categorías',
    orders: 'Pedidos',
    customers: 'Clientes',
    coupons: 'Cupones',
    shipping: 'Envíos',
    analytics: 'Analítica',
    settings: 'Configuración',
    plans: 'Planes',
    referral: 'Programa de Referidos',
    media_library: 'Biblioteca Multimedia',
    landing_builder: 'Constructor de Página',
    email_templates: 'Plantillas de Correo',
    notification_templates: 'Plantillas de Notificación',
    logout: 'Cerrar Sesión',
    save_changes: 'Guardar Cambios',
    create_new: 'Crear Nuevo',
    search: 'Buscar...',
    apply_filters: 'Aplicar Filtros',
    reset: 'Restablecer',
    export_csv: 'Exportar CSV',
    actions: 'Acciones',
    status: 'Estado',
    price: 'Precio',
    add_to_cart: 'Añadir al Carrito',
    checkout: 'Finalizar Compra',
    order_now_whatsapp: 'Pedir por WhatsApp',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    companies: 'الشركات',
    stores: 'المتاجر',
    products: 'المنتجات',
    categories: 'التصنيفات',
    orders: 'الطلبات',
    customers: 'العملاء',
    coupons: 'الكوبونات',
    shipping: 'الشحن',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    plans: 'الباقات والاشتراكات',
    referral: 'نظام الإحالة',
    media_library: 'مكتبة الوسائط',
    landing_builder: 'منشئ الصفحة الرئيسية',
    email_templates: 'قوالب البريد الإلكتروني',
    notification_templates: 'قوالب الإشعارات',
    logout: 'تسجيل الخروج',
    save_changes: 'حفظ التغييرات',
    create_new: 'إضافة جديد',
    search: 'بحث...',
    apply_filters: 'تطبيق الفلاتر',
    reset: 'إعادة ضبط',
    export_csv: 'تصدير CSV',
    actions: 'الإجراءات',
    status: 'الحالة',
    price: 'السعر',
    add_to_cart: 'أضف إلى السلة',
    checkout: 'إتمام الطلب',
    order_now_whatsapp: 'اطلب عبر واتساب',
  },
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('ws_lang') || 'en');
  const [dictionary, setDictionary] = useState(() => {
    try {
      const stored = localStorage.getItem('ws_dict');
      return stored ? JSON.parse(stored) : DEFAULT_DICTIONARY;
    } catch {
      return DEFAULT_DICTIONARY;
    }
  });

  const activeLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪', dir: 'rtl' },
  ];

  const switchLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('ws_lang', langCode);
    const langObj = activeLanguages.find((l) => l.code === langCode);
    document.documentElement.dir = langObj?.dir || 'ltr';
  };

  const t = (key, fallback = '') => {
    const langDict = dictionary[currentLang] || dictionary.en || {};
    return langDict[key] || fallback || key;
  };

  const updateTranslationKey = (langCode, key, label) => {
    setDictionary((prev) => {
      const next = {
        ...prev,
        [langCode]: {
          ...(prev[langCode] || {}),
          [key]: label,
        },
      };
      localStorage.setItem('ws_dict', JSON.stringify(next));
      return next;
    });
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        activeLanguages,
        switchLanguage,
        t,
        dictionary,
        updateTranslationKey,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
