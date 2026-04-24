import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, MapPin, BookOpen, Wrench, Laptop, Truck, MoreHorizontal, Star, MessageSquare, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Service, Category, City } from '@/types';
import { LoadingScreen } from '@/components/LoadingScreen';
import { toast } from 'sonner';
import { getDocs } from 'firebase/firestore';

export default function ServicesPage() {
  const { t } = useTranslation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catSnap, citySnap] = await Promise.all([
          getDocs(query(collection(db, 'categories'), orderBy('nameAr', 'asc'))),
          getDocs(query(collection(db, 'cities'), orderBy('nameAr', 'asc')))
        ]);
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        setCities(citySnap.docs.map(d => ({ id: d.id, ...d.data() } as City)));
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMeta();

    // Open services are public, but we watch user for re-renders/auth state
    const q = query(
      collection(db, 'services'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setLoading(false);
    }, (error) => {
      console.error("ServicesPage listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <LoadingScreen />;

  const handleHelpRequest = (service: Service) => {
    navigate(`/${lng}/services/${service.id}`);
  };

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
    switch (category) {
      case 'education': return 'bg-emerald-50 text-emerald-600';
      case 'maintenance': return 'bg-orange-50 text-orange-600';
      case 'tech': return 'bg-blue-50 text-blue-600';
      case 'transport': return 'bg-slate-50 text-slate-600';
      case 'design': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">تصفح الخدمات</h1>
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Input 
            placeholder="ابحث عن خدمة..." 
            className="pr-10 rounded-full border-border h-11 bg-card shadow-sm focus:ring-primary/20"
          />
          <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList className="bg-transparent space-x-2 rtl:space-x-reverse overflow-x-auto no-scrollbar justify-start h-auto p-0 pb-1">
          <TabsTrigger 
            value="all"
            className="rounded-full px-6 py-2 border border-border data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary transition-all text-xs font-medium"
          >
            {t('services:all') || 'الكل'}
          </TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="rounded-full px-6 py-2 border border-border data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary transition-all text-xs font-medium"
            >
              {lng === 'ar' ? cat.nameAr : cat.nameEn}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.filter(s => filter === 'all' || s.category === filter).map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card 
              onClick={() => handleHelpRequest(service)}
              className="h-full group hover:border-primary/30 transition-all cursor-pointer p-6 rounded-2xl border border-border shadow-sm hover:shadow-md flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant="secondary" className={`${getTagColor(service.category)} border-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase`}>
                  {getCategoryLabel(service.category)}
                </Badge>
                <div className="flex flex-col items-end">
                   <span className="text-primary font-bold text-lg">+{service.points}</span>
                   <span className="text-[10px] text-muted-foreground uppercase font-bold">{t('common:points')}</span>
                </div>
              </div>

              <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{service.title}</h3>
              
              <div className="flex items-center text-muted-foreground text-xs mb-6 font-medium gap-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md border border-border/50">
                  <MapPin className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-bold text-foreground/80">{getCityLabel(service.city)}</span>
                </div>
                <div className="flex items-center gap-1">
                   <Calendar className="h-3.5 w-3.5 opacity-50" />
                   <span>{service.createdAt?.toDate?.()?.toLocaleDateString() || t('common:now')}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs uppercase">
                    {service.requesterName?.[0] || 'ي'}
                  </div>
                  <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{service.requesterName}</span>
                </div>
                <div className="bg-primary/10 text-primary p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && !loading && (
        <div className="text-center py-20">
          {!user ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg">يرجى تسجيل الدخول لتصفح جميع الخدمات المتاحة.</p>
              <Button onClick={() => navigate(`/${lng}/login`)} className="rounded-full px-8">تسجيل الدخول</Button>
            </div>
          ) : (
            <p className="text-muted-foreground">لا توجد خدمات متاحة حالياً في هذه الفئة.</p>
          )}
        </div>
      )}
    </div>
  );
}
