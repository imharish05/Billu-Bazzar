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
          <p className="text-brand-grey text-sm mt-1">Our 24-hour return policy for damaged, incorrect, or mismatched orders.</p>
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
            <h2 className="font-playfair text-3xl font-bold text-brand-text">Returns & Refunds Policy</h2>
            <p className="text-brand-grey text-sm md:text-base leading-relaxed text-justify">
              We are committed to delivering products of the highest standard. However, if your order is damaged, incorrect, or deviates significantly from its description, we support returns within a strict 24-hour window from delivery. Below are the specific eligibility requirements, exclusions, and processing steps for returns and refunds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-y border-brand-light py-8 my-10 text-center md:text-left">
            <div className="space-y-2">
              <RefreshCcw className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">24-Hour Window</h4>
              <p className="text-brand-grey text-xs">Initiate a return request within 24 hours of successful delivery.</p>
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">Eligible Issues</h4>
              <p className="text-brand-grey text-xs">Valid for products that are damaged, incorrect, or mismatched.</p>
            </div>
            <div className="space-y-2">
              <FileText className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">Pickup Service</h4>
              <p className="text-brand-grey text-xs">Reverse collection is arranged directly by us at no shipping cost.</p>
            </div>
            <div className="space-y-2">
              <HelpCircle className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <h4 className="font-playfair text-sm font-semibold text-brand-text">5-7 Day Refunds</h4>
              <p className="text-brand-grey text-xs">Refunds are credited back to the source account after inspection.</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">1. Return Eligibility & Window</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify">
                We offer a strict 24-hour return window from the date and time of successful delivery. Returns are accepted only if the product received is physically damaged or defective at the time of arrival, if a completely wrong product has been delivered, or if the product is significantly different from its description on our website. Customers must submit their return requests, accompanied by necessary proof (such as unboxing videos or images), within this 24-hour period.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">2. Exclusions & Non-Returnable Items</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed font-light text-justify">
                Products are ineligible for return under any of the following conditions: if the product has been used, altered, or if the original Billu Bazaar security seal is broken; if the original packaging, brand tags, instruction manuals, or accessories are missing; or if the item belongs to a non-returnable category for hygiene reasons, which includes perfumes, innerwear, and personal care products. Additionally, any products explicitly designated as 'Non-Returnable' on their respective product details page cannot be returned.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">3. Return Pickup & Logistics</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify">
                Once your return request is validated and approved, our logistics team will coordinate the return shipment. Return pickup will be arranged and handled directly by Billu Bazaar's courier partners. Customers do not need to ship items independently. Please ensure the product is packed securely in its original packaging along with all documentation for the courier representative.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-playfair text-xl font-semibold text-brand-text">4. Refund Processing & Timelines</h3>
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify">
                After the returned product is successfully received at our warehouse, it will undergo a comprehensive quality check and verification. Upon successful inspection, your refund will be processed within 5 to 7 business days. The refunded amount will be credited back to your original payment method (such as UPI, credit/debit card, or digital wallet). Cash on Delivery orders will be refunded via bank transfer to account details provided by the customer during the return workflow.
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
