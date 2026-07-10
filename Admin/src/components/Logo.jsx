const Logo = ({ size = 'md', className = '', showText = true }) => {
  const imageSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: '16px',
    md: '20px',
    lg: '28px',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.jpg"
        alt="Billu Bazaar Logo"
        className={`${imageSizes[size]} object-cover rounded-full border border-amber-500/30 shadow-[0_2px_8px_rgba(197,136,55,0.15)]`}
      />
      {showText && (
        <span style={{ fontFamily: '"Cinzel", Georgia, serif', fontSize: textSizes[size], fontWeight: 700 }}>
          <span style={{ color: 'var(--color-gold, #C58837)' }}>Billu</span>{' '}
          <span style={{ color: 'var(--color-text, #1A1A1A)' }}>Bazaar</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
