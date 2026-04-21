import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lng } = useParams();

  const toggleLanguage = () => {
    const newLng = i18n.language === 'ar' ? 'en' : 'ar';
    const newPath = location.pathname.replace(`/${lng}`, `/${newLng}`);
    navigate(newPath);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-full px-4 hover:bg-primary/10 transition-colors"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-bold uppercase">{i18n.language === 'ar' ? 'English' : 'عربي'}</span>
    </Button>
  );
}
