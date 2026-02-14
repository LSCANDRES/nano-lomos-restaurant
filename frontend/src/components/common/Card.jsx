export const Card = ({ 
  children, 
  title, 
  subtitle,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...props 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 ${className}`} {...props}>
      {(title || subtitle) && (
        <div className={`px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700 ${headerClassName}`}>
          {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-orange-100">{subtitle}</p>}
        </div>
      )}
      
      <div className={`px-6 py-4 ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
