const StatsCard = ({ icon, label, value, color = 'default', loading = false }) => {
  // Simplificado a Rojo + Gris
  const colorClasses = {
    default: 'border-gray-300 text-gray-700',
    red: 'border-orange-500 text-orange-600',
    gold: 'border-gray-300 text-gray-700',
    yellow: 'border-gray-300 text-gray-700',
    purple: 'border-gray-300 text-gray-700',
    green: 'border-gray-300 text-gray-700',
    blue: 'border-gray-300 text-gray-700',
  };

  return (
    <div className={`bg-white border-2 ${colorClasses[color]} rounded-lg p-4 shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
