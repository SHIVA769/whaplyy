import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CirclePlay,
  Menu,
  MessageCircle,
  PackageCheck,
  QrCode,
  ShoppingBag,
  Store,
  Smartphone,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { BrandLogo } from '../components/common/BrandLogo';

const featureItems = [
  { icon: PackageCheck, title: 'Easy Setup', text: 'Create your store in just a few minutes.' },
  { icon: MessageCircle, title: 'No Commissions', text: 'Keep more of what you earn with every order.' },
  { icon: Smartphone, title: 'WhatsApp Integrated', text: 'Sell where your customers already chat.' },
  { icon: ShoppingBag, title: 'Carts & Orders', text: 'Make buying simple from first click to checkout.' },
  { icon: QrCode, title: 'Secure & Reliable', text: 'A fast, trusted storefront for your business.' },
];

export const LandingPage = () => {
  const [landingData, setLandingData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const res = await api.get('/storefront/landing');
        if (res.data?.success) setLandingData(res.data.data.landing);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      }
    };
    fetchLanding();
  }, []);

  useEffect(() => {
    const revealItems = document.querySelectorAll('.landing-reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14 }
    );

    document.querySelector('.landing-page')?.classList.add('reveal-ready');
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const companyName = landingData?.setup?.companyName || 'WhatsStore';
  const heroVideo = landingData?.layout?.hero?.heroVideo;

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#fbfffc] text-[#12372b]">
      <header className="landing-header">
        <div className="landing-shell flex h-[76px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="WhatsStore home">
            <BrandLogo className="h-14 w-auto max-w-[230px] rounded-xl" />
          </Link>
          <nav className={`${menuOpen ? 'flex' : 'hidden'} landing-nav absolute left-4 right-4 top-[68px] flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl md:static md:flex md:flex-row md:items-center md:gap-7 md:bg-transparent md:p-0 md:shadow-none`}>
            <a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#themes">Categories</a><a href="#pricing">Pricing</a><a href="#contact">Contact</a>
          </nav>
          <div className="hidden items-center gap-5 md:flex"><Link to="/login" className="text-sm font-bold text-[#173c2d] hover:text-[#0aa76d]">Login</Link><Link to="/register" className="landing-button landing-button-small">Get Started <ArrowRight className="h-4 w-4" /></Link></div>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-shell grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
            <div className="relative z-10 max-w-xl"><div className="landing-kicker"><span className="h-2 w-2 rounded-full bg-[#0aa76d]" /> WhatsApp Commerce Made Simple</div><h1>Sell on WhatsApp.<br /><span>Grow Your Business.</span></h1><p className="landing-lede">Waply helps you set up your own online store and start taking orders on WhatsApp in just a few minutes.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/register" className="landing-button">Start Your Store Now <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={() => setHowItWorksOpen(true)} className="landing-button landing-button-quiet"><CirclePlay className="h-4 w-4" /> How It Works</button></div><div className="landing-proof-row"><div><span className="proof-icon"><Store /></span><strong>Create Your Store</strong><small>Set up in 2 minutes</small></div><div><span className="proof-icon"><MessageCircle /></span><strong>Share on WhatsApp</strong><small>Share with customers</small></div><div><span className="proof-icon"><PackageCheck /></span><strong>Receive Orders</strong><small>Get orders on WhatsApp</small></div></div></div>
            <div className="landing-visual" aria-label="Waply app preview"><div className="hero-blob hero-blob-one" /><div className="hero-blob hero-blob-two" /><div className="hero-blob hero-blob-three" /><div className="hero-receipt-lines" /><div className="hero-scan-line" /><div className="hero-product-card hero-product-one"><img src="/WhatsApp%20Image%202026-08-21%20at%208.52.09%20PM.jpeg" alt="Product preview" /><span>New listing</span><b>In your store</b></div><div className="hero-product-card hero-product-two"><img src="/WhatsApp%20Image%202026-08-21%20at%209.23.54%20PM.jpeg" alt="Store preview" /><span>Popular item</span><b>12 orders today</b></div><span className="hero-float hero-float-cart"><ShoppingBag /></span><span className="hero-float hero-float-chat"><MessageCircle /></span><span className="hero-float hero-float-check"><Check /></span><span className="hero-cart-runner"><ShoppingBag /></span><div className="hero-visual-overlay" /><div className="hero-screenshot-frame">{heroVideo ? <video autoPlay muted loop playsInline poster="/assets/hero-screenshot.png" aria-label="Waply app animation"><source src={heroVideo} type="video/mp4" /></video> : <img src="/assets/hero-screenshot.png" onError={(event) => { event.currentTarget.src = '/WhatsApp%20Image%202026-08-21%20at%209.23.54%20PM.jpeg'; }} alt="Waply app screenshot" />}</div></div>
          </div>
        </section>

        <section className="landing-flow landing-reveal"><div className="landing-shell"><div className="section-heading"><span>YOUR STORE IN MOTION</span><h2>From Product to Order, Seamlessly</h2><p>Every step of your customer journey works together in one simple storefront.</p></div><div className="flow-track"><div className="flow-step"><div className="flow-visual flow-product-visual"><img src="/WhatsApp%20Image%202026-08-21%20at%208.52.09%20PM.jpeg" alt="Product added to a store" /><ShoppingBag /></div><strong>Add products</strong><span>Showcase what you sell</span></div><div className="flow-arrow"><ArrowRight /></div><div className="flow-step"><div className="flow-visual flow-share-visual"><MessageCircle /><span>Shared on WhatsApp</span></div><strong>Share your link</strong><span>Reach customers instantly</span></div><div className="flow-arrow"><ArrowRight /></div><div className="flow-step"><div className="flow-visual flow-order-visual"><PackageCheck /><b>Order received</b></div><strong>Grow with every order</strong><span>Keep sales moving</span></div></div></div></section>
        <section id="how-it-works" className="landing-steps landing-reveal"><div className="landing-shell"><div className="section-heading"><span>HOW IT WORKS</span><h2>Start Selling in 3 Simple Steps</h2></div><div className="steps-row"><div><b>1</b><strong>Create Your Store</strong><p>Sign up and create your online store in just 2 minutes.</p></div><div><b>2</b><strong>Add &amp; Share Products</strong><p>Add products and share your store link on WhatsApp.</p></div><div><b>3</b><strong>Receive Orders</strong><p>Customers place orders and you receive them on WhatsApp.</p></div></div></div></section>
        <section id="features" className="landing-features landing-reveal"><div className="landing-shell"><div className="section-heading"><span>WHY CHOOSE WAPLY?</span><h2>Everything You Need to Sell Online</h2><p>Powerful tools to help you start, grow, and manage your online business.</p></div><div className="feature-row">{featureItems.map(({ icon: Icon, title, text }) => <div className="feature-item" key={title}><div className="feature-icon"><Icon /></div><strong>{title}</strong><p>{text}</p></div>)}</div></div></section>
        <section className="landing-cta landing-reveal"><div className="landing-shell"><div><h2>Ready to Grow Your<br />Business <span>with Waply?</span></h2><p>Join thousands of sellers who are already growing their business with Waply.</p><Link to="/register" className="landing-button">Start Your Store Now <ArrowRight className="h-4 w-4" /></Link></div><div className="cta-portrait" /></div></section>
        <section className="landing-stats landing-reveal"><div className="landing-shell"><div><strong>10K+</strong><span>Happy Sellers</span></div><div><strong>1L+</strong><span>Orders Delivered</span></div><div><strong>50K+</strong><span>Products Listed</span></div><div><strong>24/7</strong><span>Support</span></div></div></section>
      </main>
      {howItWorksOpen && (
        <div className="how-it-works-modal" role="dialog" aria-modal="true" aria-label="How Waply works" onClick={() => setHowItWorksOpen(false)}>
          <div className="how-it-works-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="how-it-works-close" onClick={() => setHowItWorksOpen(false)} aria-label="Close video"><X /></button>
            <video autoPlay controls playsInline poster="/assets/hero-screenshot.png" aria-label="How Waply works video">
              <source src={heroVideo || '/uploads/hero-demo.mp4'} type="video/mp4" />
            </video>
          </div>
        </div>
      )}
      <footer id="contact" className="landing-footer">© WhatsStore. Sell simply, grow freely.</footer>
    </div>
  );
};
