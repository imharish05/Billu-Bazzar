import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockWishlist } from '../../data/mockAccountData';
import { formatPrice } from '../../utils/currency';

/**
 * WishlistPage — /account/wishlist
 * PRD ref: "Customer Account > Wishlist for future purchases" +
 * "Product Listing Page > Wishlist heart icon" (premium).
 * Mock data — local state only so remove/add-to-cart feel real in the demo;
 * swap for `useSelector(s => s.wishlist)` + real product fetch once wired up.
 */
const WishlistPage = () => {
  const [items, setItems] = useState(mockWishlist);

  const remove = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Removed from wishlist');
  };

  const addToCart = (item) => {
    if (!item.inStock) return;
    toast.success(`${item.name} added to cart`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="font-playfair text-xl font-semibold mb-5">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="bg-white shadow-sm p-12 text-center">
          <Heart size={40} className="text-brand-light mx-auto mb-3" strokeWidth={1} />
          <p className="font-playfair text-xl mb-2">Your wishlist is empty</p>
          <p className="text-brand-grey text-sm mb-4">Save items you love for later</p>
          <Link to="/products" className="btn-primary" id="wishlist-empty-shop">Explore Products</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white shadow-sm relative group">
              <button
                onClick={() => remove(item.id)}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-brand-grey hover:text-red-500 transition-colors focus-visible:outline-brand-gold"
                aria-label={`Remove ${item.name} from wishlist`}
                id={`wishlist-remove-${item.id}`}
              >
                <X size={14} />
              </button>
              <Link to={`/products/${item.slug}`} className="block aspect-square overflow-hidden bg-brand-light">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
              </Link>
              <div className="p-4">
                <Link to={`/products/${item.slug}`} className="text-sm font-medium line-clamp-1 hover:text-brand-gold transition-colors">
                  {item.name}
                </Link>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <span className="text-sm font-semibold text-brand-gold">{formatPrice(item.price)}</span>
                  {item.comparePrice && (
                    <span className="text-xs text-brand-grey line-through">{formatPrice(item.comparePrice)}</span>
                  )}
                  {!item.inStock && <span className="text-xs text-red-500 ml-auto">Out of stock</span>}
                </div>
                <button
                  onClick={() => addToCart(item)}
                  disabled={!item.inStock}
                  className="btn-outline w-full text-xs py-2 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  id={`wishlist-add-cart-${item.id}`}
                >
                  <ShoppingBag size={14} /> {item.inStock ? 'Add to Cart' : 'Notify Me'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WishlistPage;