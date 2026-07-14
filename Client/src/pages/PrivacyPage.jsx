import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, RefreshCw } from 'lucide-react';
import Footer from '../components/Footer';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy — Billu Bazaar';
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
            <span className="text-brand-text">Privacy Policy</span>
          </nav>
          <h1 className="font-playfair text-h2 font-bold text-brand-text">Privacy Policy</h1>
          <p className="text-brand-grey text-sm mt-1">Our commitment to safeguarding your personal data and privacy.</p>
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
            <span className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">Trust & Protection</span>
            <h2 className="font-playfair text-3xl font-bold text-brand-text">Security of Your Personal Space</h2>
            <p className="text-brand-grey text-sm md:text-base leading-relaxed">
              At Billu Bazaar, we believe that luxury is built on trust. Just as we curate only the finest authentic products across electronics, fashion, and home design, we are equally committed to providing a secure and protected shopping experience. This Privacy Policy details how we handle, process, and guard your personal information.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-brand-light py-8 my-10">
            <div className="flex gap-4">
              <Shield className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-playfair text-sm font-semibold text-brand-text mb-1">Data Protection</h4>
                <p className="text-brand-grey text-xs">All account details are encrypted under AES-256 protocols.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Lock className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-playfair text-sm font-semibold text-brand-text mb-1">Secure Checkout</h4>
                <p className="text-brand-grey text-xs">PCI-DSS compliant payment gateways with no stored card data.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <RefreshCw className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-playfair text-sm font-semibold text-brand-text mb-1">Privacy Control</h4>
                <p className="text-brand-grey text-xs">Opt-out of marketing communications with one click at any time.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">1. Information We Collect</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                When you create an account, purchase products, or contact our customer concierge, we collect specific details to complete your requests. This includes your name, delivery address, email, phone number, and preferences. We do not store credit or debit card numbers on our servers.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">2. How We Use Your Data</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed font-light">
                Your data is primarily used to process orders, verify billing transactions, arrange courier delivery, and customize your experience on our platform. We may also use your purchase history to suggest tailored collections or products from our Electronics, Apparel, or Home categories.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">3. Cookies and Analytics</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                We use cookies to maintain your shopping cart, store session IDs, and analyze anonymous web traffic. Cookies allow us to understand which departments (such as Smart Home, Footwear, or Skincare) receive the most interest, helping us continuously optimize our navigation layout and load speeds.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">4. Third-Party Disclosures</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                We do not sell, rent, or lease your personal information to third parties. We share data solely with verified processing partners (such as courier networks, payment gateways, and backend services) required to fulfill your orders. All partners are contractually bound to maintain strict confidentiality.
              </p>
            </section>
          </div>

          <div className="p-6 bg-brand-light/10 border border-brand-light">
            <h4 className="font-playfair text-sm font-semibold text-brand-text mb-2">Concierge Support</h4>
            <p className="text-brand-grey text-xs leading-relaxed">
              If you have any questions about this Privacy Policy, your right to access, or wish to request data deletion, please contact our privacy desk directly at <a href="mailto:privacy@billubazaar.com" className="text-brand-gold hover:underline">privacy@billubazaar.com</a> or message our helpline.
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
};

export default PrivacyPage;
