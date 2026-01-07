import { useSageTheme } from '@/contexts/SageThemeContext';

type SageType = 'confucius' | 'laozi' | 'buddha' | 'plato';

interface SageAvatarProps {
  sage: SageType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
}

const sageInfo: Record<SageType, { name: string; nameEn: string; icon: string }> = {
  confucius: { name: '孔子', nameEn: 'Confucius', icon: '儒' },
  laozi: { name: '老子', nameEn: 'Laozi', icon: '道' },
  buddha: { name: '释迦牟尼', nameEn: 'Buddha', icon: '佛' },
  plato: { name: '柏拉图', nameEn: 'Plato', icon: 'Φ' },
};

const sizeClasses = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-xl',
  lg: 'w-20 h-20 text-2xl',
};

export function SageAvatar({ sage, size = 'md', showName = false, onClick }: SageAvatarProps) {
  const info = sageInfo[sage];

  return (
    <div 
      className="flex flex-col items-center gap-2"
      onClick={onClick}
    >
      <div 
        className={`
          sage-avatar rounded-full border-2 
          flex items-center justify-center
          ${sizeClasses[size]}
          border-foreground/30 bg-transparent
          transition-all duration-300
        `}
      >
        {/* Line art style icon */}
        <span className="font-serif text-foreground">
          {info.icon}
        </span>
      </div>
      
      {showName && (
        <span className="text-sm text-foreground/70 transition-colors duration-300">
          {info.name}
        </span>
      )}
    </div>
  );
}

// Group component for displaying all four sages (pure display, no theme switching)
export function SageAvatarGroup({ 
  size = 'md', 
  showNames = false,
  onSageClick 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showNames?: boolean;
  onSageClick?: (sage: SageType) => void;
}) {
  const sages: SageType[] = ['confucius', 'laozi', 'buddha', 'plato'];

  return (
    <div className="flex items-center justify-center gap-6">
      {sages.map(sage => (
        <SageAvatar 
          key={sage} 
          sage={sage} 
          size={size} 
          showName={showNames}
          onClick={() => onSageClick?.(sage)}
        />
      ))}
    </div>
  );
}
