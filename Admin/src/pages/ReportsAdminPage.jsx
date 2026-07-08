import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { useSelector } from 'react-redux';

const GOLD_SHADES = ['#C9A24B', '#E8C76E', '#A0803A', '#F0D99B', '#7A6128', '#D4B466'];

const monthlyRevenue = [
  { month: 'Jan', revenue: 185000 }, { month: 'Feb', revenue: 210000 },
  { month: 'Mar', revenue: 178000 }, { month: 'Apr', revenue: 245000 },
  { month: 'May', revenue: 320000 }, { month: 'Jun', revenue: 285000 },
  { month: 'Jul', revenue: 195000 },
];

const salesByCategory = [
  { name: 'Party Wear', value: 35 }, { name: 'Jewelry', value: 25 },
  { name: 'Perfumes', value: 18 }, { name: 'Accessories', value: 12 },
  { name: 'Footwear', value: 7 }, { name: 'Others', value: 3 },
];

const topProducts = [
  { name: 'Rose Gold Lehenga Set', revenue: '₹4,82,000', orders: 120, rating: 4.9 },
  { name: 'Kundan Polki Necklace Set', revenue: '₹3,15,000', orders: 63, rating: 4.8 },
  { name: 'Oud Royale Perfume 50ml', revenue: '₹2,70,000', orders: 180, rating: 4.7 },
  { name: 'Embroidered Anarkali Suit', revenue: '₹2,10,000', orders: 84, rating: 4.6 },
  { name: 'Banarasi Silk Saree', revenue: '₹1,95,000', orders: 78, rating: 4.8 },
];

const ReportsAdminPage = () => (
  <AdminLayout title="Reports">
    <div className="flex justify-between items-center mb-6">
      <h2 className="font-playfair text-xl font-semibold">Analytics Overview</h2>
      <button className="btn-outline text-sm flex items-center gap-2" id="export-excel-btn">Export to Excel</button>
    </div>

    <div className="grid xl:grid-cols-3 gap-6 mb-6">
      {/* Monthly Revenue */}
      <div className="xl:col-span-2 bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-playfair text-lg font-semibold mb-4">Monthly Revenue (2025)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyRevenue} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ fontSize: 12, border: '1px solid #F0EEE8', borderRadius: 4 }} />
            <Bar dataKey="revenue" fill="#C9A24B" radius={[4,4,0,0]} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sales by Category Pie */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-playfair text-lg font-semibold mb-4">Sales by Category</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={300}>
              {salesByCategory.map((_, i) => <Cell key={i} fill={GOLD_SHADES[i % GOLD_SHADES.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ fontSize: 12, border: '1px solid #F0EEE8', borderRadius: 4 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-2">
          {salesByCategory.map((cat, i) => (
            <div key={cat.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: GOLD_SHADES[i] }} />
                <span className="text-brand-grey">{cat.name}</span>
              </div>
              <span className="font-medium">{cat.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Top Products Table */}
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-light"><h3 className="font-playfair text-lg font-semibold">Top Products by Revenue</h3></div>
      <table className="w-full text-sm" aria-label="Top products report">
        <thead><tr className="bg-brand-light/40 text-left">{['Rank','Product','Revenue','Orders','Rating'].map(h=><th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>)}</tr></thead>
        <tbody>
          {topProducts.map((p, i) => (
            <tr key={p.name} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
              <td className="px-4 py-3 text-brand-gold font-bold">#{i+1}</td>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 font-semibold text-green-700">{p.revenue}</td>
              <td className="px-4 py-3">{p.orders} orders</td>
              <td className="px-4 py-3"><span className="text-brand-gold font-medium">★ {p.rating}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </AdminLayout>
);
export default ReportsAdminPage;
