import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, User as UserIcon, BookOpen, Wrench, Laptop, Truck, MoreHorizontal, MapPin, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { ThemeToggle } from '@/components/ThemeToggle';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service, Category, City } from '@/types';
import LandingPage from './LandingPage';
import { Logo } from '@/components/Logo';

export default function HomePage() {
  const { t } = useTranslation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!user) return <LandingPage />;

  const { unreadCount } = useNotifications();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('nameAr', 'asc')));
      const citySnap = await getDocs(query(collection(db, 'cities'), orderBy('nameAr', 'asc')));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setCities(citySnap.docs.map(d => ({ id: d.id, ...d.data() } as City)));
    };
    fetchData();

    const q = query(
      collection(db, 'services'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setLoading(false);
    }, (error) => {
      console.error("HomePage listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getCategoryLabel = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return t(`services:${id}`);
    return lng === 'ar' ? cat.nameAr : cat.nameEn;
  };

  const getCityLabel = (id: string) => {
    const city = cities.find(c => c.id === id);
    if (!city) return t(`common:${id}`);
    return lng === 'ar' ? city.nameAr : city.nameEn;
  };
   
  const getTagColor = (category: string) => {
    // We can use a simple hash of the ID to pick a color if needed, 
    // or just default based on common categories.
    switch (category) {
      case 'education': return 'bg-emerald-50 text-emerald-600';
      case 'maintenance': return 'bg-orange-50 text-orange-600';
      case 'tech': return 'bg-blue-50 text-blue-600';
      case 'transport': return 'bg-slate-50 text-slate-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Mobile Top Bar (Hidden on Desktop) */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <button className="p-2 text-muted-foreground">
          <Search className="h-6 w-6" />
        </button>
        <div className="flex flex-col items-center">
            <Logo size="md" />
            <span className="text-[10px] font-bold text-primary mt-0.5">{t('common:app_name')}</span>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <ThemeToggle />
          <button 
            onClick={() => navigate(`/${lng}/notifications`)}
            className="p-2 text-muted-foreground relative"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-background animate-bounce-slow">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid Header Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Banner */}
        <div className="bg-primary rounded-2xl p-6 md:p-8 text-white md:col-span-2 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-bold mb-2">{t('services:help_others')}</h2>
            <p className="text-primary-foreground/80 text-sm mb-6 max-w-xs">
              {t('services:banner_desc')}
            </p>
            <button 
              onClick={() => navigate(`/${lng}/post`)}
              className="bg-white text-primary px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-slate-50 transition-colors w-fit"
            >
              {t('services:order_now')}
            </button>
          </div>
          {/* Decorative shapes */}
          <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        </div>

        {/* Stats Cards */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{t('services:stats_completed')}</p>
          <div className="mt-2">
            <h3 className="text-3xl font-bold text-foreground">12</h3>
            <div className="flex items-center gap-1 text-primary text-xs mt-1">
              <Star className="h-3 w-3 fill-primary" />
              <span>4.9</span>
              <span className="text-muted-foreground">(8 {t('common:ratings')})</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{t('services:stats_points')}</p>
          <div className="mt-2">
            <h3 className="text-3xl font-bold text-foreground">{user?.points || 0}</h3>
            <div className="text-xs text-primary mt-1 font-medium">{t('common:current_balance')}</div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => navigate(`/${lng}/services`)}
          className="px-5 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap border shrink-0 bg-primary text-white border-primary shadow-sm"
        >
          {t('services:all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/${lng}/services?category=${cat.id}`)}
            className="px-5 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap border shrink-0 bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            {lng === 'ar' ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </section>

      {/* Services List */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wide">{t('services:recent_requests')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/${lng}/services/${service.id}`)}
            >
              <Card className={`h-full p-5 flex flex-col rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-primary/30`}>
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className={`${getTagColor(service.category)} border-0 rounded px-2 py-1 text-[10px] font-bold uppercase`}>
                    {getCategoryLabel(service.category)}
                  </Badge>
                  <span className="text-primary font-bold text-sm">+{service.points} {t('common:points')}</span>
                </div>

                <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{service.title}</h4>
                <p className="text-muted-foreground text-xs line-clamp-2 mb-6 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-accent-foreground uppercase shadow-inner">
                    {service.requesterName?.[0] || 'ي'}
                  </div>
                  <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{service.requesterName}</span>
                  <div className="mr-auto flex items-center gap-1 py-1 px-2 bg-muted/50 rounded-lg border border-border/50">
                    <MapPin className="h-2.5 w-2.5 text-primary/70" />
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                      {getCityLabel(service.city)}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
