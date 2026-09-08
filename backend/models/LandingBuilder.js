import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true }, // null = platform level / super admin
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: 'image' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'image/jpeg' },
    storageDriver: { type: String, enum: ['local', 's3', 'wasabi'], default: 'local' },
  },
  { timestamps: true }
);

const customPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    content: { type: String, default: '' },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed', index: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const landingPageConfigSchema = new mongoose.Schema(
  {
    setup: {
      companyName: { type: String, default: 'WhatsStore SaaS' },
      email: { type: String, default: 'support@whatsstore.io' },
      phone: { type: String, default: '+1 (555) 234-5678' },
      address: { type: String, default: '742 Evergreen Terrace, Suite 100, San Francisco, CA' },
      primaryColor: { type: String, default: '#0284c7' },
      secondaryColor: { type: String, default: '#0f172a' },
      accentColor: { type: String, default: '#25D366' },
      sectionOrder: {
        type: Array,
        default: [
          { id: 'header', name: 'Header Navigation', enabled: true },
          { id: 'hero', name: 'Hero Showcase', enabled: true },
          { id: 'features', name: 'Features Grid', enabled: true },
          { id: 'screenshots', name: 'App Screenshots', enabled: true },
          { id: 'themes', name: 'Store Themes Showcase', enabled: true },
          { id: 'whyUs', name: 'Why Choose Us', enabled: true },
          { id: 'about', name: 'About & Mission', enabled: true },
          { id: 'team', name: 'Leadership Team', enabled: true },
          { id: 'reviews', name: 'Customer Reviews', enabled: true },
          { id: 'plans', name: 'Pricing Plans', enabled: true },
          { id: 'faq', name: 'FAQ Section', enabled: true },
          { id: 'newsletter', name: 'Newsletter Signup', enabled: true },
          { id: 'contact', name: 'Contact Form', enabled: true },
          { id: 'footer', name: 'Footer', enabled: true },
        ],
      },
      customCSS: { type: String, default: '' },
      customJS: { type: String, default: '' },
    },

    layout: {
      header: {
        enabled: { type: Boolean, default: true },
        transparent: { type: Boolean, default: false },
        backgroundColor: { type: String, default: '#ffffff' },
        textColor: { type: String, default: '#0f172a' },
        buttonStyle: { type: String, default: 'rounded-lg' },
      },
      hero: {
        enabled: { type: Boolean, default: true },
        layoutStyle: { type: String, default: 'centered' },
        sectionHeight: { type: Number, default: 650 },
        title: { type: String, default: 'Build High-Converting WhatsApp Stores in 3 Minutes' },
        subtitle: { type: String, default: 'Transform your WhatsApp into an automated e-commerce powerhouse. Multi-theme storefronts, direct ordering, instant catalog sync & zero coding.' },
        badge: { type: String, default: '🚀 Next-Gen WhatsApp Commerce Platform' },
        primaryButtonText: { type: String, default: 'Start Free Trial' },
        secondaryButtonText: { type: String, default: 'Explore Themes' },
        heroImage: { type: String, default: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80' },
        heroVideo: { type: String, default: '' },
        imagePosition: { type: String, default: 'right' },
        backgroundColor: { type: String, default: '#f8fafc' },
        textColor: { type: String, default: '#0f172a' },
        overlay: { type: Boolean, default: false },
        overlayColor: { type: String, default: 'rgba(0,0,0,0.2)' },
        statistics: {
          type: Array,
          default: [
            { value: '15,000+', label: 'Active Stores' },
            { value: '$42M+', label: 'Sales Generated' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '4.9/5', label: 'Merchant Rating' },
          ],
        },
      },
      footer: {
        enabled: { type: Boolean, default: true },
        companyDescription: { type: String, default: 'WhatsStore is the world’s most powerful multi-tenant WhatsApp e-commerce engine for modern brands and retailers.' },
        newsletterTitle: { type: String, default: 'Subscribe to Our Newsletter' },
        newsletterSubtitle: { type: String, default: 'Get the latest growth hacks, theme updates & product releases directly in your inbox.' },
        socialLinks: {
          type: Array,
          default: [
            { name: 'Twitter', icon: 'twitter', url: 'https://twitter.com' },
            { name: 'Facebook', icon: 'facebook', url: 'https://facebook.com' },
            { name: 'Instagram', icon: 'instagram', url: 'https://instagram.com' },
            { name: 'YouTube', icon: 'youtube', url: 'https://youtube.com' },
          ],
        },
        linkGroups: {
          type: Object,
          default: {
            product: [{ name: 'Store Themes', url: '#themes' }, { name: 'Features', url: '#features' }, { name: 'Pricing Plans', url: '#plans' }, { name: 'Live Demos', url: '#demos' }],
            company: [{ name: 'About Us', url: '#about' }, { name: 'Leadership', url: '#team' }, { name: 'Careers', url: '#careers' }, { name: 'Contact', url: '#contact' }],
            support: [{ name: 'Help Center', url: '#faq' }, { name: 'Documentation', url: '/docs' }, { name: 'WhatsApp API Status', url: '/status' }, { name: 'Community', url: '/community' }],
            legal: [{ name: 'Terms of Service', url: '/terms' }, { name: 'Privacy Policy', url: '/privacy' }, { name: 'Cookie Policy', url: '/cookies' }, { name: 'GDPR Compliance', url: '/gdpr' }],
          },
        },
      },
    },

    content: {
      features: {
        enabled: { type: Boolean, default: true },
        layoutStyle: { type: String, default: 'grid' },
        columnsCount: { type: Number, default: 3 },
        title: { type: String, default: 'Everything You Need to Scale WhatsApp Sales' },
        description: { type: String, default: 'Engineered for seamless mobile checkout, lightning speed, and maximum conversion rates.' },
        showIcons: { type: Boolean, default: true },
        backgroundColor: { type: String, default: '#ffffff' },
        featureBoxes: {
          type: Array,
          default: [
            { title: 'One-Click WhatsApp Checkout', icon: 'message-circle', description: 'Customers build their cart and send a structured, pre-formatted order directly to your WhatsApp business chat.' },
            { title: '7 Swappable Premium Themes', icon: 'layout', description: 'Switch your store vibe effortlessly between Gadgets, Fashion, Home Decor, Bakery, Grocery, Car Accessories & Toys.' },
            { title: 'Multi-Currency & Tax Engine', icon: 'dollar-sign', description: 'Accept global currencies with cascading Country/State/City taxes and dynamic symbol formatting.' },
            { title: 'PWA Mobile App Ready', icon: 'smartphone', description: 'Your store installs directly to your customer phone home screen with native app icon and offline caching.' },
            { title: 'QR Code Store Generator', icon: 'qr-code', description: 'Instantly download and print high-resolution QR codes for counter tables, packaging boxes, and flyers.' },
            { title: 'Multi-Tenant RBAC & Staff', icon: 'users', description: 'Delegate store management safely with granular module-level permission checkboxes for staff.' },
          ],
        },
      },
      screenshots: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Intuitive Dashboard & Beautiful Storefronts' },
        subtitle: { type: String, default: 'Take a look inside the modern interface designed for effortless commerce.' },
        gallery: {
          type: Array,
          default: [
            { title: 'Store Owner Dashboard', altText: 'Dashboard Screenshot', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80', description: 'Real-time revenue, order tracking, and QR code tools.' },
            { title: 'Home Decor Storefront', altText: 'Storefront Demo', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80', description: 'Clean minimalist aesthetic with quick-view and cart drawer.' },
            { title: 'Gadgets Dark Theme', altText: 'Electronics Theme', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80', description: 'High-contrast modern tech aesthetic with variant specs.' },
          ],
        },
      },
      themes: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Explore Our 7 Tailored Industry Themes' },
        subtitle: { type: String, default: 'Every theme is meticulously optimized for its specific product niche and customer journey.' },
        ctaTitle: { type: String, default: 'Ready to launch your customized store?' },
        ctaDescription: { type: String, default: 'Choose a plan, pick your favorite theme, and start taking WhatsApp orders in under 5 minutes.' },
        primaryBtnText: { type: String, default: 'Get Started Now' },
        secondaryBtnText: { type: String, default: 'View Live Demos' },
      },
      whyUs: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Why Modern Sellers Choose WhatsStore' },
        subtitle: { type: String, default: 'Traditional e-commerce carts have 70% abandonment. WhatsApp direct ordering cuts friction to zero.' },
        reasons: {
          type: Array,
          default: [
            { title: 'Zero App Downloads for Shoppers', icon: 'zap', description: 'Shoppers browse on the web or install as PWA, then complete transactions right inside their favorite messenger.' },
            { title: '98% Message Open Rate', icon: 'trending-up', description: 'WhatsApp notifications boast 98% open rates compared to 20% on traditional email newsletters.' },
            { title: 'No Coding or Complex Setup', icon: 'check-circle', description: 'Manage products, inventory, coupons, and orders from a crystal-clear responsive dashboard.' },
          ],
        },
        statistics: {
          type: Array,
          default: [
            { value: '3.4x', label: 'Higher Conversion Rate', color: '#0284c7' },
            { value: '68%', label: 'Repeat Purchase Ratio', color: '#25D366' },
            { value: '0%', label: 'Marketplace Middleman Cut', color: '#8b5cf6' },
          ],
        },
        ctaTitle: { type: String, default: 'Scale your business with WhatsApp commerce today.' },
        ctaSubtitle: { type: String, default: 'Join thousands of successful merchants across 45+ countries.' },
      },
      about: {
        enabled: { type: Boolean, default: true },
        layoutStyle: { type: String, default: 'side-by-side' },
        imagePosition: { type: String, default: 'left' },
        title: { type: String, default: 'Empowering Next-Generation Digital Merchants' },
        description: { type: String, default: 'We are on a mission to democratize conversational commerce for entrepreneurs, boutiques, supermarkets, and global retail brands.' },
        storyTitle: { type: String, default: 'Our Story' },
        storyContent: { type: String, default: 'Founded with a clear conviction that commerce should happen where conversations happen. WhatsStore combines the power of modern multi-tenant cloud architecture with the intimacy of direct WhatsApp messaging.' },
        image: { type: String, default: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80' },
        backgroundColor: { type: String, default: '#ffffff' },
        parallax: { type: Boolean, default: false },
        values: {
          type: Array,
          default: [
            { title: 'Speed & Reliability', icon: 'cpu', description: 'Sub-second page loads and instantaneous message payload generation.' },
            { title: 'Customer Privacy', icon: 'shield', description: 'Direct peer-to-peer customer communication with no third-party data tracking.' },
            { title: 'Merchant Growth', icon: 'award', description: 'Equipping stores with analytics, coupons, shipping zones, and staff controls.' },
          ],
        },
      },
    },

    social: {
      team: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Meet Our Leadership Team' },
        subtitle: { type: String, default: 'The minds behind the WhatsStore conversational commerce engine.' },
        members: {
          type: Array,
          default: [
            { name: 'Alex Rivera', role: 'CEO & Co-Founder', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'Former Head of E-commerce at Stripe & conversational UI architect.', linkedin: 'https://linkedin.com', email: 'alex@whatsstore.io' },
            { name: 'Sarah Chen', role: 'Chief Technology Officer', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80', bio: 'Distributed systems engineer with 12+ years in multi-tenant SaaS scaling.', linkedin: 'https://linkedin.com', email: 'sarah@whatsstore.io' },
            { name: 'Marcus Johnson', role: 'VP of Product Design', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', bio: 'Award-winning UI/UX designer specialized in mobile commerce micro-interactions.', linkedin: 'https://linkedin.com', email: 'marcus@whatsstore.io' },
          ],
        },
        joinTitle: { type: String, default: 'Want to build the future of commerce with us?' },
        joinDescription: { type: String, default: 'We are always looking for passionate engineers, designers, and marketers.' },
        joinButtonText: { type: String, default: 'View Open Positions' },
      },
      reviews: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Loved by Over 15,000+ Store Owners' },
        subtitle: { type: String, default: 'Read what thriving merchants have to say about WhatsStore SaaS.' },
        trustTitle: { type: String, default: 'Trusted Worldwide' },
        trustStats: {
          type: Array,
          default: [
            { value: '4.9★', label: 'Trustpilot Rating', color: '#25D366' },
            { value: '99.4%', label: 'Retention Rate', color: '#0284c7' },
            { value: '180+', label: 'Countries Supported', color: '#f59e0b' },
          ],
        },
        testimonials: {
          type: Array,
          default: [
            { name: 'Elena Rostova', role: 'Founder & Designer', company: 'Artisan Living Co.', rating: 5, content: 'WhatsStore transformed our boutique sales. Our WhatsApp direct orders tripled within the first month because shoppers love how simple the checkout is!' },
            { name: 'Carlos Mendez', role: 'Managing Director', company: 'GadgetZone Express', rating: 5, content: 'The dark tech theme is slick and the automated order message template saves our customer support staff over 4 hours every single day.' },
            { name: 'Amira Khan', role: 'Head of Operations', company: 'FreshBake Delights', rating: 5, content: 'Being able to set custom cake variants, upload mouthwatering photos, and get instant WhatsApp pings has completely replaced our old clunky webstore.' },
          ],
        },
      },
      plans: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Simple, Transparent Pricing Plans' },
        subtitle: { type: String, default: 'Choose the perfect tier for your business scale. Upgrade or cancel anytime.' },
        faqText: { type: String, default: 'Have questions about plan limits, custom domains, or custom payment gateway integration? Check our FAQ below or chat with our team.' },
      },
    },

    engagement: {
      faq: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Frequently Asked Questions' },
        subtitle: { type: String, default: 'Got questions? We have got answers.' },
        ctaText: { type: String, default: 'Still have questions? Our support team is available 24/7 on WhatsApp.' },
        buttonText: { type: String, default: 'Contact Support' },
        items: {
          type: Array,
          default: [
            { question: 'How do customers place orders on WhatsStore?', answer: 'Customers browse your custom storefront, select items with variants, add them to their cart, and proceed to checkout. The system generates a clean, pre-filled WhatsApp message with order details and sends it directly to your store WhatsApp number.' },
            { question: 'Can I connect my own custom domain?', answer: 'Yes! All Pro and Enterprise plans allow you to map your custom domain (e.g. yourbrand.com) or use a custom subdomain with automatic SSL certificate provisioning.' },
            { question: 'Do I need WhatsApp Business API or coding?', answer: 'No coding is required at all. You can use standard WhatsApp, WhatsApp Business app, or integrate with WhatsApp Cloud API and Telegram bots depending on your preference.' },
            { question: 'Can I accept online payments in addition to WhatsApp chat?', answer: 'Yes! WhatsStore supports over 20+ payment gateways including Stripe, PayPal, Razorpay, Paystack, Bank Transfer, and Cash on Delivery.' },
          ],
        },
      },
      newsletter: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Stay Ahead in the WhatsApp Commerce Revolution' },
        subtitle: { type: String, default: 'Subscribe to get bi-weekly growth strategies, new theme releases, and conversion tips.' },
        privacyText: { type: String, default: 'We respect your privacy. Unsubscribe at any time with one click.' },
        benefits: {
          type: Array,
          default: [
            { icon: 'gift', title: 'Exclusive Playbooks', description: 'Proven WhatsApp marketing templates and broadcast workflows.' },
            { icon: 'shield-check', title: 'Early Feature Access', description: 'Be the first to test new storefront themes and AI tools.' },
          ],
        },
      },
      contact: {
        enabled: { type: Boolean, default: true },
        sectionTitle: { type: String, default: 'Get In Touch' },
        sectionSubtitle: { type: String, default: 'Have a question or need custom enterprise onboarding? Send us a message.' },
        formTitle: { type: String, default: 'Send us a Message' },
        contactInfoTitle: { type: String, default: 'Contact Information' },
        contactInfoDescription: { type: String, default: 'Our global team is here to assist you around the clock.' },
        faqs: {
          type: Array,
          default: [
            { question: 'How fast will I get a response?', answer: 'Our average email response time is under 2 hours during business hours.' },
            { question: 'Do you offer custom store design services?', answer: 'Yes, our enterprise solutions team provides custom branding and catalog migration.' },
          ],
        },
      },
    },
  },
  { timestamps: true }
);

export const MediaFile = mongoose.model('MediaFile', mediaFileSchema);
export const CustomPage = mongoose.model('CustomPage', customPageSchema);
export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export const ContactInquiry = mongoose.model('ContactInquiry', contactInquirySchema);
export const LandingPageConfig = mongoose.model('LandingPageConfig', landingPageConfigSchema);
