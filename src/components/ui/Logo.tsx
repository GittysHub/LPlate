import Image from "next/image";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'circular' | 'horizontal';
}

export default function Logo({ size = 'md', className = '', variant = 'horizontal' }: LogoProps) {
  if (variant === 'horizontal') {
    const sizeClasses = {
      sm: 'h-8 w-auto',
      md: 'h-10 w-auto', 
      lg: 'h-12 w-auto'
    };

    return (
      <div className={`inline-flex items-center ${className}`}>
        <Image
          src="/logo.png"
          alt="L PLATE Logo"
          width={120}
          height={40}
          className={sizeClasses[size]}
          priority
          onError={(e) => {
            // Fallback to text-based logo if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="inline-flex items-center px-4 py-2 bg-white border-2 border-green-600 rounded-xl">
                  <div class="relative mr-2">
                    <span class="font-bold text-green-600 text-lg">L</span>
                    <div class="absolute -top-0.5 -right-0.5 w-2 h-3 bg-white transform rotate-12 rounded-sm"></div>
                  </div>
                  <span class="font-bold text-green-600 text-lg">PLATE</span>
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  // Original circular logo fallback
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-24 h-24 text-4xl'
  };

  const borderSizeClasses = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4'
  };

  const leafSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`${sizeClasses[size]} bg-green-600 rounded-full flex items-center justify-center relative ${borderSizeClasses[size]} border-green-200 ${className}`}>
      <div className="text-white font-bold relative">
        L
        <div className={`absolute -top-1 -right-1 ${leafSizeClasses[size]} bg-green-200 rounded-full`}></div>
      </div>
    </div>
  );
}
