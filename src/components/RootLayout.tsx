import { useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ClipboardList, Bell, User as UserIcon, Plus, Search, MessageSquare, Trophy, Wallet, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Logo } from './Logo';

export default function RootLayout() {
  const { lng } = useParams();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
    // Set direction
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng || 'ar';
  }, [lng, i18n]);

  const navItems = [
    { icon: Home, label: t('common:home'), path: `/${lng}/` },
    { icon: Search, label: t('common:browse_services'), path: `/${lng}/services` },
    { icon: MessageSquare, label: t('common:chat'), path: `/${lng}/chat` },
    { icon: UserIcon, label: t('common:profile'), path: `/${lng}/profile` },
    { icon: Bell, label: t('common:notifications'), path: `/${lng}/notifications` },
  ];

  const bottomNavItems = [
    { icon: Home, label: t('common:home'), path: `/${lng}/` },
    { icon: Search, label: t('common:search'), path: `/${lng}/services` },
    { icon: MessageSquare, label: t('common:chat'), path: `/${lng}/chat` },
    { icon: UserIcon, label: t('common:profile'), path: `/${lng}/profile` },
  ];

  const isLandingPage = !user && (location.pathname === `/${lng}/` || location.pathname === `/${lng}`);
  
  const hideMobileNav = [
    `/${lng}/chat/`,
    `/${lng}/services/`
  ].some(prefix => location.pathname.includes(prefix) && location.pathname.split('/').length > 3);

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-white w-full">
        <Toaster position="top-center" />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans flex text-foreground">
      <Toaster position="top-center" />
      
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-card border-l border-border flex-col p-6 shadow-sm shrink-0">
        <div className="flex flex-col items-center gap-3 mb-10">
          <Logo size="lg" className="shadow-md" />
          <h1 className="text-2x font-black text-foreground text-center tracking-tight">{t('common:app_name')}</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path || (item.path === `/${lng}/` && location.pathname === `/${lng}`);
            return (
              <button
                key={`${item.path}-${index}`}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.icon === Bell && unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-bounce-slow">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          
          <button
            onClick={async () => {
              await logout();
              navigate(`/${lng}/`);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors mt-4"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('common:sign_out')}</span>
          </button>
        </nav>

        <div className="mt-auto p-4 bg-muted rounded-2xl">
          <p className="text-xs text-muted-foreground mb-1">{t('common:current_balance')}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{user?.points || 0}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase">{t('common:points')}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col relative ${hideMobileNav ? 'pb-0' : 'pb-20'} md:pb-0 overflow-x-hidden`}>
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center p-8 bg-background/80 backdrop-blur sticky top-0 z-40 gap-4">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder={t('common:search_placeholder')} 
              className="w-full bg-card border border-border rounded-full py-2.5 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
            <span className="absolute rtl:right-3 ltr:left-3 top-2.5 opacity-40">
              <Search className="h-4 w-4" />
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageToggle />
            {user?.isAdmin && (
              <Button 
                variant="outline" 
                size="icon" 
                className="w-10 h-10 rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                onClick={() => navigate(`/${lng}/admin`)}
              >
                <Shield className="h-5 w-5" />
              </Button>
            )}
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon" 
                className="w-10 h-10 rounded-full bg-card border border-border shadow-sm"
                onClick={() => navigate(`/${lng}/notifications`)}
              >
                <Bell className="h-5 w-5" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-background animate-bounce-slow">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <ThemeToggle />
            
            <div className="flex items-center gap-3 bg-card p-1.5 px-4 border border-border rounded-full shadow-sm hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/${lng}/profile`)}>
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold border border-border overflow-hidden">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0] || 'ي'
                )}
              </div>
              <div className="rtl:text-right ltr:text-left">
                <p className="text-xs font-bold">{user?.name || t('common:welcome')}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                  {typeof user?.city === 'object' 
                    ? (lng === 'ar' ? user.city.nameAr : user.city.nameEn) 
                    : t(`common:${user?.city || 'sanaa'}`)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {!hideMobileNav && (
          <>
            {/* FAB - Mobile Only */}
            <div className="md:hidden fixed bottom-24 right-4 z-50">
              <Button 
                size="icon" 
                className="h-14 w-14 rounded-2xl bg-primary shadow-lg hover:scale-105 transition-transform"
                onClick={() => navigate(`/${lng}/post`)}
              >
                <Plus className="h-8 w-8 text-white" />
              </Button>
            </div>

            {/* Bottom Nav - Mobile Only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border flex items-center justify-around px-2 z-40">
              {bottomNavItems.map((item, index) => {
                const isActive = location.pathname === item.path || (item.path === `/${lng}/` && location.pathname === `/${lng}`);
                return (
                  <button
                    key={`${item.path}-${index}`}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center justify-center space-y-1 w-full transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <item.icon className={`h-6 w-6 ${isActive ? 'fill-primary/10' : ''}`} />
                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
