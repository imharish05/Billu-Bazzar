import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3 } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { mockCustomer } from '../../data/mockAccountData';

const ProfilePage = () => {
  const { customer: authCustomer } = useSelector(s => s.auth);
  const customer = authCustomer || mockCustomer;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    referralCode: customer.referralCode || '',
  });

  const handleSave = () => {
    setEditing(false);
    toast.success('Profile updated');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="bg-white shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-playfair text-xl font-semibold">My Profile</h1>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="btn-outline text-xs px-4 py-2 flex items-center gap-2 focus-visible:outline-brand-gold"
            id="edit-profile-btn"
          >
            <Edit3 size={14} /> {editing ? 'Save' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { label: 'Full Name', field: 'name' },
            { label: 'Email', field: 'email' },
            { label: 'Phone', field: 'phone' },
            { label: 'Referral Code', field: 'referralCode' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-xs text-brand-grey mb-1">{label}</label>
              {editing ? (
                <input
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  id={`profile-${field}`}
                  aria-label={label}
                />
              ) : (
                <p className="font-medium text-sm">{form[field]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-brand-light text-xs text-brand-grey">
          Member since {new Date(customer.memberSince || customer.createdAt || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;