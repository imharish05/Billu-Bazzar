/**
 * Logo component — both apps
 * Renders the circular gold brand logo image alongside styled brand text.
 */
const Logo = ({ size = 'md', className = '', showText = false, fullHeight = false }) => {
  const imageSizes = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const imgSizeClass = fullHeight ? 'h-full w-auto max-h-full py-1.5' : imageSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="Billu Bazaar Logo"
        className={`${imgSizeClass} object-contain bg-black rounded-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]`}
      />
      {showText && (
        <span
          className={`font-playfair font-bold tracking-tight ${textSizes[size]}`}
          style={{ fontFamily: '"Cinzel", Georgia, serif' }}
        >
          <span style={{ color: 'var(--color-gold)' }}>Billu</span>{' '}
          <span className="text-white">Bazaar</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
