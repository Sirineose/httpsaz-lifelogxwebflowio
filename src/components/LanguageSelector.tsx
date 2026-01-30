import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
];

interface LanguageSelectorProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function LanguageSelector({ variant = 'icon', className }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const currentLanguage = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 p-2.5 rounded-xl hover:bg-secondary transition-colors',
            className
          )}
          aria-label="Select language"
        >
          {variant === 'icon' ? (
            <Globe className="w-5 h-5" />
          ) : (
            <>
              <span className="text-lg">{currentLanguage.flag}</span>
              <span className="text-sm font-medium">{currentLanguage.label}</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              i18n.language === lang.code && 'bg-primary/10 text-primary'
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
