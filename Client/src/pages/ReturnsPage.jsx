import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCcw, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';

const ReturnsPage = () => {
  useEffect(() => {
    document.title = 'Returns & Refunds Policy — Billu Bazaar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg text-brand-text">
      {/* Breadcrumb Banner */}
      <div className="bg-brand-light/30 border-y border-brand-light py-8">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <nav className="text-xs text-brand-grey mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-brand-text">Returns & Refunds</span>
          </nav>
          <h1 className="font-playfair text-h2 font-bold text-brand-text">Returns & Refunds</h1>
          <p className="text-brand-grey text-sm mt-1">Our comprehensive 14-day hassle-free return policy.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-site mx-auto px-6 md:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">Our Guarantee</span>
            <h2 className="font-playfair text-3xl font-bold text-brand-text">Complete Peace of Mind</h2>
            <p className="text-brand-grey text-sm md:text-base leading-relaxed">
              We stand behind the quality of every product we curate. If you are not completely satisfied with your purchase, we offer a 14-day returns policy for most items. Our concierge team will arrange a reverse pickup from your address at no additional shipping cost.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-y border-brand-light py-8 my-10 text-center md:text-left">
            <div className="space-y-2">
              <RefreshCcw className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">14-Day Window</h4>
              <p className="text-brand-grey text-xs">Initiate a return within 14 days of order delivery.</p>
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">Free Pickups</h4>
              <p className="text-brand-grey text-xs">Reverse courier collection arranged right at your doorstep.</p>
            </div>
            <div className="space-y-2">
              <FileText className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">Easy Steps</h4>
              <p className="text-brand-grey text-xs">Request a return directly from your Account dashboard.</p>
            </div>
            <div className="space-y-2">
              <HelpCircle className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">Fast Refunds</h4>
              <p className="text-brand-grey text-xs">Credits processed within 3 days of warehouse inspection.</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">1. Return Guidelines</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                To qualify for a refund, the returned item must be in its original, unused condition, with all branding tags, security loops, and user manuals intact. 
                - **Apparel**: Must be unworn, unwashed, and free of cosmetics or scent.
                - **Electronics**: Must be in the original box with security seals unbroken.
                - **Beauty**: Skincare and makeup are non-returnable once the protective outer plastic seal is opened due to hygiene standards.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">2. How to Request a Return</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed font-light">
                Log into your account, visit "My Orders", select the specific order, and click "Return". Choose the items and select a reason. A return shipping label and pickup schedule will be sent to you automatically. If you purchased as a guest, please reach out via email or call us directly.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">3. Refund Processing</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                Once we receive your return at our warehouse, it will undergo a strict quality check. Upon approval, we will process your refund immediately. Cash on Delivery (COD) orders will be refunded via bank transfer (you will be asked for account details), while prepaid orders will be refunded back to the source account (card, net banking, or UPI).
              </p>
            </section>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
};

export default ReturnsPage;
