import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';

const Footer = () => (
  <footer className="bg-brand-text text-white" role="contentinfo">
    {/* Newsletter Banner */}
    <div className="border-b border-white/10">
      <div className="max-w-site mx-auto px-6 md:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="font-playfair text-2xl font-semibold text-white mb-1">Join the Billu Bazaar Circle</h2>
          <p className="text-white/60 text-sm">Early access, exclusive offers, and style inspiration in your inbox.</p>
        </div>
        <form className="flex gap-0 w-full md:w-auto" onSubmit={e => e.preventDefault()} aria-label="Newsletter signup">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 md:w-72 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-brand-gold"
            aria-label="Email address for newsletter"
          />
          <button type="submit" className="px-6 py-3 bg-brand-gold text-white font-semibold text-sm hover:bg-yellow-600 transition-colors focus-visible:outline-white" id="newsletter-submit">
            Subscribe
          </button>
        </form>
      </div>
    </div>

    {/* Main Footer Grid */}
    <div className="max-w-site mx-auto px-6 md:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      {/* Brand */}
      <div>
        <Logo size="lg" className="mb-4" />
        <p className="text-white/60 text-sm leading-relaxed mb-6">
          Curating India's finest luxury fashion, jewelry, perfumes and accessories since 2019. Where heritage meets modernity.
        </p>
        <div className="flex gap-3">
          {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
            <a key={i} href="#" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-brand-gold hover:text-brand-gold transition-all duration-200 focus-visible:outline-white" aria-label={`Social link ${i+1}`}>
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="font-playfair text-lg font-semibold text-white mb-5">Collections</h3>
        <ul className="space-y-3">
          {['Party Wear', 'Jewelry', 'Perfumes', 'Accessories', 'Footwear', 'New Arrivals', 'Best Sellers'].map(link => (
            <li key={link}>
              <Link to={`/products?search=${link}`} className="text-white/60 text-sm hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">
                {link}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Customer Service */}
      <div>
        <h3 className="font-playfair text-lg font-semibold text-white mb-5">Help & Info</h3>
        <ul className="space-y-3">
          {['Track My Order', 'Returns & Exchange', 'Size Guide', 'Loyalty Program', 'Affiliate Program', 'Gift Cards', 'Contact Us'].map(link => (
            <li key={link}>
              <Link to={link === 'Contact Us' ? '/contact' : '/account'} className="text-white/60 text-sm hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">
                {link}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-playfair text-lg font-semibold text-white mb-5">Get in Touch</h3>
        <ul className="space-y-4">
          <li className="flex gap-3 text-white/60 text-sm">
            <MapPin size={16} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <span>14 Linking Road, Bandra West,<br />Mumbai, Maharashtra 400050</span>
          </li>
          <li className="flex gap-3 text-white/60 text-sm">
            <Phone size={16} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <a href="tel:+919999999999" className="hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">+91 99999 99999</a>
          </li>
          <li className="flex gap-3 text-white/60 text-sm">
            <Mail size={16} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <a href="mailto:hello@billubazaar.com" className="hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">hello@billubazaar.com</a>
          </li>
        </ul>
        <p className="text-white/40 text-xs mt-6">Mon–Sat: 10am–8pm IST</p>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="border-t border-white/10">
      <div className="max-w-site mx-auto px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
        <p>© {new Date().getFullYear()} Billu Bazaar. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">Terms of Service</Link>
          <Link to="/sitemap" className="hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">Sitemap</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
