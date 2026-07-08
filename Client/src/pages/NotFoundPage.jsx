import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const NotFoundPage = () => (
  <main id="main-content" className="min-h-screen flex flex-col">
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 404 large display */}
        <h1
          className="font-playfair font-bold text-[120px] md:text-[180px] leading-none"
          style={{ color: 'transparent', WebkitTextStroke: '2px #C9A24B' }}
          aria-label="404"
        >
          404
        </h1>
        <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-brand-text mt-2 mb-3">
          Page Not Found
        </h2>
        <p className="text-brand-grey text-base max-w-md mx-auto mb-8">
          The page you're looking for has moved, been removed, or doesn't exist. Let's get you back to the good stuff.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary flex items-center gap-2" id="404-home">
            <Home size={16} /> Back to Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-outline flex items-center gap-2" id="404-back">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
        <div className="mt-10">
          <p className="text-brand-grey text-sm mb-3">You might be looking for:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['New Arrivals', 'Party Wear', 'Jewelry', 'Perfumes', 'My Account'].map(link => (
              <Link key={link} to="/products" className="text-brand-gold text-sm hover:underline focus-visible:outline-brand-gold">{link}</Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
    <Footer />
  </main>
);

export default NotFoundPage;
