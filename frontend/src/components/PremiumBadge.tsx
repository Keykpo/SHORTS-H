import { FiStar } from 'react-icons/fi';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PremiumBadge({ size = 'md', className = '' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-2 py-0.5 ${className}`} title="Usuario Premium">
      <FiStar className={`${sizeClasses[size]} text-white`} aria-hidden="true" />
      <span className={`${sizeClasses[size]} font-bold text-white`}>PRO</span>
    </div>
  );
}
