import AdminLayout from '../components/AdminLayout';

const PAY_STATUS = { PAID: 'bg-green-50 text-green-700', UNPAID: 'bg-yellow-50 text-yellow-700', REFUNDED: 'bg-gray-100 text-gray-500', FAILED: 'bg-red-50 text-red-500' };

const PAYMENTS = [
  { id: 1, orderNo: 'BB3F2A1B', amount: 8499, method: 'Razorpay UPI', ref: 'pay_Px8GmQ1234', status: 'PAID', date: '2025-06-28' },
  { id: 2, orderNo: 'BB7C4E2D', amount: 24999, method: 'Credit Card', ref: 'pay_Qr9HnR5678', status: 'PAID', date: '2025-06-27' },
  { id: 3, orderNo: 'BB1A9K3F', amount: 4999, method: 'Net Banking', ref: 'pay_St2JoS9012', status: 'REFUNDED', date: '2025-06-26' },
  { id: 4, orderNo: 'BB5D8M6G', amount: 14799, method: 'Debit Card', ref: 'pay_Uv5LpT3456', status: 'PAID', date: '2025-06-25' },
  { id: 5, orderNo: 'BB2B1P4H', amount: 3299, method: 'Cash on Delivery', ref: 'COD-BB-001', status: 'UNPAID', date: '2025-06-24' },
  { id: 6, orderNo: 'BB8E5Q7I', amount: 59990, method: 'Credit Card', ref: 'pay_Wx8MqU7890', status: 'PAID', date: '2025-06-23' },
  { id: 7, orderNo: 'BB4F2R5J', amount: 7499, method: 'Razorpay UPI', ref: 'pay_Yz1NrV1234', status: 'FAILED', date: '2025-06-22' },
];

const PaymentsAdminPage = () => {
  const totalPaid = PAYMENTS.filter(p=>p.status==='PAID').reduce((s,p)=>s+p.amount,0);

  return (
    <AdminLayout title="Payments">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Collected', value: `₹${totalPaid.toLocaleString('en-IN')}`, sub: `${PAYMENTS.filter(p=>p.status==='PAID').length} transactions` },
          { label: 'Pending Collection', value: `₹${PAYMENTS.filter(p=>p.status==='UNPAID').reduce((s,p)=>s+p.amount,0).toLocaleString('en-IN')}`, sub: 'COD orders' },
          { label: 'Refunded', value: `₹${PAYMENTS.filter(p=>p.status==='REFUNDED').reduce((s,p)=>s+p.amount,0).toLocaleString('en-IN')}`, sub: 'This month' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-brand-grey text-xs mb-1">{s.label}</p>
            <p className="font-playfair text-2xl font-bold text-brand-text">{s.value}</p>
            <p className="text-xs text-brand-grey mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
          <p className="text-sm text-brand-grey">{PAYMENTS.length} transactions</p>
          <button className="text-xs text-brand-gold hover:underline focus-visible:outline-brand-gold" id="export-payments">Export to Excel</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Payments table">
            <thead><tr className="bg-brand-light/40 text-left">{['Order #','Amount','Method','Gateway Ref','Status','Date'].map(h=><th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {PAYMENTS.map(p => (
                <tr key={p.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-gold">{p.orderNo}</td>
                  <td className="px-4 py-3 font-semibold">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-brand-grey">{p.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-grey">{p.ref}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${PAY_STATUS[p.status]||'bg-gray-100'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-brand-grey text-xs">{new Date(p.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
export default PaymentsAdminPage;
