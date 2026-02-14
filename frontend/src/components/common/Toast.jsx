import { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✓';
    }
  };

  const getStyles = () => {
    const baseStyles = 'pointer-events-auto shadow-2xl rounded-xl p-4 pr-12 max-w-md relative border-l-4 backdrop-blur-sm';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-900`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-900`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-900`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-900`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-900`;
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={getStyles()}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{getIcon()}</span>
          <div className="flex-1 pt-0.5">
            <p className="font-semibold text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
