import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';

const CancellationPage = () => {
  useEffect(() => {
    document.title = 'Cancellation Policy — Billu Bazaar';
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
            <span className="text-brand-text">Cancellation Policy</span>
          </nav>
          <h1 className="font-playfair text-h2 font-bold text-brand-text">Cancellation Policy</h1>
          <p className="text-brand-grey text-sm mt-1">Information on cancelling orders and associated processing fees.</p>
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
            <span className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">Order Control</span>
            <h2 className="font-playfair text-3xl font-bold text-brand-text">Flexible Order Management</h2>
            <p className="text-brand-grey text-sm md:text-base leading-relaxed">
              We understand that plans can change. Whether you made an accidental purchase or selected an incorrect size/model, we offer direct cancellation workflows before order dispatch. Below are the terms, steps, and timelines to cancel an active order.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-brand-light py-8 my-10">
            <div className="flex gap-4">
              <CheckCircle className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-playfair text-sm font-semibold text-brand-text mb-1">Pre-Dispatch</h4>
                <p className="text-brand-grey text-xs">Cancellations are 100% free before order is handed to the courier.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <XCircle className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-playfair text-sm font-semibold text-brand-text mb-1">Post-Dispatch</h4>
                <p className="text-brand-grey text-xs">Orders in transit cannot be cancelled; please refuse delivery or return.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <RefreshCw className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-playfair text-sm font-semibold text-brand-text mb-1">Refund Process</h4>
                <p className="text-brand-grey text-xs">Credits refunded to source within 5-7 bank working days.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">1. Standard Cancellations</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                You can cancel any in-stock product order by visiting your Account orders page before the status changes to "Shipped". If you purchased as a guest, please contact our concierge helpline instantly with your order ID to request a manual cancellation.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">2. Exceptions & Made-to-Order Items</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                Custom sizing adjustments, personalized jewelry engraving, or bespoke items cannot be cancelled once manufacturing has commenced (normally 12 hours after order confirmation). Additionally, instant digital codes or e-gift vouchers are non-cancellable and non-refundable.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">3. Cancellations by Billu Bazaar</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed">
                Occasionally, an item might fail our strict quality check or become out-of-stock. If we are forced to cancel your order (or part of it), we will notify you immediately via email/SMS, and initiate a full, immediate refund to your original payment method.
              </p>
            </section>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
};

export default CancellationPage;
