import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Star, ChevronRight, Share2, Shield, Truck, RotateCcw, ZoomIn } from 'lucide-react';
import { fetchProduct } from '../redux/slices/productsSlice';
import { addLocal, openCart } from '../redux/slices/cartSlice';
import { toggleItem } from '../redux/slices/wishlistSlice';
import { openQuickView } from '../redux/slices/uiSlice';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import currencyJs from 'currency.js';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

/* Seeded review data — displayed per product */
const mockReviews = [
  { id: 1, name: 'Priya N.', rating: 5, date: 'June 15, 2025', text: 'Absolutely stunning quality! The fabric feels luxurious and the embroidery is exquisite. Received so many compliments at the event.', verified: true },
  { id: 2, name: 'Aisha S.', rating: 5, date: 'May 28, 2025', text: 'Worth every rupee. The packaging was beautiful too — felt like opening a gift. Will definitely order again.', verified: true },
  { id: 3, name: 'Kavya R.', rating: 4, date: 'May 10, 2025', text: 'Beautiful piece, sizing runs slightly large so I recommend going one size down. Customer service was very helpful.', verified: true },
  { id: 4, name: 'Sunita P.', rating: 5, date: 'April 22, 2025', text: 'My go-to for all festive occasions. The quality is consistently excellent and delivery was faster than expected!', verified: true },
];

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { current: product, loading } = useSelector(s => s.products);
  const { items: wishlist } = useSelector(s => s.wishlist);
  const { items: cartItems } = useSelector(s => s.cart);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [imageZoomed, setImageZoomed] = useState(false);

  const isWishlisted = product ? wishlist.includes(product.id) : false;
  const inCart = product ? cartItems.some(i => i.productId === product.id) : false;

  useEffect(() => {
    if (slug) dispatch(fetchProduct(slug));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, dispatch]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Billu Bazaar`;
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addLocal({ productId: product.id, name: product.name, image: product.images?.[0], priceAtAdd: product.price, quantity, selectedVariant: { size: selectedSize, color: selectedColor } }));
    dispatch(openCart());
  };

  if (loading || !product) {
    return (
      <main id="main-content">
        <div className="max-w-site mx-auto px-6 md:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="skeleton aspect-square" />
            <div className="space-y-6 pt-8">
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-6 w-1/3" />
              <div className="skeleton h-10 w-1/2" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  const sizes = product.attributes?.sizes || ['S', 'M', 'L', 'XL'];
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.images || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800'];

  return (
    <main id="main-content">
      {/* Breadcrumb */}
      <div className="max-w-site mx-auto px-6 md:px-8 py-4">
        <nav className="text-xs text-brand-grey flex items-center gap-1 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-brand-gold transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={12} />
              <Link to={`/products?category=${product.category?.slug}`} className="hover:text-brand-gold transition-colors">{product.category?.name}</Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-brand-text truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Product Layout */}
      <div className="max-w-site mx-auto px-6 md:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="flex flex-col gap-3 w-20 flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-brand-gold' : 'border-transparent hover:border-brand-grey'}`}
                  aria-label={`Product image ${i + 1}`}
                  id={`thumb-${i}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div
              className="relative flex-1 aspect-square bg-brand-light overflow-hidden cursor-zoom-in"
              onClick={() => setImageZoomed(!imageZoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {discount && (
                <span className="absolute top-4 left-4 bg-brand-gold text-white text-xs font-bold px-3 py-1">
                  −{discount}%
                </span>
              )}
              <button className="absolute top-4 right-4 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors" aria-label="Zoom image">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            {product.category && (
              <p className="text-brand-gold text-xs tracking-[0.2em] uppercase">
                {product.category?.name}
              </p>
            )}

            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-brand-text leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(product.rating || 4) ? 'fill-brand-gold text-brand-gold' : 'fill-brand-light text-brand-light'} />
                ))}
              </div>
              <span className="text-sm text-brand-grey">{product.reviewCount || mockReviews.length} reviews</span>
              <a href="#reviews" className="text-sm text-brand-gold hover:underline">Read reviews</a>
            </div>

            {/* Price — React Bits price reveal pattern (inline motion) */}
            <motion.div
              className="flex items-baseline gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="font-playfair text-4xl font-bold text-brand-text">{fmt(product.price)}</span>
              {product.comparePrice && (
                <span className="text-xl text-brand-grey line-through">{fmt(product.comparePrice)}</span>
              )}
              {discount && (
                <span className="text-brand-gold font-semibold text-sm">Save {discount}%</span>
              )}
            </motion.div>

            <p className="text-brand-grey text-sm leading-relaxed">{product.shortDescription}</p>

            {/* Size selector */}
            {sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-sm">Select Size {selectedSize && <span className="text-brand-gold">— {selectedSize}</span>}</p>
                  <button className="text-xs text-brand-gold underline focus-visible:outline-brand-gold" id="size-guide-btn">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border text-sm font-medium transition-all focus-visible:outline-brand-gold ${selectedSize === size ? 'border-brand-text bg-brand-text text-white' : 'border-brand-light text-brand-text hover:border-brand-grey'}`}
                      id={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="font-medium text-sm">Quantity</p>
              <div className="flex items-center border border-brand-light">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-brand-light transition-colors focus-visible:outline-brand-gold" aria-label="Decrease quantity">−</button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-brand-light transition-colors focus-visible:outline-brand-gold" aria-label="Increase quantity">+</button>
              </div>
              <span className="text-xs text-brand-grey">{product.stock} in stock</span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={product.stock === 0}
                id="pdp-add-cart"
              >
                <ShoppingBag size={18} />
                {inCart ? 'Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => dispatch(toggleItem(product.id))}
                className={`btn-outline flex items-center justify-center gap-2 ${isWishlisted ? 'border-red-300 text-red-400' : ''}`}
                id="pdp-wishlist"
              >
                <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-light">
              {[
                { icon: Truck, label: 'Free Shipping', sub: 'on orders ₹1499+' },
                { icon: RotateCcw, label: 'Easy Returns', sub: '7-day return policy' },
                { icon: Shield, label: 'Secure Payment', sub: 'Razorpay secured' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1">
                  <Icon size={20} className="text-brand-gold" strokeWidth={1.5} />
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[11px] text-brand-grey">{sub}</p>
                </div>
              ))}
            </div>

            {/* Product attributes */}
            {product.attributes && Object.keys(product.attributes).filter(k => !['sizes', 'size'].includes(k)).length > 0 && (
              <div className="border-t border-brand-light pt-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(product.attributes).filter(([k]) => !['sizes', 'size'].includes(k)).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="text-brand-grey capitalize">{key}:</span>
                      <span className="font-medium text-brand-text">{Array.isArray(val) ? val.join(', ') : val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs — Description / Reviews */}
        <div className="mt-16 border-t border-brand-light" id="reviews">
          <div className="flex" role="tablist">
            {['description', 'reviews', 'care'].map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                id={`pdp-tab-${tab}`}
                className={`px-6 py-4 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-brand-gold text-brand-gold' : 'border-transparent text-brand-grey hover:text-brand-text'}`}
              >
                {tab === 'reviews' ? `Reviews (${mockReviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="max-w-2xl">
                <p className="text-brand-grey leading-relaxed">{product.description}</p>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {mockReviews.map(review => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 pb-6 border-b border-brand-light last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{review.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-sm">{review.name}</span>
                        {review.verified && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5">Verified Purchase</span>}
                        <span className="text-xs text-brand-grey">{review.date}</span>
                      </div>
                      <div className="flex mb-2">
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= review.rating ? 'fill-brand-gold text-brand-gold' : 'fill-brand-light text-brand-light'} />)}
                      </div>
                      <p className="text-sm text-brand-grey leading-relaxed">{review.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {activeTab === 'care' && (
              <div className="max-w-lg space-y-3">
                {['Dry clean recommended', 'Store in a cool, dry place', 'Do not bleach', 'Iron on low heat with cloth cover', 'Avoid direct sunlight for extended periods'].map(tip => (
                  <div key={tip} className="flex items-start gap-3 text-sm text-brand-grey">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default ProductDetailsPage;
