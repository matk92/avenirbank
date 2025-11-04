'use client';

import { Globe } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useI18n } from '@/contexts/I18nContext';

export default function LanguageSwitcher() {
  const { language, switchLanguage } = useI18n();

  const toggle = () => {
    switchLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={toggle} className="gap-2">
      <Globe className="h-4 w-4" />
      <span className="font-semibold">{language.toUpperCase()}</span>
    </Button>
  );
}
