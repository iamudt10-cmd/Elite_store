'use client';

export default function GlassSelect({
  label,
  error,
  options = [],
  className = '',
  id,
  ...rest
}) {
  return (
    <div className={`flex flex-col w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">
          {label}
        </label>
      )}
      
      <select
        id={id}
        className={`glass w-full bg-white/30 rounded-2xl py-3 px-4 text-gray-700 text-sm border-white/30 focus:outline-none focus:ring-2 focus:ring-lavender-300/60 focus:bg-white/40 ${
          error ? 'border-red-400 focus:ring-red-200' : ''
        }`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-gray-700">
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-red-500 text-xs mt-1 ml-2 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
