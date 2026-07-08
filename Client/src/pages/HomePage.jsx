import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ChevronRight, Play, Star, ArrowRight, Clock } from 'lucide-react';
import { fetchProducts, fetchFeatured, fetchNewArrivals, fetchBestSellers } from '../redux/slices/productsSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import { fetchBanners } from '../redux/slices/bannersSlice';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import ExclusiveCollection from '../components/ExclusiveCollection';
import Footer from '../components/Footer';

/* ── Countdown Timer hook ─────────────────────────────────────────────────── */
const useCountdown = (targetDate) => {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  });
  return time;
};

/* ── Scroll-reveal wrapper (Vengeance UI pattern — manual impl w/ Framer Motion + IntersectionObserver) */
const ScrollReveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── Countdown Unit ──────────────────────────────────────────────────────── */
const CountUnit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-text flex items-center justify-center">
      <span className="font-playfair text-2xl md:text-3xl font-bold text-white">{String(value).padStart(2,'0')}</span>
    </div>
    <span className="text-xs text-brand-grey mt-2 uppercase tracking-widest">{label}</span>
  </div>
);

/* ── Section Header ──────────────────────────────────────────────────────── */
const SectionHeader = ({ eyebrow, title, subtitle, centered = true }) => (
  <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
    {eyebrow && <p className="text-brand-gold text-xs font-medium tracking-[0.2em] uppercase mb-3">{eyebrow}</p>}
    <h2 className="font-playfair text-h2-sm md:text-h2 font-semibold text-brand-text">{title}</h2>
    {subtitle && <p className="text-brand-grey mt-3 text-base max-w-xl mx-auto">{subtitle}</p>}
  </div>
);

/* ── Brand logos ─────────────────────────────────────────────────────────── */
const brandLogos = [
  { name: 'Sabyasachi', abbr: 'SB' }, { name: 'Manish Malhotra', abbr: 'MM' },
  { name: 'Tarun Tahiliani', abbr: 'TT' }, { name: 'Abu Jani Sandeep', abbr: 'AJ' },
  { name: 'Ritu Kumar', abbr: 'RK' }, { name: 'Raw Mango', abbr: 'RM' },
  { name: 'Anita Dongre', abbr: 'AD' }, { name: 'Gaurav Gupta', abbr: 'GG' },
];

/* ── Influencer data ──────────────────────────────────────────────────────── */
const influencers = [
  { name: 'Meera Kapoor', handle: '@meerakapoor_style', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400', products: 12, followers: '2.1M' },
  { name: 'Riya Ahuja', handle: '@bystyleria', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400', products: 8, followers: '890K' },
  { name: 'Priya Fashion', handle: '@priyafashionofficial', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', products: 19, followers: '3.4M' },
  { name: 'Sana Glam', handle: '@sanaglam_india', img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', products: 6, followers: '560K' },
];

/* ── Blog/Editorial Teasers ──────────────────────────────────────────────── */
const editorials = [
  { title: 'The Art of Draping: 7 Saree Styles for Every Occasion', category: 'Style Guide', date: 'June 28, 2025', img: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600', readTime: '5 min read' },
  { title: 'Fragrance Notes Decoded: Building Your Signature Scent', category: 'Perfumery', date: 'June 20, 2025', img: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600', readTime: '4 min read' },
  { title: 'From Bazaar to Runway: How Indian Craft Goes Global', category: 'Fashion', date: 'June 14, 2025', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600', readTime: '7 min read' },
];

/* ── Testimonials ─────────────────────────────────────────────────────────── */
const testimonials = [
  { name: 'Priya N., Mumbai', rating: 5, text: 'The Rose Gold Lehenga Set was even more stunning in person. Received so many compliments at the wedding. Packaging was luxurious too!' },
  { name: 'Anjali S., Delhi', rating: 5, text: 'Absolutely love the Oud Royale perfume — it lasts all day and gets me compliments wherever I go. Will definitely order again.' },
  { name: 'Kavya R., Hyderabad', rating: 5, text: 'The Kundan Polki Necklace Set is a work of art. My mother cried when she saw it. Worth every rupee.' },
];

/* ══════════════════════════════════════════════════════════════════════════
 * HOME PAGE — 11 sections
 * ══════════════════════════════════════════════════════════════════════════ */
const HomePage = () => {
  const dispatch = useDispatch();
  const { items: products, featured, newArrivals, bestSellers, loading } = useSelector(s => s.products);
  const { items: categories } = useSelector(s => s.categories);
  const { items: banners } = useSelector(s => s.banners);
  const [activeTab, setActiveTab] = useState('all');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [dbInfluencers, setDbInfluencers] = useState([]);

  // Countdown target — 3 days from now (seeded countdown banner)
  const countdown = useCountdown(new Date(Date.now() + 3 * 86400000));

  useEffect(() => {
    dispatch(fetchProducts({ limit: 16 }));
    dispatch(fetchFeatured());
    dispatch(fetchNewArrivals(8));
    dispatch(fetchBestSellers(8));
    dispatch(fetchCategories());
    dispatch(fetchBanners('HERO'));
    
    // Fetch active affiliates
    api.get('/affiliates')
      .then(res => {
        const active = (res.data.affiliates || []).filter(a => a.isActive);
        if (active.length) {
          const mapped = active.map((aff, i) => ({
            name: aff.name,
            handle: `@${aff.referralCode.toLowerCase()}_style`,
            img: i === 0 ? 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400'
               : i === 1 ? 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400'
               : i === 2 ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
               : 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
            products: aff.totalOrders || 12,
            followers: aff.totalClicks > 1000 ? `${(aff.totalClicks/1000).toFixed(1)}M` : `${aff.totalClicks || 150} followers`,
          }));
          setDbInfluencers(mapped);
        }
      })
      .catch(err => console.error(err));

    // SEO meta
    document.title = 'Billu Bazaar — India\'s Luxury Fashion Destination';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Discover luxury party wear, jewelry, perfumes and accessories at Billu Bazaar. Handcrafted, curated, and delivered with love across India.');
  }, [dispatch]);

  const featuredProducts = (featured.length ? featured : products).slice(0, 8);
  
  const getCategorySlug = (tabId) => {
    if (tabId === 'party') return 'party-wear';
    return tabId;
  };

  const displayNewArrivals = newArrivals.length ? newArrivals : products;
  const filteredProducts = activeTab === 'all'
    ? displayNewArrivals.slice(0, 8)
    : activeTab === 'featured'
      ? featuredProducts
      : displayNewArrivals.filter(p => p.category?.slug === getCategorySlug(activeTab)).slice(0, 8);

  const parentCategories = categories.filter(c => !c.parentId).slice(0, 8);

  return (
    <main id="main-content">
      {/* ── SECTION 1: Hero Banner Carousel ──────────────────────────────── */}
      <HeroBanner />

      {/* ── SECTION 2: Category Quick-Nav Grid ──────────────────────────── */}
      <section className="py-16 md:py-24 bg-brand-bg" aria-label="Browse categories">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <ScrollReveal>
            <SectionHeader eyebrow="Shop by Category" title="Curated for Every Occasion" />
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {(parentCategories.length ? parentCategories : [
              { id: 1, name: 'Party Wear', slug: 'party-wear', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300' },
              { id: 2, name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300' },
              { id: 3, name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=300' },
              { id: 4, name: 'Perfumes', slug: 'perfumes', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=300' },
              { id: 5, name: 'Jewelry', slug: 'jewelry', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=300' },
              { id: 6, name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
            ]).map((cat, i) => (
              <ScrollReveal key={cat.id} delay={i * 0.08} className="col-span-1">
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:rounded-lg"
                  id={`cat-nav-${cat.id}`}
                >
                  <div className="relative w-full aspect-square rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-gold transition-all duration-300 shadow-sm">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <span className="font-inter text-xs font-medium text-brand-text text-center group-hover:text-brand-gold transition-colors">
                    {cat.name}
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Countdown / Deal of the Month Banner ────────────── */}
      <section className="bg-brand-text py-12 md:py-16 overflow-hidden" aria-label="Deal of the month countdown">
        <div className="max-w-site mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <span className="bg-brand-gold text-white text-[10px] font-bold px-3 py-1 tracking-wider uppercase">52% OFF</span>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mt-3 mb-2">Deal of the Month</h2>
            <p className="text-white/70 text-base max-w-sm">
              Emerald Silk Kaftan — handcrafted luxury at an extraordinary price. Offer ends when the clock hits zero.
            </p>
            <Link to="/products/emerald-silk-kaftan" className="btn-primary mt-6 inline-block" id="deal-cta">
              Grab the Deal — ₹4,999
            </Link>
          </div>

          {/* Product Preview */}
          <div className="relative w-56 h-64 flex-shrink-0 hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400"
              alt="Emerald Silk Kaftan — Deal of the Month"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/60 text-xs tracking-widest uppercase flex items-center gap-2">
              <Clock size={14} /> Offer Ends In
            </p>
            <div className="flex items-center gap-3">
              <CountUnit value={countdown.d} label="Days" />
              <span className="text-white text-3xl font-bold mb-6">:</span>
              <CountUnit value={countdown.h} label="Hours" />
              <span className="text-white text-3xl font-bold mb-6">:</span>
              <CountUnit value={countdown.m} label="Min" />
              <span className="text-white text-3xl font-bold mb-6">:</span>
              <CountUnit value={countdown.s} label="Sec" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: New Arrivals Carousel + Filter Tabs ──────────────── */}
      <section className="py-16 md:py-24 bg-white" aria-label="New arrivals">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <SectionHeader eyebrow="Fresh In" title="New Arrivals" centered={false} />
              <Link to="/products?newArrival=true" className="btn-outline flex items-center gap-2 whitespace-nowrap self-start md:self-auto" id="new-arrivals-cta">
                View All <ChevronRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Product filter tabs">
            {[
              { id: 'all', label: 'All' },
              { id: 'featured', label: 'Featured' },
              { id: 'party', label: 'Party Wear' },
              { id: 'jewelry', label: 'Jewelry' },
              { id: 'perfumes', label: 'Perfumes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                id={`tab-${tab.id}`}
                className={`px-5 py-2 text-sm font-medium whitespace-nowrap border transition-all duration-200 focus-visible:outline-brand-gold ${
                  activeTab === tab.id
                    ? 'bg-brand-text text-white border-brand-text'
                    : 'bg-transparent text-brand-grey border-brand-light hover:border-brand-text hover:text-brand-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product grid — staggered entrance via ProductCard */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white shadow-sm">
                  <div className="skeleton aspect-[3/4]" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 5: Exclusive Collection Carousel (HP-08) ────────────── */}
      <ExclusiveCollection />

      {/* ── SECTION 6: Curated Collection Editorial Banner ──────────────── */}
      <section className="py-16 md:py-24 bg-brand-light" aria-label="Curated collection">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-0 shadow-lg overflow-hidden">
            <div className="relative aspect-[4/5] md:aspect-auto">
              <img
                src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800"
                alt="The Bridal Edit — Billu Bazaar"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <ScrollReveal className="bg-brand-text flex items-center p-10 md:p-16">
              <div>
                <p className="text-brand-gold text-xs tracking-[0.2em] uppercase mb-4">Exclusive Curation</p>
                <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
                  The Bridal Edit 2025
                </h2>
                <p className="text-white/70 text-base leading-relaxed mb-8">
                  From Kundan Polki to Banarasi silk, our bridal specialists have curated timeless pieces that will become your family's heirlooms. Every piece, a story.
                </p>
                <div className="flex flex-col gap-3">
                  <Link to="/products?tag=bridal" className="btn-primary" id="bridal-cta">
                    Explore Bridal Collection
                  </Link>
                  <p className="text-white/40 text-xs">Personal styling consultation available — <Link to="/account?tab=shopper" className="underline hover:text-brand-gold transition-colors">Book Now</Link></p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Video CTA Banner ─────────────────────────────────── */}
      <section className="relative h-96 md:h-[500px] overflow-hidden flex items-center justify-center" aria-label="Brand video">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1570976447640-ac859083963f?w=1440)' }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <ScrollReveal className="relative z-10 text-center px-6">
          <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-4">Behind the Collection</p>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-white mb-6">Where Craft Meets Couture</h2>
          <p className="text-white/70 text-base mb-8 max-w-md mx-auto">
            Watch how our master artisans breathe life into every piece — from Jaipur's workshops to your wardrobe.
          </p>
          <button
            onClick={() => setVideoPlaying(true)}
            className="group flex items-center gap-4 mx-auto focus-visible:outline-white"
            aria-label="Play brand video"
            id="video-play-btn"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center shadow-gold"
            >
              <Play size={24} fill="white" className="text-white ml-1" />
            </motion.div>
            <span className="text-white font-medium">Watch Our Story</span>
          </button>
        </ScrollReveal>
      </section>

      {/* ── SECTION 8: Dual Promo Tiles ─────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white" aria-label="Promotional offers">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Promo tile 1 */}
            <ScrollReveal delay={0} className="group relative overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800"
                alt="Jewelry Collection — Up to 30% off"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <span className="bg-brand-gold text-white text-sm font-bold px-3 py-1 self-start mb-3">Up to 30% OFF</span>
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2">Fine Jewelry</h3>
                <p className="text-white/70 text-sm mb-4">Kundan, Polki, Diamonds & more</p>
                <Link to="/products?category=jewelry" className="text-brand-gold font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all focus-visible:outline-white" id="promo-jewelry">
                  Shop Now <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            {/* Promo tile 2 */}
            <ScrollReveal delay={0.15} className="group relative overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1541643600914-78b084683702?w=800"
                alt="Perfume Collection — Buy 2 Get 1 Free"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <span className="bg-brand-text text-white text-sm font-bold px-3 py-1 self-start mb-3">Buy 2, Get 1 Free</span>
                <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2">Signature Fragrances</h3>
                <p className="text-white/70 text-sm mb-4">Oud, Rose, Vetiver & more</p>
                <Link to="/products?category=perfumes" className="text-brand-gold font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all focus-visible:outline-white" id="promo-perfumes">
                  Shop Now <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: Influencer Showcase ──────────────────────────────── */}
      <section className="py-16 md:py-24 bg-brand-bg" aria-label="Style influencers">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <ScrollReveal>
            <SectionHeader eyebrow="As Seen On" title="Style Diaries" subtitle="Our favourite curators wearing Billu Bazaar" />
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {(dbInfluencers.length ? dbInfluencers : influencers).map((person, i) => (
              <ScrollReveal key={person.handle} delay={i * 0.1}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-[3/4] overflow-hidden mb-4">
                    <img
                      src={person.img}
                      alt={person.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-medium text-sm px-4 py-2 border border-white">
                        Shop Her Look
                      </span>
                    </div>
                  </div>
                  <p className="font-medium text-sm text-brand-text">{person.name}</p>
                  <p className="text-brand-gold text-xs">{person.handle}</p>
                  <p className="text-brand-grey text-xs mt-1">{person.followers} followers · {person.products} products</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 10: Sponsor/Brand Logo Strip (Marquee) ──────────────── */}
      <section className="py-10 border-y border-brand-light overflow-hidden bg-white" aria-label="Brand partners">
        <div className="relative">
          <motion.div
            className="flex gap-16 items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          >
            {[...brandLogos, ...brandLogos].map((brand, i) => (
              <div key={`${brand.name}-${i}`} className="flex-shrink-0 flex items-center gap-3 opacity-40 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-brand-text rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{brand.abbr}</span>
                </div>
                <span className="font-playfair text-lg font-semibold text-brand-text whitespace-nowrap">{brand.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 11: Best Sellers + Testimonials ─────────────────────── */}
      <section className="py-16 md:py-24 bg-brand-light" aria-label="Best sellers and testimonials">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <ScrollReveal>
            <SectionHeader eyebrow="Customer Favourites" title="Most Loved Pieces" />
          </ScrollReveal>

          {/* Best sellers — top 4 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
            {(bestSellers.length
              ? bestSellers.slice(0, 4)
              : products.filter(p => p.isBestSeller).slice(0, 4).length
                ? products.filter(p => p.isBestSeller).slice(0, 4)
                : products.slice(0, 4)
            ).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="bg-white p-6 shadow-sm">
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= t.rating ? 'fill-brand-gold text-brand-gold' : 'text-brand-light'} />
                    ))}
                  </div>
                  <p className="text-brand-grey text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                  <p className="font-medium text-sm text-brand-text">{t.name}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 12: Editorial/Blog Teaser Row ───────────────────────── */}
      <section className="py-16 md:py-24 bg-white" aria-label="Editorial and style guides">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-10">
              <SectionHeader eyebrow="The Edit" title="Style Stories" centered={false} />
              <Link to="/blog" className="btn-outline flex items-center gap-2" id="editorial-all">
                Read All <ChevronRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {editorials.map((article, i) => (
              <ScrollReveal key={article.title} delay={i * 0.1}>
                <article className="group cursor-pointer" aria-label={article.title}>
                  <div className="relative aspect-video overflow-hidden mb-4">
                    <img
                      src={article.img}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-brand-gold text-xs tracking-widest uppercase mb-2">{article.category}</p>
                  <h3 className="font-playfair text-lg font-semibold text-brand-text group-hover:text-brand-gold transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-brand-grey text-xs">{article.date} · {article.readTime}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default HomePage;
