const Logo = ({ size = 'md', className = '', showSubtitle = true, darkMode = false }) => {
  const sizes = {
    sm: { container: 'h-10', icon: 'text-3xl', text: 'text-xl', subtitle: 'text-xs' },
    md: { container: 'h-14', icon: 'text-5xl', text: 'text-3xl', subtitle: 'text-xs' },
    lg: { container: 'h-20', icon: 'text-7xl', text: 'text-5xl', subtitle: 'text-sm' },
    xl: { container: 'h-28', icon: 'text-8xl', text: 'text-6xl', subtitle: 'text-base' }
  };

  const s = sizes[size] || sizes.md;
  const textColor = darkMode ? 'text-white' : 'text-orange-600';
  const subtitleColor = darkMode ? 'text-orange-200' : 'text-gray-500';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${s.icon}`} role="img" aria-label="hamburguesa">🍔</span>
      <div className="flex flex-col leading-none">
        <span className={`font-black ${s.text} ${textColor} tracking-tight`}>
          NANO LOMOS
        </span>
        {showSubtitle && (
          <span className={`${s.subtitle} ${subtitleColor} font-semibold tracking-wider`}>
            RESTAURANTE
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
