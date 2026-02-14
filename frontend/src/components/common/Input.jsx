export const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}) => {
  // Tema CLARO con colores NANLOMO
  const baseStyles = 'px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-400 focus:ring-orange-400 focus:border-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed';
  const errorStyles = error ? 'border-orange-500 focus:ring-orange-500' : 'border-gray-300';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-bold text-gray-700 mb-2">
          {label}
          {required && <span className="text-orange-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${baseStyles} ${errorStyles} ${widthClass}`}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-orange-500">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
