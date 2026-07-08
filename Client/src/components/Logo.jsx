/**
 * Logo component — both apps
 * Brand text rendered in Playfair Display gold. Uses CSS var --brand-logo-text.
 * No hardcoded image file — pure CSS/text logo.
 */
const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <span
      className={`font-playfair font-bold tracking-tight ${sizes[size]} ${className}`}
      style={{ color: 'var(--color-gold)', fontFamily: '"Playfair Display", Georgia, serif' }}
    >
      Billu{' '}
      <span style={{ color: 'var(--color-text)' }}>Bazaar</span>
    </span>
  );
};

export default Logo;
