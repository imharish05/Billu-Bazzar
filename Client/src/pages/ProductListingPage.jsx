import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, Grid2X2, List, X } from 'lucide-react';
import { fetchProducts } from '../redux/slices/productsSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

/* Scroll-reveal using IntersectionObserver + Framer Motion — Vengeance UI pattern (manual impl) */
const useReveal = () => {
  const [revealed, setRevealed] = useState(false);
  const ref = (el) => {
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
  };
  return [ref, revealed];
};

const sortOptions = [
  { label: 'Newest', value: 'createdAt-DESC' },
  { label: 'Price: Low to High', value: 'price-ASC' },
  { label: 'Price: High to Low', value: 'price-DESC' },
  { label: 'Rating', value: 'rating-DESC' },
];

const ProductListingPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: products, loading, total, totalPages } = useSelector(s => s.products);
  const { items: categories } = useSelector(s => s.categories);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: 'createdAt',
    order: 'DESC',
    page: 1,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [revealRef, revealed] = useReveal();

  useEffect(() => {
    dispatch(fetchProducts({ ...filters, limit: 16 }));
    document.title = 'Shop All — Billu Bazaar';
  }, [filters, dispatch]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (val) => {
    const [sort, order] = val.split('-');
    setFilters(prev => ({ ...prev, sort, order }));
  };

  const parentCategories = categories.filter(c => !c.parentId);
  const priceRanges = [
    { label: 'Under ₹1,000', min: 0, max: 1000 },
    { label: '₹1,000 – ₹5,000', min: 1000, max: 5000 },
    { label: '₹5,000 – ₹15,000', min: 5000, max: 15000 },
    { label: 'Above ₹15,000', min: 15000, max: 999999 },
  ];

  return (
    <main id="main-content">
      {/* Breadcrumb + header */}
      <div className="bg-brand-light py-8">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <nav className="text-xs text-brand-grey mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span>Products</span>
          </nav>
          <h1 className="font-playfair text-h2 font-bold text-brand-text">
            {filters.category ? parentCategories.find(c => c.slug === filters.category)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-brand-grey text-sm mt-1">{total} products</p>
        </div>
      </div>

      <div className="max-w-site mx-auto px-6 md:px-8 py-8">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Category filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist">
            <button
              onClick={() => handleFilter('category', '')}
              className={`flex-shrink-0 px-4 py-2 text-xs font-medium border transition-all ${!filters.category ? 'bg-brand-text text-white border-brand-text' : 'border-brand-light text-brand-grey hover:border-brand-text hover:text-brand-text'}`}
              role="tab" aria-selected={!filters.category} id="filter-all"
            >All</button>
            {parentCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleFilter('category', cat.slug)}
                role="tab"
                aria-selected={filters.category === cat.slug}
                id={`filter-${cat.slug}`}
                className={`flex-shrink-0 px-4 py-2 text-xs font-medium border transition-all whitespace-nowrap ${filters.category === cat.slug ? 'bg-brand-text text-white border-brand-text' : 'border-brand-light text-brand-grey hover:border-brand-text hover:text-brand-text'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort + Filter toggle */}
          <div className="flex gap-3 flex-shrink-0">
            <select
              onChange={e => handleSort(e.target.value)}
              className="border border-brand-light text-sm px-3 py-2 bg-white text-brand-text focus:outline-none focus:border-brand-gold"
              aria-label="Sort products"
              id="products-sort"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="border border-brand-light px-4 py-2 flex items-center gap-2 text-sm hover:border-brand-gold transition-colors focus-visible:outline-brand-gold"
              aria-expanded={filtersOpen} id="filters-toggle"
            >
              <SlidersHorizontal size={16} /> Filters
              {filtersOpen && <X size={14} />}
            </button>
          </div>
        </div>

        {/* Expanded filter panel */}
        <motion.div
          initial={false}
          animate={{ height: filtersOpen ? 'auto' : 0, opacity: filtersOpen ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="bg-brand-light p-6 mb-6 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Price range */}
            <div>
              <p className="font-medium text-sm mb-3">Price Range</p>
              <div className="space-y-2">
                {priceRanges.map(range => (
                  <label key={range.label} className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer hover:text-brand-text">
                    <input
                      type="radio"
                      name="priceRange"
                      onChange={() => handleFilter('minPrice', range.min) || handleFilter('maxPrice', range.max)}
                      className="accent-brand-gold"
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>

            {/* New Arrivals */}
            <div>
              <p className="font-medium text-sm mb-3">Collection</p>
              <div className="space-y-2">
                {[
                  { label: 'New Arrivals', key: 'newArrival' },
                  { label: 'Best Sellers', key: 'bestSeller' },
                  { label: 'Featured', key: 'featured' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm text-brand-grey cursor-pointer hover:text-brand-text">
                    <input type="checkbox" className="accent-brand-gold" onChange={e => handleFilter(opt.key, e.target.checked || undefined)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white shadow-sm">
                <div className="skeleton aspect-[3/4]" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-brand-light flex items-center justify-center mb-6">
              <Grid2X2 size={40} className="text-brand-grey" strokeWidth={1} />
            </div>
            <h2 className="font-playfair text-2xl mb-2">No products found</h2>
            <p className="text-brand-grey mb-6">Try adjusting your filters or browse a different category.</p>
            <button onClick={() => setFilters({ category: '', minPrice: '', maxPrice: '', sort: 'createdAt', order: 'DESC', page: 1 })} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div ref={revealRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
                    className={`w-10 h-10 font-medium text-sm transition-all ${filters.page === i + 1 ? 'bg-brand-text text-white' : 'border border-brand-light text-brand-grey hover:border-brand-gold hover:text-brand-gold'}`}
                    id={`page-${i+1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
};

export default ProductListingPage;
