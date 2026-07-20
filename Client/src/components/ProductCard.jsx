import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, RotateCcw } from 'lucide-react';
import { openQuickView } from '../redux/slices/uiSlice';
import { addLocal, openCart } from '../redux/slices/cartSlice';
import { toggleItem } from '../redux/slices/wishlistSlice';
import { formatPrice } from '../utils/currency';
import { getPlaceholderSvg } from '../utils/placeholder';

/**
 * ProductCard — used in grids, carousels, search results.
 * Hover state exposes quick-view + add-to-cart. Framer Motion stagger entrance.
 * NOT glass — uses standard white card surface per spec.
 */
const ProductCard = ({ product, index = 0 }) => {
  const dispatch = useDispatch();
  const wishlist = useSelector(s => s.wishlist.items) || [];
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isWishlisted = wishlist.some(item => (item.id || item) === product.id);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const discount = (product.comparePrice && Number(product.comparePrice) > Number(product.price))
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addLocal({ productId: product.id, name: product.name, image: product.images?.[0], priceAtAdd: product.price, quantity: 1 }));
    dispatch(openCart());
  };

  return (
    /* Staggered grid entrance — Framer Motion */
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="relative bg-white flex flex-col border border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-300"
      aria-label={product.name}
    >
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="group block relative overflow-hidden aspect-[3/4] bg-brand-light" target="_blank" rel="noopener noreferrer">
        {/* Skeleton while image loads */}
        {!imgLoaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
        <img
          src={product.images?.[0] || getPlaceholderSvg(product.name)}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getPlaceholderSvg(product.name);
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.spin_images?.length > 1 && (
            <span className="bg-black/70 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 tracking-wider uppercase flex items-center gap-1 border border-white/10 rounded-sm">
              <RotateCcw size={9} /> 360°
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-brand-text text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">New</span>
          )}
          {discount !== null && discount > 0 && (
            <span className="bg-brand-gold text-white text-[10px] font-bold px-2 py-0.5">−{discount}%</span>
          )}
          {product.isBestSeller && (discount === null || discount <= 0) && (
            <span className="bg-white text-brand-text text-[10px] font-bold px-2 py-0.5 border border-brand-text">Best Seller</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); dispatch(toggleItem(product)); }}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all duration-200 ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-brand-grey hover:text-red-400'} focus-visible:outline-brand-gold`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          id={`wishlist-${product.id}`}
        >
          <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
        </button>

        {/* Hover overlay — quick-view + add to cart */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 flex translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-10">
          <button
            onClick={(e) => { e.preventDefault(); dispatch(openQuickView(product)); }}
            className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 py-3 text-white text-xs font-medium hover:bg-white/10 transition-colors border-r border-white/20 focus-visible:outline-white"
            aria-label={`Quick view ${product.name}`}
            id={`qv-${product.id}`}
          >
            <Eye size={14} /> <span className="hidden lg:inline">Quick View</span>
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-1.5 lg:gap-2 py-3 text-white text-xs font-medium hover:bg-white/10 transition-colors focus-visible:outline-white"
            aria-label={`Add ${product.name} to cart`}
            id={`add-cart-${product.id}`}
          >
            <ShoppingBag size={14} /> <span className="hidden lg:inline">Add to Cart</span>
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        {product.category && (
          <p className="text-[11px] text-brand-gold font-medium tracking-widest uppercase mb-1">
            {product.category?.name || ''}
          </p>
        )}
        <Link to={`/products/${product.slug}`} className="hover:text-brand-gold transition-colors" target="_blank" rel="noopener noreferrer">
          <h3 className="font-inter font-medium text-sm leading-snug text-brand-text line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={11} className={s <= Math.round(product.rating || 4) ? 'fill-brand-gold text-brand-gold' : 'fill-brand-light text-brand-light'} />
          ))}
          {product.reviewCount > 0 && <span className="text-[11px] text-brand-grey ml-1">({product.reviewCount})</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-auto">
          <span className="font-semibold text-brand-text whitespace-nowrap">{fmt(product.price)}</span>
          {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
            <span className="text-brand-grey text-sm line-through whitespace-nowrap">{fmt(product.comparePrice)}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
