const Logo = ({ size = 'md', className = '' }) => {
  const sizes = { sm: '18px', md: '22px', lg: '28px' };
  return (
    <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: sizes[size], fontWeight: 700 }} className={className}>
      <span style={{ color: '#C9A24B' }}>Billu</span>{' '}
      <span style={{ color: '#1A1A1A' }}>Bazaar</span>
    </span>
  );
};
export default Logo;
