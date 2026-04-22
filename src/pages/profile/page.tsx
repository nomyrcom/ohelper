import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, LogOut, Star, History, Bell, Edit2, ChevronLeft, ChevronRight, Coins, Wallet, Shield, Check, X, Briefcase } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { City, Service } from '@/types';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, collectionGroup, getDocs } from 'firebase/firestore';
// ...
import { db } from '@/lib/firebase';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { lng, userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout, updateProfile } = useAuth();

  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState<City>('sanaa');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'services'>('services');
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Reviews state
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  const isOwnProfile = !userId || userId === currentUser?._id;

  useEffect(() => {
    // Fetch cities from firestore
    const citiesQuery = query(collection(db, 'cities'), orderBy('nameAr', 'asc'));
    const unsubscribe = onSnapshot(citiesQuery, (snapshot) => {
      const citiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
      setCities(citiesList);
      setLoadingCities(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        if (currentUser) {
          setEditName(currentUser.name || '');
          setEditBio(currentUser.bio || '');
          setEditCity(currentUser.city || 'sanaa');
        }
        setLoading(false);
      } else if (userId) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setProfileUser({ ...userDoc.data(), _id: userDoc.id });
          } else {
            toast.error(t('common:user_not_found') || 'المستخدم غير موجود');
            navigate(`/${lng}/`);
          }
        } catch (error) {
          console.error(error);
          toast.error(t('common:error_loading_profile') || 'حدث خطأ أثناء تحميل الملف الشخصي');
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProfile();
  }, [userId, currentUser, isOwnProfile, lng, navigate, t]);

  const fetchReviews = async () => {
    if (!profileUser?._id) return;
    setLoadingReviews(true);
    setShowReviews(true);
    try {
      const q = query(
        collectionGroup(db, 'ratings'),
        where('toId', '==', profileUser._id),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error(t('common:error_loading_reviews') || 'حدث خطأ أثناء تحميل التقييمات');
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (profileUser) {
      // Fetch service history
      const q = query(
        collection(db, 'services'),
        where('requesterId', '==', profileUser._id),
      );
      
      const q2 = query(
        collection(db, 'services'),
        where('providerId', '==', profileUser._id),
      );

      const unsub1 = onSnapshot(q, (snap) => {
        const s1 = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
        setUserServices(prev => {
          const others = prev.filter(p => !s1.find(s => s.id === p.id) && p.providerId === profileUser._id);
          return [...s1, ...others].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        });
        setLoadingServices(false);
      });

      const unsub2 = onSnapshot(q2, (snap) => {
        const s2 = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
        setUserServices(prev => {
          const others = prev.filter(p => !s2.find(s => s.id === p.id) && p.requesterId === profileUser._id);
          return [...s2, ...others].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        });
        setLoadingServices(false);
      });

      return () => {
        unsub1();
        unsub2();
      };
    }
  }, [profileUser]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: editName,
        bio: editBio,
        city: editCity,
      });
      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setIsSaving(false);
    }
  };

  const transactions = [
    { id: '1', reason: t('common:signup_bonus') || 'مكافأة تسجيل', amount: 100, date: '2026-04-10', type: 'credit' },
  ];

  if (loading || loadingCities) return <div className="p-10 text-center font-bold">{t('common:loading_profile')}...</div>;
  if (!profileUser) return <div className="p-10 text-center">{t('common:user_not_found')}</div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {isOwnProfile ? t('common:profile') : `${t('common:profile_of') || 'ملف'} ${profileUser.name}`}
        </h1>
        {isOwnProfile && (
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border bg-card shadow-sm">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Profile Info Card */}
      <Card className="p-8 rounded-2xl border-border bg-card shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={profileUser.photoUrl} />
            <AvatarFallback className="bg-primary text-white text-4xl font-bold">
              {profileUser.name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-right flex-1">
            <h2 className="text-2xl font-black text-foreground">{profileUser.name}</h2>
            <p className="text-muted-foreground font-medium mb-2">
              {typeof profileUser.city === 'object' 
                ? (lng === 'ar' ? profileUser.city.nameAr : profileUser.city.nameEn) 
                : t(`common:${profileUser.city}`)}، اليمن
            </p>
            {profileUser.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 max-w-md mb-4 mx-auto md:mx-0 leading-relaxed font-medium">
                {profileUser.bio}
              </p>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="secondary" className="bg-accent text-primary rounded-full px-3 border-0 py-1 font-bold text-[10px] uppercase">{t('common:trusted_user') || 'مستخدم موثوق'}</Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 rounded-full px-3 border-0 py-1 font-bold text-[10px] uppercase">{t('common:active_volunteer') || 'متطوع نشط'}</Badge>
            </div>
          </div>

          {isOwnProfile && (
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full px-6 h-10 gap-2 border-border shadow-sm hover:bg-muted shrink-0">
                  <Edit2 className="h-4 w-4" />
                  <span className="text-sm font-bold">{t('common:edit_data') || 'تعديل البيانات'}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md border-border p-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-foreground">{t('common:edit_profile') || 'تعديل ملفك الشخصي'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="px-1 text-sm font-bold">{t('common:full_name') || 'الاسم الكامل'}</Label>
                    <Input 
                      id="name" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t('common:name') || "اسمك هنا..."}
                      className="rounded-xl h-11 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="px-1 text-sm font-bold">{t('common:city') || 'المدينة'}</Label>
                    <Select value={typeof editCity === 'object' ? editCity.id : editCity} onValueChange={(v) => {
                      const selectedCity = cities.find(c => c.id === v);
                      setEditCity(selectedCity || v as any);
                    }}>
                      <SelectTrigger className="rounded-xl h-11 border-border">
                        <SelectValue placeholder={t('common:select_city') || "اختر المدينة..."} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl font-sans">
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {lng === 'ar' ? city.nameAr : city.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="px-1 text-sm font-bold">{t('common:bio') || 'نبذة تعريفية'}</Label>
                    <Textarea 
                      id="bio" 
                      value={editBio} 
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder={t('common:bio_placeholder') || "أخبر المجتمع شيئاً عنك..."}
                      className="rounded-xl min-h-[100px] border-border leading-relaxed"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="ghost" className="rounded-xl flex-1 font-bold">{t('common:cancel') || 'إلغاء'}</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="rounded-xl flex-1 bg-primary text-white font-bold"
                  >
                    {isSaving ? t('common:saving') || 'جاري الحفظ...' : t('common:save') || 'حفظ التغييرات'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Column */}
        <div className="md:col-span-1 space-y-6">
          <Card 
            className="p-6 rounded-2xl bg-card border-border shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-primary/20 transition-colors"
            onClick={fetchReviews}
          >
            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
              <Star className="h-7 w-7 text-orange-400 fill-orange-400" />
            </div>
            <span className="text-3xl font-black text-foreground">
              {profileUser.ratingCount ? (profileUser.ratingSum / profileUser.ratingCount).toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
              {profileUser.ratingCount || 0} {t('common:ratings') || 'تقييم'}
            </span>
          </Card>

          <Card className="p-6 rounded-2xl bg-card border-border shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <span className="text-3xl font-black text-foreground">{profileUser.points || 0}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">{t('common:points')}</span>
          </Card>
        </div>

        {/* History Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('common:activity_history') || 'سجل النشاط'}
              </h3>
            </div>
            
            <div className="flex p-1 bg-muted rounded-xl w-fit">
              <Button 
                variant={activeTab === 'services' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('services')}
                className={`rounded-lg px-4 font-bold ${activeTab === 'services' ? 'bg-card shadow-sm' : ''}`}
              >
                {t('common:browse_services') || 'الخدمات'}
              </Button>
              {isOwnProfile && (
                <Button 
                  variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('transactions')}
                  className={`rounded-lg px-4 font-bold ${activeTab === 'transactions' ? 'bg-card shadow-sm' : ''}`}
                >
                  {t('common:transactions') || 'العمليات المادية'}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {activeTab === 'services' ? (
                <motion.div
                  key="services-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {loadingServices ? (
                    <div className="p-8 text-center text-muted-foreground font-bold">{t('common:loading_services') || 'جاري تحميل الخدمات...'}</div>
                  ) : userServices.length === 0 ? (
                    <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl flex flex-col items-center gap-3">
                      <Briefcase className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-bold">{t('common:no_services_yet') || 'لا يوجد سجل خدمات حتى الآن'}</p>
                      {isOwnProfile && <Button variant="outline" size="sm" onClick={() => navigate(`/${lng}/post`)} className="rounded-xl">{t('common:request_help_now') || 'طلب مساعدة الآن'}</Button>}
                    </div>
                  ) : (
                    userServices.map((service, idx) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => navigate(`/${lng}/services/${service.id}`)}
                        className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${service.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">{service.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[9px] uppercase px-1.5 py-0 border-0 rounded-md font-black ${
                                service.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                service.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {t(`services:status_${service.status}`)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {service.requesterId === profileUser._id ? (t('common:requested') || 'طلبته') : (t('common:provided') || 'قدمته')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black ${service.requesterId === profileUser._id ? 'text-red-500' : 'text-primary'}`}>
                            {service.requesterId === profileUser._id ? '-' : '+'}{service.points}
                          </span>
                          <p className="text-[9px] text-muted-foreground font-black uppercase">{t('common:points')}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="transactions-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {transactions.map((tx, idx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tx.type === 'credit' ? 'bg-accent text-primary' : 'bg-red-50 text-red-600'}`}>
                          <Coins className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight">{tx.reason}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">{tx.date}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${tx.type === 'credit' ? 'text-primary' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : ''}{tx.amount}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Settings/Account Actions Section */}
      {isOwnProfile && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">{t('common:account_settings') || 'إعدادات الحساب'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 justify-between px-6 bg-card border-border rounded-xl hover:bg-muted group transition-all">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell className="h-5 w-5" />
                </div>
                <span className="font-bold text-foreground">{t('common:system_notifications') || 'تنبيهات النظام'}</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 ring-4 ring-red-500/20" />
            </Button>

            <Button variant="outline" className="h-16 justify-between px-6 bg-card border-border rounded-xl hover:bg-muted group transition-all">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                </div>
                <span className="font-bold text-foreground">{t('common:security_privacy') || 'الأمان والخصوصية'}</span>
              </div>
              {lng === 'ar' ? <ChevronLeft className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </Button>

            <Button 
              variant="outline" 
              className="md:col-span-2 h-16 justify-between px-6 bg-red-50/10 border-red-100 rounded-xl hover:bg-red-50 text-red-600 group transition-all"
              onClick={logout}
            >
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LogOut className="h-5 w-5" />
                </div>
                <span className="font-bold">{t('common:logout') || 'تسجيل الخروج من الحساب'}</span>
              </div>
              <span className="text-[10px] uppercase font-black opacity-50 tracking-widest">Logout</span>
            </Button>
          </div>
        </section>
      )}

      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="rounded-2xl max-w-md border-border p-8 overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-400 fill-orange-400" />
              {t('common:user_reviews') || 'تقييمات المستخدمين'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingReviews ? (
              <div className="p-8 text-center text-muted-foreground font-bold">{t('common:loading_reviews') || 'جاري تحميل التقييمات...'}</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-medium">{t('common:no_reviews_yet') || 'لا توجد تقييمات لهذا المستخدم بعد'}</div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="flex items-center gap-2 cursor-pointer group/user"
                      onClick={() => {
                        setShowReviews(false);
                        navigate(`/${lng}/profile/${rev.fromId}`);
                      }}
                    >
                      {rev.fromPhotoUrl ? (
                        <img src={rev.fromPhotoUrl} alt={rev.fromName} className="h-8 w-8 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                          {rev.fromName?.[0] || 'ي'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground group-hover/user:text-primary transition-colors">{rev.fromName || (t('common:unknown_user') || 'مستخدم')}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {rev.createdAt?.toDate?.()?.toLocaleDateString() || ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-2.5 w-2.5 ${s <= rev.rating ? 'fill-orange-400 text-orange-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <div className="relative">
                      <p className="text-sm text-foreground/80 leading-relaxed italic pr-4">
                        {rev.comment}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl w-full font-bold">{t('common:close') || 'إغلاق'}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
