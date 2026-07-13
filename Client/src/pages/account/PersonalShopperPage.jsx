import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * PersonalShopperPage — /account/personal-shopper
 * PRD ref: "Customer Account > 'Personal Shopper' styling assistance
 * request" (premium). Mock submit — no backend call yet, just local state
 * + toast so the flow can be demoed; swap handleSubmit for a real
 * POST /personal-shopper/requests once available.
 */
const PersonalShopperPage = () => {
  const [form, setForm] = useState({ occasion: '', budget: '', style: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Styling request sent — our stylist will reach out within 24h');
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="bg-white shadow-sm p-10 text-center">
          <CheckCircle2 size={40} className="text-brand-gold mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-playfair text-xl font-semibold mb-2">Request Received</h1>
          <p className="text-brand-grey text-sm mb-6 max-w-sm mx-auto">
            A Billu Bazaar personal stylist will review your preferences and reach out with a curated selection soon.
          </p>
          <button onClick={() => setSubmitted(false)} className="btn-outline text-xs px-5 py-2.5" id="shopper-new-request">
            Submit Another Request
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <Gift size={18} className="text-brand-gold" />
          <h1 className="font-playfair text-xl font-semibold">Personal Shopper</h1>
        </div>
        <p className="text-brand-grey text-sm mb-6">
          Our personal stylists will curate a collection just for you based on your preferences, occasion, and budget.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium mb-1.5" htmlFor="shopper-occasion">Occasion</label>
            <input
              id="shopper-occasion"
              type="text"
              required
              placeholder="Wedding, Birthday, Festival..."
              value={form.occasion}
              onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}
              className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" htmlFor="shopper-budget">Budget (₹)</label>
            <input
              id="shopper-budget"
              type="text"
              required
              placeholder="5000 – 50000"
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" htmlFor="shopper-style">Style Preference</label>
            <input
              id="shopper-style"
              type="text"
              placeholder="Traditional, Fusion, Contemporary..."
              value={form.style}
              onChange={e => setForm(f => ({ ...f, style: e.target.value }))}
              className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" htmlFor="shopper-notes">Additional Notes</label>
            <textarea
              id="shopper-notes"
              rows={3}
              placeholder="Anything else the stylist should know..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold resize-none"
            />
          </div>
          <button type="submit" className="btn-primary w-full" id="shopper-submit">Request Styling Consultation</button>
        </form>
      </div>
    </motion.div>
  );
};

export default PersonalShopperPage;