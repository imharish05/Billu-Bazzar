import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { updateProfile } from '../../redux/slices/authSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { customer, profileLoading } = useSelector(s => s.auth);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
  });

  // Re-sync form when customer data changes (e.g., after a successful save)
  const startEdit = () => {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    const result = await dispatch(updateProfile({ name: form.name.trim(), phone: form.phone.trim() }));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated successfully.');
      setEditing(false);
    } else {
      toast.error(result.payload || 'Failed to update profile.');
    }
  };

  // Display fallback values safely
  const display = {
    name: customer?.name || '—',
    email: customer?.email || '—',
    phone: customer?.phone || 'Not added',
    memberSince: customer?.createdAt
      ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="bg-white shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="font-playfair text-base sm:text-xl font-semibold leading-tight whitespace-nowrap">My Profile</h1>

          {editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                disabled={profileLoading}
                className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-brand-gold"
                id="cancel-profile-btn"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={profileLoading}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-brand-gold"
                id="save-profile-btn"
              >
                {profileLoading
                  ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save size={13} />}
                {profileLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="btn-outline text-xs px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 focus-visible:outline-brand-gold"
              id="edit-profile-btn"
            >
              <Edit3 size={13} /> Edit Profile
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Name — editable */}
          <div>
            <label className="block text-xs text-brand-grey mb-1">Full Name</label>
            {editing ? (
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                id="profile-name"
                aria-label="Full Name"
              />
            ) : (
              <p className="font-medium text-sm">{display.name}</p>
            )}
          </div>

          {/* Email — read-only always */}
          <div>
            <label className="block text-xs text-brand-grey mb-1">Email <span className="text-neutral-400">(cannot be changed)</span></label>
            <p className="font-medium text-sm text-neutral-500">{display.email}</p>
          </div>

          {/* Phone — editable */}
          <div>
            <label className="block text-xs text-brand-grey mb-1">Phone Number</label>
            {editing ? (
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                id="profile-phone"
                aria-label="Phone Number"
                placeholder="+91 98765 43210"
              />
            ) : (
              <p className="font-medium text-sm">{display.phone}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-brand-light text-xs text-brand-grey">
          Member since {display.memberSince}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;