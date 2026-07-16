import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Circle, MapPin, Truck, CreditCard, FileText, Phone, MessageSquare } from 'lucide-react';
import { mockOrders } from '../../data/mockAccountData';
import { formatPrice } from '../../utils/currency';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  RETURNED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipping',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const order = mockOrders.find(o => o.id === id);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!order) return <Navigate to="/account/orders" replace />;

  const handleCancelOrder = () => {
    setIsCancelling(true);
    setTimeout(() => {
      toast.success('Your cancellation request has been submitted successfully.');
      setIsCancelling(false);
    }, 1000);
  };

  const handleDownloadInvoice = () => {
    toast.success('Downloading your tax invoice PDF...');
  };

  // Generate tracking list dynamically using the active order status to align with the Admin status lifecycle.
  const trackingSteps = (() => {
    const steps = [
      { key: 'PENDING', label: 'Order Placed' },
      { key: 'CONFIRMED', label: 'Confirmed' },
      { key: 'PROCESSING', label: 'Processing' },
      { key: 'SHIPPED', label: 'Shipped' },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
      { key: 'DELIVERED', label: 'Delivered' },
    ];

    if (order.status === 'CANCELLED') {
      return [
        { label: 'Order Placed', date: order.createdAt, done: true },
        { label: 'Cancelled', date: order.updatedAt || order.createdAt, done: true },
      ];
    }

    const orderSequence = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = orderSequence.indexOf(order.status);
    const baseDate = new Date(order.createdAt);

    return steps.map((step, idx) => {
      const stepIndex = orderSequence.indexOf(step.key);
      const done = stepIndex <= currentIndex;

      let date = null;
      if (done) {
        if (step.key === 'PENDING') {
          date = order.createdAt;
        } else {
          const simDate = new Date(baseDate);
          simDate.setDate(baseDate.getDate() + stepIndex);
          date = simDate.toISOString();
        }
      }

      return {
        label: step.label,
        date,
        done,
      };
    });
  })();

  const renderAddress = (address) => {
    if (typeof address === 'string') {
      return (
        <div>
          <p className="font-medium text-neutral-800 mb-0.5">Ananya Sharma</p>
          <p className="text-neutral-500 text-sm leading-relaxed">{address}</p>
          <p className="text-neutral-500 text-xs mt-2">Phone: +91 98765 43210</p>
        </div>
      );
    }
    if (!address) return <p className="text-neutral-400 text-sm">No address details available</p>;
    
    // Support both old database schema and new input schema keys
    const firstName = address.firstName || '';
    const lastName = address.lastName || '';
    const name = address.name || (firstName || lastName ? `${firstName} ${lastName}`.trim() : '');
    const phone = address.phone || '';
    const email = address.email || '';
    
    const line1 = address.flatHouse || address.addressLine1 || address.line1 || '';
    const line2 = address.areaStreet || address.addressLine2 || address.line2 || '';
    const landmark = address.landmark || '';
    const city = address.city || '';
    const state = address.state || '';
    const pincode = address.pincode || address.postalCode || address.postal_code || '';
    const country = address.country || '';

    return (
      <div>
        {name && <p className="font-medium text-neutral-800 mb-0.5">{name}</p>}
        <p className="text-neutral-500 text-sm leading-relaxed">
          {line1}
          {line2 && `, ${line2}`}
          {landmark && ` (near ${landmark})`}
          {`, ${city}, ${state} ${pincode}`}
          {country && `, ${country}`}
        </p>
        {(phone || email) && (
          <p className="text-neutral-500 text-xs mt-2">
            {phone && `Phone: ${phone}`} {phone && email && ' · '} {email && `Email: ${email}`}
          </p>
        )}
      </div>
    );
  };

  // Mock standard financial values for demo purposes based on order's total amount
  const subtotal = order.subtotal || order.totalAmount * 0.95;
  const taxAmount = order.taxAmount || order.totalAmount * 0.05;
  const shippingAmount = order.shippingAmount || 0;
  const discountAmount = order.discountAmount || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-brand-grey hover:text-brand-gold mb-5" id="back-to-orders">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      {/* Main Order Metadata Card */}
      <div className="bg-white shadow-sm p-6 mb-5 border border-brand-light flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="font-playfair text-xl font-bold text-neutral-900">Order #{order.orderNumber}</h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="text-xs text-brand-grey">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={handleDownloadInvoice}
          className="btn-outline flex items-center gap-1.5 text-xs py-2 px-4 hover:bg-brand-light transition-colors"
          id="btn-download-invoice"
        >
          <FileText size={14} /> Download Invoice
        </button>
      </div>

      {/* Dynamic Courier / Shipment AWB Section */}
      {(order.trackingNumber || order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY') && (
        <div className="bg-white shadow-sm p-6 mb-5 border border-brand-light">
          <div className="flex items-start gap-3">
            <Truck size={18} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold mb-1">Shipment Information</p>
              <p className="text-xs text-brand-grey">
                Courier Partner: <span className="font-medium text-neutral-700">Shiprocket</span>
              </p>
              <p className="text-xs text-brand-grey mt-0.5">
                Tracking Number (AWB): <span className="font-mono font-medium text-brand-gold">{order.trackingNumber || 'AWB3874920492'}</span>
              </p>
              <a
                href={order.trackingUrl || "https://shiprocket.co"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-xs underline font-semibold text-brand-gold hover:text-neutral-900 transition-colors"
              >
                Track Shipment Details &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tracking timeline */}
      <div className="bg-white shadow-sm p-6 mb-5 border border-brand-light">
        <h2 className="font-medium text-sm mb-5 text-neutral-950">Order Tracking</h2>
        <div className="flex items-start overflow-x-auto pb-2 scrollbar-hide">
          {trackingSteps.map((step, i) => (
            <div key={step.label} className="flex-1 min-w-[80px] flex flex-col items-center text-center relative">
              {i !== 0 && (
                <div className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${trackingSteps[i - 1].done ? 'bg-brand-gold' : 'bg-brand-light'}`} />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step.done ? 'bg-brand-gold text-white' : 'bg-brand-light text-brand-grey'}`}>
                {step.done ? <Check size={13} /> : <Circle size={8} />}
              </div>
              <p className={`text-xs mt-2 font-medium ${step.done ? 'text-brand-text' : 'text-brand-grey'}`}>{step.label}</p>
              {step.date && (
                <p className="text-[9px] text-brand-grey mt-0.5">
                  {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Addresses and Billing Grid */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Shipping Address */}
        <div className="bg-white shadow-sm p-6 border border-brand-light flex gap-3">
          <MapPin size={18} className="text-brand-gold flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold mb-3">Shipping Address</h2>
            {renderAddress(order.shippingAddress)}
          </div>
        </div>

        {/* Billing Address & Payment Method */}
        <div className="bg-white shadow-sm p-6 border border-brand-light flex gap-3">
          <CreditCard size={18} className="text-brand-gold flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold mb-3">Payment & Billing</h2>
            <div className="mb-4">
              <p className="text-xs text-brand-grey">Payment Option</p>
              <p className="text-sm font-medium text-neutral-800">{order.paymentMethod || 'UPI'}</p>
              {order.paymentGatewayRef && (
                <p className="text-[10px] text-brand-grey font-mono mt-0.5">Ref: {order.paymentGatewayRef}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-brand-grey mb-1">Billing Address</p>
              {renderAddress(order.billingAddress || order.shippingAddress)}
            </div>
          </div>
        </div>
      </div>

      {/* Item details */}
      <div className="bg-white shadow-sm p-6 mb-5 border border-brand-light">
        <h2 className="font-semibold text-sm mb-4">Item Details</h2>
        <div className="space-y-4">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 py-2 border-b border-brand-light last:border-0">
              <img src={item.image} alt={item.name} className="w-16 h-20 object-cover flex-shrink-0 border border-brand-light" loading="lazy" decoding="async" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-neutral-800">{item.name}</p>
                <p className="text-xs text-brand-grey mt-0.5">Qty: {item.qty}</p>
              </div>
              <span className="text-sm font-semibold text-brand-gold">{formatPrice(item.price)}</span>
            </div>
          ))}
        </div>

        {/* Extended Financial breakdown */}
        <div className="mt-6 pt-5 border-t border-brand-light space-y-2 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Coupon Discount</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>{shippingAmount === 0 ? 'FREE' : formatPrice(shippingAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Taxes (GST)</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-brand-light text-neutral-900 font-bold text-base">
            <span>Total Value</span>
            <span className="text-brand-gold">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Customer Action Bar (Contextual) */}
      <div className="bg-white shadow-sm p-5 border border-brand-light flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-brand-grey text-xs">
          <Phone size={14} className="text-brand-gold" />
          <span>Need assistance? Contact our luxury concierge desk.</span>
        </div>
        <div className="flex gap-3">
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-4 py-2 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              id="btn-cancel-order"
            >
              {isCancelling ? 'Requesting...' : 'Cancel Order'}
            </button>
          )}
          <a
            href="https://wa.me/919876500000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-4 hover:bg-neutral-900 hover:text-white"
            id="btn-order-support"
          >
            <MessageSquare size={14} /> Support Chat
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;