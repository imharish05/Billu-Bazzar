import AdminLayout from '../components/AdminLayout';

const TYPE_COLORS = {
  EARN: 'bg-green-50 text-green-700',
  REDEEM: 'bg-red-50 text-red-600',
  BONUS: 'bg-amber-50 text-amber-700',
  EXPIRE: 'bg-gray-100 text-gray-500',
};

const LEDGER = [
  { id: 1, customer: 'Priya Nair', type: 'EARN', points: 150, balance: 720, description: 'Purchase ORD-BB12345', date: '2025-06-28' },
  { id: 2, customer: 'Anjali Singh', type: 'REDEEM', points: -200, balance: 380, description: 'Redeemed at checkout', date: '2025-06-27' },
  { id: 3, customer: 'Kavya Reddy', type: 'BONUS', points: 500, balance: 1240, description: 'Birthday bonus reward', date: '2025-06-26' },
  { id: 4, customer: 'Sunita Patel', type: 'EARN', points: 80, balance: 290, description: 'Purchase ORD-BB12340', date: '2025-06-25' },
  { id: 5, customer: 'Meera Kapoor', type: 'BONUS', points: 200, balance: 1560, description: 'Referral bonus — MEERA20', date: '2025-06-24' },
  { id: 6, customer: 'Riya Ahuja', type: 'REDEEM', points: -100, balance: 220, description: 'Applied at checkout', date: '2025-06-23' },
  { id: 7, customer: 'Aisha Khan', type: 'EARN', points: 240, balance: 840, description: 'Purchase ORD-BB12335', date: '2025-06-22' },
  { id: 8, customer: 'Divya Menon', type: 'EXPIRE', points: -150, balance: 50, description: 'Points expired (180 days)', date: '2025-06-20' },
];

const LoyaltyAdminPage = () => (
  <AdminLayout title="Loyalty Program">
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Total Points Issued', value: '2,84,600', sub: 'All time' },
        { label: 'Points Redeemed', value: '98,400', sub: '34.6% redemption rate' },
        { label: 'Active Members', value: '1,240', sub: 'With loyalty balance' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-brand-grey text-xs mb-1">{s.label}</p>
          <p className="font-playfair text-3xl font-bold text-brand-text">{s.value}</p>
          <p className="text-xs text-brand-grey mt-1">{s.sub}</p>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
        <p className="text-sm font-medium">Loyalty Ledger</p>
        <input type="text" placeholder="Filter by customer..." className="text-sm border border-brand-light px-3 py-1.5 focus:outline-none focus:border-brand-gold w-48" id="loyalty-search" aria-label="Filter by customer" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Loyalty ledger">
          <thead><tr className="bg-brand-light/40 text-left">{['Customer','Type','Points','Balance','Description','Date'].map(h=><th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {LEDGER.map(entry => (
              <tr key={entry.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                <td className="px-4 py-3 font-medium">{entry.customer}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[entry.type]}`}>{entry.type}</span></td>
                <td className="px-4 py-3 font-semibold" style={{color: entry.points > 0 ? '#16a34a' : '#dc2626'}}>{entry.points > 0 ? '+' : ''}{entry.points}</td>
                <td className="px-4 py-3 text-brand-grey">{entry.balance}</td>
                <td className="px-4 py-3 text-brand-grey text-xs">{entry.description}</td>
                <td className="px-4 py-3 text-brand-grey text-xs">{new Date(entry.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
);
export default LoyaltyAdminPage;
