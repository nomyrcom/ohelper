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
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service } from '@/types';

export default function HomePage() {
  const { t } = useTranslation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We allow public listing of open services now, but if we want to track user context (like points), 
    // we should wait for user or just let it run.
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

  const getTagColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-emerald-50 text-emerald-600';
      case 'maintenance': return 'bg-orange-50 text-orange-600';
      case 'tech': return 'bg-blue-50 text-blue-600';
      case 'transport': return 'bg-slate-50 text-slate-600';
      case 'design': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const categories = [
    { id: 'all', label: t('services:all') },
    { id: 'tech', label: t('services:tech') },
    { id: 'education', label: t('services:education') },
    { id: 'maintenance', label: t('services:maintenance') },
    { id: 'design', label: t('services:design') },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Mobile Top Bar (Hidden on Desktop) */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <button className="p-2 text-muted-foreground">
          <Search className="h-6 w-6" />
        </button>
        <div className="flex flex-col items-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">ي</div>
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
        {categories.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/${lng}/services`)}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap border shrink-0 ${
              idx === 0 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {cat.label}
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
                    {t(`services:${service.category}`)}
                  </Badge>
                  <span className="text-primary font-bold text-sm">+{service.points} {t('common:points')}</span>
                </div>

                <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{service.title}</h4>
                <p className="text-muted-foreground text-xs line-clamp-2 mb-6 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-accent-foreground uppercase">
                    {service.requesterName?.[0] || 'ي'}
                  </div>
                  <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{service.requesterName}</span>
                  <span className="text-[10px] text-muted-foreground mr-auto">
                    {t(`common:${service.city}`)} • {service.createdAt?.toDate?.()?.toLocaleDateString() || t('common:now')}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
