import React from 'react';
import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const { resolvedTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-10 h-10',    // Small (40px)
    md: 'w-16 h-16',    // Medium (64px) - Double of w-8
    lg: 'w-20 h-20',    // Large (80px) - Double of w-10
    xl: 'w-32 h-32'     // Extra Large (128px)
  };

  const logoSrc = resolvedTheme === 'dark' ? '/darklogo.png' : '/512.png';

  return (
    <img 
      src={logoSrc} 
      alt="Ya Mo'een Logo" 
      className={`${sizeClasses[size]} object-contain rounded-xl ${className}`}
      onError={(e) => {
        // Fallback to 512.png if darklogo.png fails to load
        (e.target as HTMLImageElement).src = '/512.png';
      }}
    />
  );
};
