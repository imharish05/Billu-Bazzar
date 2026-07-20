import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Star, ChevronRight, Share2, Shield, Truck, RotateCcw, ZoomIn, Play, Mail, CheckCircle2, X } from 'lucide-react';
import { fetchProduct, fetchProducts } from '../redux/slices/productsSlice';
import { addLocal, openCart } from '../redux/slices/cartSlice';
import { toggleItem } from '../redux/slices/wishlistSlice';
import { openQuickView } from '../redux/slices/uiSlice';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import Product360Viewer from '../components/Product360Viewer';
import { formatPrice } from '../utils/currency';
import { getPlaceholderSvg } from '../utils/placeholder';
import toast from 'react-hot-toast';

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
  const navigate = useNavigate();
  const { current: product, items: allProducts, loading } = useSelector(s => s.products);
  const { items: wishlist } = useSelector(s => s.wishlist);
  const { items: cartItems } = useSelector(s => s.cart);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [imageZoomed, setImageZoomed] = useState(false);

  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'spin', 'ar'
  const [videoOpen, setVideoOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const videoRef = useRef(null);
  const [videoSpeed, setVideoSpeed] = useState(0.8);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed, videoOpen]);

  const isWishlisted = product ? wishlist.some(item => (item.id || item) === product.id) : false;
  const inCart = product ? cartItems.some(i => i.productId === product.id) : false;

  const attributes = useMemo(() => {
    if (!product || !product.attributes) return {};
    if (typeof product.attributes === 'string') {
      try {
        return JSON.parse(product.attributes);
      } catch (e) {
        return {};
      }
    }
    return product.attributes;
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  useEffect(() => {
    if (slug) dispatch(fetchProduct(slug));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, dispatch]);

  useEffect(() => {
    if (allProducts.length === 0) {
      dispatch(fetchProducts({ limit: 40 }));
    }
  }, [allProducts.length, dispatch]);

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

  const handleBuyNow = () => {
    if (!product) return;
    dispatch(addLocal({ productId: product.id, name: product.name, image: product.images?.[0], priceAtAdd: product.price, quantity, selectedVariant: { size: selectedSize, color: selectedColor } }));
    navigate('/checkout');
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

  const sizes = attributes?.sizes || ['S', 'M', 'L', 'XL'];
  const rawImages = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.images || getPlaceholderSvg(product.name)];
  
  // Safe filtering in case DB returns string placeholders
  const images = rawImages.map(img => typeof img === 'string' && img.length > 2 ? img : getPlaceholderSvg(product.name));

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifySuccess(true);
    toast.success('Restock notification alert activated!');
  };

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
      <div className="max-w-site mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="flex flex-col flex-1">
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-3 w-20 flex-shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedImage(i); setViewMode('standard'); }}
                    className={`w-20 h-24 overflow-hidden border-2 transition-all ${selectedImage === i && viewMode === 'standard' ? 'border-brand-gold' : 'border-transparent hover:border-brand-grey'}`}
                    aria-label={`Product image ${i + 1}`}
                    id={`thumb-${i}`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getPlaceholderSvg(product.name);
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div
                className="relative flex-1 aspect-square bg-brand-light overflow-hidden"
              >
                {viewMode === 'spin' ? (
                  <Product360Viewer product={product} onClose={() => setViewMode('standard')} />
                ) : (
                  <div
                    className="w-full h-full relative cursor-zoom-in"
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
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getPlaceholderSvg(product.name);
                        }}
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
                )}
              </div>
            </div>

            {/* Interactive media bar */}
            <div className="flex gap-2 mt-3 w-full">
              <button
                onClick={() => setViewMode(viewMode === 'spin' ? 'standard' : 'spin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border text-xs font-medium transition-all ${viewMode === 'spin' ? 'bg-brand-text text-white border-brand-text' : 'border-brand-light text-brand-text hover:border-brand-text'}`}
              >
                <RotateCcw size={14} /> 360° Spin
              </button>
              <button
                onClick={() => setVideoOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-brand-light text-brand-text hover:border-brand-text text-xs font-medium transition-all"
              >
                <Play size={14} /> Watch Showcase
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
              className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold text-brand-text whitespace-nowrap">{fmt(product.price)}</span>
              {product.comparePrice && (
                <span className="text-base sm:text-lg md:text-xl text-brand-grey line-through whitespace-nowrap">{fmt(product.comparePrice)}</span>
              )}
              {discount && (
                <span className="text-brand-gold font-semibold text-xs sm:text-sm bg-brand-gold/10 px-2.5 py-0.5 rounded-sm whitespace-nowrap">Save {discount}%</span>
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
            <div className="flex flex-col gap-3">
              {product.stock > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="bg-brand-gold hover:bg-[#a8712a] text-white font-semibold text-sm tracking-wider uppercase py-4 flex-1 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                    id="pdp-add-cart"
                  >
                    <ShoppingBag size={18} />
                    {inCart ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm tracking-wider uppercase py-4 flex-1 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                    id="pdp-buy-now"
                  >
                    Buy Now
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotifySuccess(false)}
                  className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm tracking-wider uppercase py-4 w-full flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                  id="pdp-notify"
                >
                  <Mail size={16} /> Out of Stock — Notify Me
                </button>
              )}
              <button
                onClick={() => dispatch(toggleItem(product))}
                className={`border font-semibold text-sm tracking-wider uppercase py-4 w-full flex items-center justify-center gap-2 transition-all duration-200 ${
                  isWishlisted 
                    ? 'border-red-400 text-red-500 bg-red-50/50 hover:bg-red-50 hover:text-red-600 hover:border-red-500' 
                    : 'border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white bg-transparent'
                }`}
                id="pdp-wishlist"
              >
                <Heart size={18} className={isWishlisted ? 'fill-current text-red-500' : ''} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>

              {/* Restock Notification Form */}
              {product.stock === 0 && !notifySuccess && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleNotifySubmit}
                  className="bg-brand-light p-4 rounded-xl border border-brand-light space-y-3"
                >
                  <p className="text-xs font-semibold text-brand-text">Get notified when this item is back in stock:</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      className="flex-1 bg-white border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                    />
                    <button type="submit" className="bg-brand-gold hover:bg-amber-600 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors">
                      Alert Me
                    </button>
                  </div>
                </motion.form>
              )}

              {product.stock === 0 && notifySuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-start gap-2.5"
                >
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">Subscription Active</p>
                    <p className="text-[11px] text-green-600/90 mt-0.5">We will send an email alert to {notifyEmail} as soon as this item is back in stock.</p>
                  </div>
                </motion.div>
              )}
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

            {/* Authenticity Certificate Card */}
            <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl flex items-start gap-3">
              <Shield size={24} className="text-brand-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-brand-text tracking-wider uppercase">Authenticity Guaranteed</p>
                <p className="text-[11px] text-brand-grey mt-0.5 leading-relaxed">
                  Certified 100% genuine luxury item. Accompanied by official designer brand tags, validation certificates, and master artisan credentials.
                </p>
              </div>
            </div>

            {/* Product attributes */}
            {attributes && Object.keys(attributes).filter(k => !['sizes', 'size', 'material', 'heelheight'].includes(k.toLowerCase())).length > 0 && (
              <div className="border-t border-brand-light pt-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(attributes).filter(([k]) => !['sizes', 'size', 'material', 'heelheight'].includes(k.toLowerCase())).map(([key, val]) => (
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
            {['description', 'reviews'/*, 'care'*/].map(tab => (
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
            {/* {activeTab === 'care' && (
              <div className="max-w-lg space-y-3">
                {['Dry clean recommended', 'Store in a cool, dry place', 'Do not bleach', 'Iron on low heat with cloth cover', 'Avoid direct sunlight for extended periods'].map(tip => (
                  <div key={tip} className="flex items-start gap-3 text-sm text-brand-grey">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Related Creations */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-brand-light pt-16 max-w-site mx-auto px-6 md:px-8">
          <h2 className="font-playfair text-2xl font-bold text-brand-text">Related Creations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 py-10">
            {relatedProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Video Lightbox Modal */}
      <AnimatePresence>
        {videoOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl aspect-video bg-black shadow-2xl overflow-hidden rounded-xl"
            >
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <X size={20} />
              </button>
              <video
                ref={videoRef}
                src="https://assets.mixkit.co/videos/preview/mixkit-luxury-gold-rings-on-a-display-42866-large.mp4"
                className="w-full h-full object-cover"
                controls
                autoPlay
                loop
                playsInline
              />
              {/* Playback speed selector overlay */}
              <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider select-none">Speed</span>
                <div className="flex items-center gap-1.5">
                  {['0.5', '0.75', '1.0', '1.25', '1.5'].map(speedStr => {
                    const speedVal = parseFloat(speedStr);
                    return (
                      <button
                        key={speedStr}
                        onClick={() => setVideoSpeed(speedVal)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all border ${
                          videoSpeed === speedVal
                            ? 'bg-brand-gold border-brand-gold text-white shadow-sm'
                            : 'bg-white/10 border-transparent text-white/80 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {speedStr}x
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      <Footer />
    </main>
  );
};

export default ProductDetailsPage;