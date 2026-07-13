import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { mockCustomer, mockLoyaltyLedger, loyaltyEarnRules } from '../../data/mockAccountData';
import { formatPrice } from '../../utils/currency';

/**
 * LoyaltyPage — /account/loyalty
 * PRD ref: "Customer Account > Loyalty points & cashback wallet" (premium)
 * Mock data — points balance, cashback balance, and transaction ledger are
 * all hardcoded; swap for real balance + ledger endpoints once available.
 */
const LoyaltyPage = () => {
  const { loyaltyPoints, loyaltyTier, cashbackBalance } = mockCustomer;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="font-playfair text-xl font-semibold mb-5">Loyalty & Cashback</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-brand-gold to-yellow-500 text-white p-6">
          <p className="text-sm opacity-80 mb-1">Loyalty Points · {loyaltyTier} Tier</p>
          <p className="font-playfair text-5xl font-bold">{loyaltyPoints}</p>
          <p className="text-sm opacity-80 mt-1">Worth {formatPrice(loyaltyPoints * 0.5)}</p>
        </div>
        <div className="bg-brand-text text-white p-6">
          <p className="text-sm opacity-70 mb-1 flex items-center gap-1.5"><Wallet size={14} /> Cashback Wallet</p>
          <p className="font-playfair text-5xl font-bold">{formatPrice(cashbackBalance)}</p>
          <p className="text-sm opacity-70 mt-1">Auto-applies at checkout</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white shadow-sm p-6">
          <h2 className="font-medium text-sm mb-4">How to earn more</h2>
          <div className="space-y-3">
            {loyaltyEarnRules.map(({ action, points }) => (
              <div key={action} className="flex justify-between text-sm py-2 border-b border-brand-light last:border-0">
                <span className="text-brand-grey">{action}</span>
                <span className="font-medium text-brand-gold">{points}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-sm p-6">
          <h2 className="font-medium text-sm mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {mockLoyaltyLedger.map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b border-brand-light last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  {tx.type === 'earn'
                    ? <TrendingUp size={14} className="text-green-600 flex-shrink-0" />
                    : <TrendingDown size={14} className="text-red-500 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="truncate">{tx.label}</p>
                    <p className="text-[11px] text-brand-grey">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className={`font-medium flex-shrink-0 ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoyaltyPage;