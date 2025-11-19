interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full border-dark-700"></div>
      <div className="absolute inset-0 rounded-full border-t-primary-500 animate-spin"></div>
    </div>
  );
}

/**
 * Full page loading spinner
 */
export function FullPageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-white font-semibold">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function InlineLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" className="mr-3" />
      <span className="text-dark-400">{text}</span>
    </div>
  );
}

/**
 * Button loading spinner
 */
export function ButtonLoader() {
  return <LoadingSpinner size="sm" className="inline-block" />;
}
