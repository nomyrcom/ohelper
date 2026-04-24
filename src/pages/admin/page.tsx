import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  collection, query, getDocs, doc, updateDoc, 
  deleteDoc, orderBy, where, onSnapshot, limit,
  writeBatch, increment, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogClose, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Users, ClipboardList, CheckCircle, Ban, TrendingUp, 
  Search, Shield, Trash2, Plus, Minus, UserCheck, 
  UserX, AlertCircle, RefreshCcw, Coins, Star, ChevronRight,
  User as UserIcon, Mail, MapPin, Calendar, LayoutGrid, Map as MapIcon,
  RotateCcw, AlertTriangle, Loader2
} from 'lucide-react';
import { User, Service, Category, City } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { addDoc, getDoc } from 'firebase/firestore';

export default function AdminPage() {
  const { t } = useTranslation();
  
  // Dashboard Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [openServices, setOpenServices] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  // Management Lists
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const ITEMS_PER_PAGE = 10;
  const [usersPage, setUsersPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [citiesPage, setCitiesPage] = useState(1);
  
  // Point Dialog State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointAmount, setPointAmount] = useState('0');
  const [isPointDialogOpen, setIsPointDialogOpen] = useState(false);

  // Category/City Dialog State
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [manageType, setManageType] = useState<'category' | 'city'>('category');
  const [editItem, setEditItem] = useState<any>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  // Reset Site State
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetUsers, setResetUsers] = useState(false);
  const [resetServices, setResetServices] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const { user: currentUser } = useAuth();

  const fetchStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const servicesSnap = await getDocs(collection(db, 'services'));
      
      setTotalUsers(usersSnap.size);
      setTotalServices(servicesSnap.size);
      
      let points = 0;
      let ratings = 0;
      let ratedCount = 0;
      usersSnap.forEach(u => {
        const data = u.data() as User;
        points += (data.points || 0);
        if (data.ratingCount > 0) {
          ratings += (data.ratingSum / data.ratingCount);
          ratedCount++;
        }
      });
      
      setTotalPoints(points);
      if (ratedCount > 0) setAvgRating(ratings / ratedCount);

      let opened = 0;
      let finished = 0;
      servicesSnap.forEach(s => {
        const data = s.data() as Service;
        if (data.status === 'open') opened++;
        if (data.status === 'completed') finished++;
      });
      setOpenServices(opened);
      setCompletedServices(finished);
    } catch (error) {
      console.error("Admin fetchStats error:", error);
    }
  };

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      setLoading(false);
      return;
    }

    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(100)), (snap) => {
      setUsers(snap.docs.map(d => d.data() as User));
    });

    const unsubServices = onSnapshot(query(collection(db, 'services'), orderBy('createdAt', 'desc'), limit(100)), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });

    const unsubCategories = onSnapshot(query(collection(db, 'categories'), orderBy('nameAr', 'asc')), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    const unsubCities = onSnapshot(query(collection(db, 'cities'), orderBy('nameAr', 'asc')), (snap) => {
      setCities(snap.docs.map(d => ({ id: d.id, ...d.data() } as City)));
    });

    fetchStats();
    setLoading(false);

    return () => {
      unsubUsers();
      unsubServices();
      unsubCategories();
      unsubCities();
    };
  }, [currentUser?.isAdmin]);

  if (loading) return <LoadingScreen />;

  const handleSaveManageItem = async () => {
    if (!nameAr || !nameEn) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    const colName = manageType === 'category' ? 'categories' : 'cities';
    
    try {
      if (editItem) {
        await updateDoc(doc(db, colName, editItem.id), {
          nameAr,
          nameEn,
          updatedAt: serverTimestamp()
        });
        toast.success(t('update_success'));
      } else {
        await addDoc(collection(db, colName), {
          nameAr,
          nameEn,
          createdAt: serverTimestamp()
        });
        toast.success(t('add_success'));
      }
      setIsManageDialogOpen(false);
      setNameAr('');
      setNameEn('');
      setEditItem(null);
    } catch (error) {
      toast.error('فشل الحفظ');
    }
  };

  const handleDeleteManageItem = async (id: string, type: 'category' | 'city') => {
    if (!confirm(t('delete_confirm'))) return;
    const colName = type === 'category' ? 'categories' : 'cities';
    try {
      await deleteDoc(doc(db, colName, id));
      toast.success(t('delete_success'));
    } catch (error) {
      toast.error('فشل الحذف');
    }
  };

  const handleResetSite = async () => {
    if (!resetUsers && !resetServices) {
      toast.error('يرجى اختيار نوع واحد على الأقل من البيانات لحذفه');
      return;
    }

    if (!confirm('تحذير نهائي: هذا الإجراء سيقوم بحذف جميع البيانات المختارة نهائياً ولا يمكن التراجع عنه. هل أنت متأكد؟')) return;

    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      
      if (resetServices) {
        const servicesSnap = await getDocs(collection(db, 'services'));
        servicesSnap.forEach(s => batch.delete(s.ref));
        
        // Also delete messages
        const messagesSnap = await getDocs(collection(db, 'service_messages')); // Assuming standard collection name
        messagesSnap.forEach(m => batch.delete(m.ref));
        
        // Notifications related to services could go here
      }

      if (resetUsers) {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(u => {
          // Important: Don't delete the current admin user!
          if (u.id !== currentUser?._id) {
            batch.delete(u.ref);
          }
        });
      }

      await batch.commit();
      toast.success('تمت إعادة تعيين البيانات بنجاح');
      setIsResetDialogOpen(false);
      fetchStats();
    } catch (error) {
      console.error("Reset site error:", error);
      toast.error('فشل في إعادة تعيين الموقع');
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdatePoints = async () => {
    if (!selectedUser || !pointAmount) return;
    const amount = parseInt(pointAmount);
    if (isNaN(amount)) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser._id), {
        points: increment(amount)
      });
      toast.success(amount > 0 ? `تم إضافة ${amount} نقطة` : `تم خصم ${Math.abs(amount)} نقطة`);
      setIsPointDialogOpen(false);
      setPointAmount('0');
      fetchStats(); // Update total points stat
    } catch (error) {
      toast.error('فشل تحديث النقاط');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus
      });
      toast.success('تم تحديث الصلاحيات');
    } catch (error) {
      toast.error('فشل تحديث الصلاحيات');
    }
  };

  const handleCancelService = async (serviceId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الخدمة نهائياً؟')) return;
    try {
      await updateDoc(doc(db, 'services', serviceId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      toast.success('تم إلغاء الخدمة بنجاح');
    } catch (error) {
      toast.error('فشل إلغاء الخدمة');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('تحذير: سيتم حذف المستخدم نهائياً. هل أنت متأكد؟')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('تم حذف المستخدم بنجاح');
    } catch (error) {
      toast.error('فشل حذف المستخدم');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    serviceFilter === 'all' ? true : s.status === serviceFilter
  );

  // Pagination Logic
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);
  const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedServices = filteredServices.slice((servicesPage - 1) * ITEMS_PER_PAGE, servicesPage * ITEMS_PER_PAGE);
  const totalServicesPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);

  const paginatedCategories = categories.slice((categoriesPage - 1) * ITEMS_PER_PAGE, categoriesPage * ITEMS_PER_PAGE);
  const totalCategoriesPages = Math.ceil(categories.length / ITEMS_PER_PAGE);

  const paginatedCities = cities.slice((citiesPage - 1) * ITEMS_PER_PAGE, citiesPage * ITEMS_PER_PAGE);
  const totalCitiesPages = Math.ceil(cities.length / ITEMS_PER_PAGE);

  const stats = [
    { label: 'المستخدمين', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'إجمالي الطلبات', value: totalServices, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'طلبات مفتوحة', value: openServices, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'طلبات مكتملة', value: completedServices, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'إجمالي النقاط', value: totalPoints, icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'متوسط التقييم', value: avgRating.toFixed(1), icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            لوحة الإدارة
          </h1>
          <p className="text-muted-foreground mt-1">إدارة المستخدمين والخدمات المنشورة في المنصة</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2 border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl"
          onClick={() => setIsResetDialogOpen(true)}
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين الموقع
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-4 flex flex-col gap-2 border-border/50 shadow-sm">
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase">{stat.label}</p>
              <p className="text-xl font-black text-foreground">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl grid grid-cols-2 h-auto md:flex md:h-11 w-full max-w-2xl mx-auto mb-8 shadow-sm">
          <TabsTrigger value="users" className="rounded-xl font-bold px-4 py-2.5 md:px-8 transition-all flex items-center gap-2 text-xs md:text-sm">
            المستخدمين
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1 pointer-events-none bg-primary/10 text-primary border-0 text-[10px] flex items-center justify-center">
              {users.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-xl font-bold px-4 py-2.5 md:px-8 transition-all flex items-center gap-2 text-xs md:text-sm">
            الخدمات
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1 pointer-events-none bg-primary/10 text-primary border-0 text-[10px] flex items-center justify-center">
              {services.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl font-bold px-4 py-2.5 md:px-8 transition-all flex items-center gap-2 text-xs md:text-sm">
            {t('categories')}
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1 pointer-events-none bg-primary/10 text-primary border-0 text-[10px] flex items-center justify-center">
              {categories.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cities" className="rounded-xl font-bold px-4 py-2.5 md:px-8 transition-all flex items-center gap-2 text-xs md:text-sm">
            {t('governorates')}
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1 pointer-events-none bg-primary/10 text-primary border-0 text-[10px] flex items-center justify-center">
              {cities.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="البحث بالاسم أو البريد..." 
              className="pr-10 rounded-xl"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUsersPage(1);
              }}
            />
          </div>

          <div className="grid gap-4">
            {paginatedUsers.map(u => {
              const uPublished = services.filter(s => s.requesterId === u._id).length;
              const uExecuted = services.filter(s => s.providerId === u._id && s.status === 'completed').length;
              
              return (
                <Card key={u._id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black shrink-0">
                      {u.name?.[0] || 'ي'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground flex items-center gap-2 truncate">
                        {u.name}
                        {u.isAdmin && <Badge className="bg-primary/10 text-primary border-0 text-[10px] py-0">مسؤول</Badge>}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        <div className="flex gap-2 mr-2 border-r pr-2 border-border/50">
                          <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">منشور: <span className="text-foreground">{uPublished}</span></span>
                          <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">أنجز: <span className="text-foreground">{uExecuted}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="text-center min-w-[40px]">
                      <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">النقاط</p>
                      <p className="font-black text-primary leading-none text-lg">{u.points}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 border-r pr-4 border-border">
                      <Button 
                        size="sm" variant="ghost" className="h-8 gap-2 hover:bg-emerald-50 text-emerald-600 font-bold px-2"
                        onClick={() => {
                          setSelectedUser(u);
                          setPointAmount('10');
                          setIsPointDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        تعديل النقاط
                      </Button>

                      <Button 
                        size="sm" variant="ghost" className="h-8 text-xs font-bold px-2"
                        onClick={() => handleToggleAdmin(u._id, !!u.isAdmin)}
                      >
                        {u.isAdmin ? <UserX className="h-4 w-4 ml-1" /> : <UserCheck className="h-4 w-4 ml-1" />}
                        {u.isAdmin ? 'إزالة الإدارة' : 'تعيين إدارة'}
                      </Button>
                      
                      <Button 
                        size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteUser(u._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalUsersPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={usersPage === 1}
                onClick={() => setUsersPage(prev => prev - 1)}
              >
                السابق
              </Button>
              <span className="text-sm font-bold text-muted-foreground">
                صفحة {usersPage} من {totalUsersPages}
              </span>
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={usersPage === totalUsersPages}
                onClick={() => setUsersPage(prev => prev + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'open', 'active', 'confirming', 'completed', 'cancelled'].map(status => (
              <Badge 
                key={status}
                variant={serviceFilter === status ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-1.5 rounded-lg font-bold"
                onClick={() => {
                  setServiceFilter(status);
                  setServicesPage(1);
                }}
              >
                {status === 'all' ? 'الكل' : 
                 status === 'open' ? 'مفتوح' : 
                 status === 'active' ? 'نشط' : 
                 status === 'confirming' ? 'بانتظار التأكيد' : 
                 status === 'completed' ? 'مكتمل' : 'ملغي'}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4">
            {paginatedServices.map(s => (
              <Card key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-border shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground">{s.title}</h4>
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 uppercase">{s.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">طالب الخدمة: {s.requesterName}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">المقابل</p>
                    <p className="font-black text-primary">{s.points} نقطة</p>
                  </div>

                  <div className="flex items-center gap-2 border-r pr-4 border-border">
                    {s.status !== 'completed' && s.status !== 'cancelled' && (
                      <Button 
                        size="sm" variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 font-bold"
                        onClick={() => handleCancelService(s.id)}
                      >
                        <Ban className="h-4 w-4 ml-1" />
                        إلغاء المشروع
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalServicesPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={servicesPage === 1}
                onClick={() => setServicesPage(prev => prev - 1)}
              >
                السابق
              </Button>
              <span className="text-sm font-bold text-muted-foreground">
                صفحة {servicesPage} من {totalServicesPages}
              </span>
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={servicesPage === totalServicesPages}
                onClick={() => setServicesPage(prev => prev + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">{t('manage_categories')}</h3>
            <Button 
              className="gap-2 rounded-xl font-bold"
              onClick={() => {
                setManageType('category');
                setEditItem(null);
                setNameAr('');
                setNameEn('');
                setIsManageDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('add_category')}
            </Button>
          </div>
          <div className="grid gap-3">
            {paginatedCategories.map(cat => (
              <Card key={cat.id} className="p-4 flex items-center justify-between border-border shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{cat.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{cat.nameEn}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" size="sm" className="font-bold"
                    onClick={() => {
                      setManageType('category');
                      setEditItem(cat);
                      setNameAr(cat.nameAr);
                      setNameEn(cat.nameEn);
                      setIsManageDialogOpen(true);
                    }}
                  >
                    {t('edit_data')}
                  </Button>
                  <Button 
                    variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteManageItem(cat.id, 'category')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {totalCategoriesPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={categoriesPage === 1}
                onClick={() => setCategoriesPage(prev => prev - 1)}
              >
                السابق
              </Button>
              <span className="text-sm font-bold text-muted-foreground">
                صفحة {categoriesPage} من {totalCategoriesPages}
              </span>
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={categoriesPage === totalCategoriesPages}
                onClick={() => setCategoriesPage(prev => prev + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cities" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">{t('manage_cities')}</h3>
            <Button 
              className="gap-2 rounded-xl font-bold"
              onClick={() => {
                setManageType('city');
                setEditItem(null);
                setNameAr('');
                setNameEn('');
                setIsManageDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('add_city')}
            </Button>
          </div>
          <div className="grid gap-3">
            {paginatedCities.map(city => (
              <Card key={city.id} className="p-4 flex items-center justify-between border-border shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{city.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{city.nameEn}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" size="sm" className="font-bold"
                    onClick={() => {
                      setManageType('city');
                      setEditItem(city);
                      setNameAr(city.nameAr);
                      setNameEn(city.nameEn);
                      setIsManageDialogOpen(true);
                    }}
                  >
                    {t('edit_data')}
                  </Button>
                  <Button 
                    variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteManageItem(city.id, 'city')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {totalCitiesPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={citiesPage === 1}
                onClick={() => setCitiesPage(prev => prev - 1)}
              >
                السابق
              </Button>
              <span className="text-sm font-bold text-muted-foreground">
                صفحة {citiesPage} من {totalCitiesPages}
              </span>
              <Button 
                variant="outline" size="sm" className="rounded-xl font-bold"
                disabled={citiesPage === totalCitiesPages}
                onClick={() => setCitiesPage(prev => prev + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Point Adjustment Dialog */}
      <Dialog open={isPointDialogOpen} onOpenChange={setIsPointDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="text-center font-black">تعديل نقاط المستخدم</DialogTitle>
            <DialogDescription className="text-center">
              تعديل رصيد النقاط لـ {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">الرصيد الحالي</p>
                  <p className="text-lg font-black text-primary">{selectedUser?.points || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold px-1">المبلغ (استخدم - للخصم)</label>
              <div className="relative">
                <Input 
                  type="number"
                  value={pointAmount}
                  onChange={(e) => setPointAmount(e.target.value)}
                  className="rounded-xl border-border h-12 bg-background pl-4 font-bold text-center text-xl"
                  placeholder="مثال: 50 أو -50"
                  autoFocus
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <RefreshCcw className="h-4 w-4 text-muted-foreground animate-spin-slow" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleUpdatePoints}
              className="w-full bg-primary text-white rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
            >
              تأكيد التعديل
            </Button>
            <DialogClose render={<Button variant="ghost" className="w-full font-bold" />}>
              إلغاء
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category/City Manage Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="text-center font-black">
              {editItem ? (manageType === 'category' ? t('edit_category') : t('edit_city')) : (manageType === 'category' ? t('add_category') : t('add_city'))}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold px-1">{t('name_ar')}</label>
              <Input 
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="rounded-xl border-border h-12 bg-background font-bold text-right"
                placeholder="مثال: تعليم"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold px-1">{t('name_en')}</label>
              <Input 
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="rounded-xl border-border h-12 bg-background font-bold text-left"
                placeholder="Example: Education"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleSaveManageItem}
              className="w-full bg-primary text-white rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Site Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <DialogTitle className="text-center font-black">إعادة تعيين الموقع</DialogTitle>
            <DialogDescription className="text-center text-balance">
              سيتم تفريغ البيانات المختارة وإرجاع قاعدة البيانات للحالة الافتراضية. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => setResetServices(!resetServices)}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm">المشاريع والرسائل</span>
                </div>
                <div className={`h-5 w-5 rounded border ${resetServices ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                  {resetServices && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => setResetUsers(!resetUsers)}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm block">المستخدمين</span>
                    <span className="text-[10px] text-muted-foreground block text-balance">سيتم استثناء حسابك الحالي للحفاظ على صلاحية الدخول</span>
                  </div>
                </div>
                <div className={`h-5 w-5 rounded border ${resetUsers ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                  {resetUsers && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleResetSite}
              disabled={isResetting || (!resetUsers && !resetServices)}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-12"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري المسح...
                </>
              ) : 'تأكيد الحذف النهائي'}
            </Button>
            <DialogClose render={<Button variant="ghost" disabled={isResetting} className="w-full font-bold" />}>
              إلغاء
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
