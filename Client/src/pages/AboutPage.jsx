import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { Eye, Target, Compass, Award, Sparkles, Users, Instagram, Package, Heart, ChevronRight, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

// Count-Up Animation Component
const Counter = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  // Extract number and suffix (like "K" or "+")
  const numStr = value.replace(/[^0-9]/g, '');
  const num = parseInt(numStr, 10) || 0;
  const suffix = value.replace(/[0-9]/g, '');

  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    return Math.floor(latest).toLocaleString();
  });

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, num, {
        duration: 2.2,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [inView, motionValue, num]);

  return (
    <span ref={ref} className="font-playfair text-4xl md:text-5xl font-bold text-brand-gold tracking-tight">
      <motion.span>{rounded}</motion.span>
      <span>{suffix}</span>
    </span>
  );
};

const AboutPage = () => {
  useEffect(() => {
    document.title = 'Our Story — Billu Bazaar';
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: <Eye className="w-8 h-8 text-brand-gold" />,
      title: 'Our Vision',
      description: 'To create a single, curated lifestyle ecosystem where cutting-edge electronics, designer fashion, premium home goods, and health essentials seamlessly converge into a single, high-end marketplace.',
      accent: 'Modern Curation'
    },
    {
      icon: <Target className="w-8 h-8 text-brand-gold" />,
      title: 'Our Mission',
      description: 'To source and deliver strictly authentic, certified products across all categories, ensuring our customers experience top-tier quality, transparent pricing, and concierge-level customer care.',
      accent: 'Authenticity & Trust'
    },
    {
      icon: <Compass className="w-8 h-8 text-brand-gold" />,
      title: 'Our Goal',
      description: 'To bridge the gap between verified global manufacturers and design-conscious shoppers, offering an unparalleled catalog of curated electronics, apparel, home decor, beauty, and hobbies.',
      accent: 'Curated Excellence'
    }
  ];

  const stats = [
    {
      icon: <Users className="w-6 h-6 text-brand-gold" />,
      value: '50000+',
      label: 'Happy Patrons',
      sub: 'Verified satisfied customers'
    },
    {
      icon: <Instagram className="w-6 h-6 text-brand-gold" />,
      value: '200000+',
      label: 'Social Family',
      sub: 'Engaged lifestyle community'
    },
    {
      icon: <Package className="w-6 h-6 text-brand-gold" />,
      value: '150000+',
      label: 'Orders Delivered',
      sub: 'Safely packed & shipped items'
    },
    {
      icon: <Award className="w-6 h-6 text-brand-gold" />,
      value: '150+',
      label: 'Curated Brands',
      sub: 'Top-tier verified partners'
    }
  ];

  const marqueeWords = [
    'ELECTRONICS', 'APPAREL', 'HOME', 'BEAUTY', 
    'SPORTS', 'TOYS', 'EXCLUSIVITY', 'QUALITY', 'CRAFTSMANSHIP'
  ];

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg text-brand-text overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative h-[65vh] md:h-[80vh] flex items-center justify-center bg-black overflow-hidden">
        {/* Luxury Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transform transition-transform duration-10000 ease-out opacity-60"
          style={{ backgroundImage: `url('/about-luxury-bg.png')` }}
        />
        {/* Dark Radial Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-brand-text" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative max-w-site mx-auto px-6 md:px-8 text-center z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <span className="text-xs font-semibold tracking-widest text-brand-gold uppercase block">Est. 2019</span>
            <h1 className="font-playfair text-display text-white max-w-4xl leading-tight">
              Your Premium <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-yellow-400 to-brand-gold">
                Lifestyle Destination
              </span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
              Bringing you a meticulously curated selection of cutting-edge electronics, fashion apparel, home styling, beauty, and outdoor sports.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8"
          >
            <div className="w-[1px] h-16 bg-gradient-to-b from-brand-gold to-transparent animate-pulse" />
          </motion.div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 md:py-28 max-w-site mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Contents of the Company */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <span className="text-xs font-semibold tracking-widest text-brand-gold uppercase block">Our Legacy</span>
            <h2 className="font-playfair text-h1 text-brand-text leading-tight">
              Curation For The <br />
              Modern Connoisseur
            </h2>
            <div className="h-[2px] w-20 bg-brand-gold" />
            
            <p className="text-brand-grey text-sm md:text-base leading-relaxed">
              Billu Bazaar was established in 2019 with a singular, clear objective: to redefine how you shop for life's essentials. We believed that shopping for premium tech shouldn't feel separate from buying designer apparel or selecting elegant home furnishings. By bringing these diverse categories together, we created a unified, luxury-tier marketplace.
            </p>
            
            <p className="text-brand-grey text-sm md:text-base leading-relaxed">
              Today, our catalog is divided into six pillars: **Electronics & Gadgets**, **Apparel & Fashion**, **Home & Living**, **Beauty & Personal Care**, **Sports & Outdoors**, and **Toys, Hobbies & Media**. We verify and partner directly with top manufacturers and authorized brands, filtering out the noise to bring you only products that pass our strict design and quality audits.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-6 border-t border-brand-light">
              <div>
                <h4 className="font-playfair text-lg font-semibold text-brand-text mb-1">Authentic Sourcing</h4>
                <p className="text-xs text-brand-grey leading-relaxed">
                  We guarantee 100% original products sourced directly from brands or authorized global distributors.
                </p>
              </div>
              <div>
                <h4 className="font-playfair text-lg font-semibold text-brand-text mb-1">Global Standard</h4>
                <p className="text-xs text-brand-grey leading-relaxed">
                  Our products are selected based on strict criteria: build quality, performance, aesthetics, and user reviews.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Premium General Boutique Display Image */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute -inset-4 border border-brand-gold/20 translate-x-2 translate-y-2 pointer-events-none rounded-sm" />
            <div className="relative bg-neutral-100 border border-brand-light shadow-lg overflow-hidden group">
              <img 
                src="/about-story-general.png" 
                alt="Premium multi-category lifestyle curation showroom display" 
                className="w-full h-[450px] object-cover filter contrast-[1.03] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-brand-light p-5 shadow-xl max-w-[200px] hidden sm:block">
              <span className="text-xs text-brand-gold font-semibold uppercase block mb-1">Our Quality Oath</span>
              <p className="text-[10px] text-brand-grey leading-normal">
                Every gadget, garment, and home accent is hand-inspected for quality before shipping.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Stats Counter Section (with Wavy pattern) */}
      <section className="relative bg-brand-text text-white py-24 md:py-32 my-12 overflow-hidden">
        
        {/* Wave Top */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none select-none pointer-events-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-[30px] md:h-[50px]">
            <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,0L1320,0C1200,0,960,0,720,0C480,0,240,0,120,0L0,0Z" className="fill-brand-bg"></path>
          </svg>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-gold/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-yellow-600/5 blur-[150px] pointer-events-none" />

        <div className="relative max-w-site mx-auto px-6 md:px-8 z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold tracking-widest text-brand-gold uppercase block">By The Numbers</span>
            <h3 className="font-playfair text-h2 text-white">Our Growing Footprint</h3>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed">
              From high-end electronics to designer outerwear and sports gear, our numbers reflect our commitment to excellence.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-6 bg-white/5 border border-white/10 rounded-sm hover:border-brand-gold/30 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 border border-brand-gold/20 flex items-center justify-center mb-4 rounded-full bg-black/40 group-hover:border-brand-gold/50 transition-colors">
                  {item.icon}
                </div>
                <Counter value={item.value} />
                <h5 className="font-playfair text-sm font-semibold text-white mt-3 mb-1">
                  {item.label}
                </h5>
                <p className="text-white/50 text-[11px] leading-tight">
                  {item.sub}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Slider/Marquee section */}
          <div className="mt-20 border-t border-b border-white/10 py-6 overflow-hidden relative select-none">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-brand-text to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand-text to-transparent z-10" />
            
            <motion.div 
              className="flex whitespace-nowrap gap-16 text-sm font-semibold tracking-[0.3em] text-white/40"
              animate={{ x: [0, -1000] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 25,
                  ease: 'linear',
                },
              }}
            >
              {/* Render twice for continuous loop */}
              {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((word, idx) => (
                <div key={idx} className="flex items-center gap-6">
                  <span>{word}</span>
                  <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                </div>
              ))}
            </motion.div>
          </div>

        </div>

        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none select-none pointer-events-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-[30px] md:h-[50px] transform rotate-180">
            <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,0L1320,0C1200,0,960,0,720,0C480,0,240,0,120,0L0,0Z" className="fill-brand-bg"></path>
          </svg>
        </div>

      </section>

      {/* Core Values Section (Premium Cards) */}
      <section className="py-20 md:py-28 max-w-site mx-auto px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold tracking-widest text-brand-gold uppercase block">Our Philosophy</span>
          <h2 className="font-playfair text-h1 text-brand-text">Pillars of Excellence</h2>
          <div className="h-[2px] w-20 bg-brand-gold mx-auto" />
          <p className="text-brand-grey text-sm max-w-lg mx-auto">
            Our foundations are built on sourcing authentic products, providing seamless digital solutions, and earning long-term customer loyalty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((val, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="bg-white border border-brand-light p-8 flex flex-col justify-between shadow-sm hover:shadow-lg hover:border-brand-gold/30 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Decorative Corner Gold accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-gold/10 to-transparent transform rotate-45 translate-x-8 -translate-y-8 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-300" />
              
              <div className="space-y-6">
                <div className="w-16 h-16 border border-brand-light flex items-center justify-center bg-brand-muted/50 rounded-sm group-hover:border-brand-gold/40 group-hover:bg-white transition-all duration-300">
                  {val.icon}
                </div>
                <div>
                  <span className="text-[10px] text-brand-gold font-semibold uppercase tracking-wider block mb-1">
                    {val.accent}
                  </span>
                  <h4 className="font-playfair text-xl font-bold text-brand-text mb-3">
                    {val.title}
                  </h4>
                  <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>

              {/* Bottom decorative bar */}
              <div className="h-[2px] w-0 bg-brand-gold mt-8 group-hover:w-full transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Private Concierge CTA Section */}
      <section className="bg-brand-muted/50 border-t border-b border-brand-light py-16 text-center">
        <div className="max-w-xl mx-auto px-6 space-y-6">
          <span className="text-xs font-semibold tracking-widest text-brand-gold uppercase block">Need Assistance?</span>
          <h3 className="font-playfair text-2xl font-bold text-brand-text">
            We are Here to Help
          </h3>
          <p className="text-brand-grey text-sm leading-relaxed">
            Whether you need product recommendations, order tracking help, or bulk procurement support across our catalog, our concierge team is always available.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              to="/contact" 
              className="btn-primary flex items-center gap-2 group w-full sm:w-auto justify-center"
              id="about-contact-btn"
            >
              Contact Support <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/products" 
              className="px-6 py-3 border border-brand-light text-brand-text text-sm font-semibold hover:border-brand-gold transition-colors w-full sm:w-auto justify-center inline-flex"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default AboutPage;
