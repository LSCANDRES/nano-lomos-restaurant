import { useToast as useToastContext } from '../context/ToastContext';

/**
 * Hook personalizado para mostrar notificaciones toast
 * @returns {Object} Métodos para mostrar diferentes tipos de notificaciones
 */
export const useToast = () => {
  return useToastContext();
};

export default useToast;
