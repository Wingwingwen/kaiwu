import { useSageTheme, SageTheme } from '@/contexts/SageThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';

type ThemeOption = {
  key: SageTheme;
  name: string;
  color: string;
  description: string;
};

const themeOptions: ThemeOption[] = [
  { 
    key: 'confucius', 
    name: '儒雅赭红', 
    color: 'bg-[#8B4513]',
    description: '温暖的中国古典风格'
  },
  { 
    key: 'laozi', 
    name: '道法纯白', 
    color: 'bg-white border border-gray-300',
    description: '清净无为的极简风格'
  },
  { 
    key: 'buddha', 
    name: '禅意金色', 
    color: 'bg-[#D4AF37]',
    description: '庄严的佛光金色'
  },
  { 
    key: 'plato', 
    name: '希腊橄榄', 
    color: 'bg-[#808000]',
    description: '古典的地中海风格'
  },
];

export function ThemeSelector() {
  const { lockTheme, lockedTheme } = useSageTheme();

  const currentTheme = themeOptions.find(t => t.key === lockedTheme) || themeOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 icon-glow rounded-full">
          <div className={`w-4 h-4 rounded-full ${currentTheme.color}`} />
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themeOptions.map((theme) => (
          <DropdownMenuItem
            key={theme.key}
            onClick={() => lockTheme(theme.key)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-full ${theme.color} flex-shrink-0`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{theme.name}</div>
              <div className="text-xs text-muted-foreground">{theme.description}</div>
            </div>
            {lockedTheme === theme.key && (
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
