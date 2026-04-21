import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle2, ChevronRight, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Service } from '@/types';

export default function ChatListPage() {
  const { t } = useTranslation();
  const { lng } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    const q1 = query(
      collection(db, 'services'),
      where('requesterId', '==', user._id),
      orderBy('updatedAt', 'desc')
    );

    const q2 = query(
      collection(db, 'services'),
      where('providerId', '==', user._id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const s1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(prev => {
        const others = prev.filter(p => !s1.find(s => s.id === p.id) && p.providerId === user._id);
        return [...s1, ...others].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      });
      setLoading(false);
    }, (error) => {
      console.error("ChatListPage (requester) listener error:", error);
      setLoading(false);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const s2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(prev => {
        const others = prev.filter(p => !s2.find(s => s.id === p.id) && p.requesterId === user._id);
        return [...s2, ...others].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      });
      setLoading(false);
    }, (error) => {
      console.error("ChatListPage (provider) listener error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open': return { label: 'قيد العرض', color: 'bg-emerald-50 text-emerald-600' };
      case 'active': return { label: 'قيد التنفيذ', color: 'bg-blue-50 text-blue-600' };
      case 'confirming': return { label: 'بانتظار التأكيد', color: 'bg-orange-50 text-orange-600' };
      case 'completed': return { label: 'تم الانتهاء', color: 'bg-slate-50 text-slate-600' };
      default: return { label: 'غير معروف', color: 'bg-gray-50 text-gray-600' };
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold">جاري تحميل المحادثات...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">المحادثات والطلبات</h1>
          <p className="text-sm text-muted-foreground mt-1">تواصل مع مقدمي الخدمات وتابع حالة طلباتك</p>
        </div>
      </div>

      {services.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 flex flex-col items-center gap-4 bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-foreground">لا توجد محادثات نشطة</p>
            <p className="text-sm text-muted-foreground">ابدأ بنشر خدمة أو تصفح الخدمات المتاحة للبدء</p>
          </div>
          <button 
            onClick={() => navigate(`/${lng}/services`)}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20"
          >
            تصفح الخدمات
          </button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service, idx) => {
            const statusInfo = getStatusInfo(service.status);
            const isRequester = service.requesterId === user?._id;
            const otherPartyName = isRequester ? (service.providerName || 'قيد البحث...') : service.requesterName;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  onClick={() => navigate(`/${lng}/chat/${service.id}`)}
                  className="p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border-border bg-card group"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground font-black text-xl">
                      {otherPartyName?.[0] || '?'}
                    </div>
                    {service.status === 'active' && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full animation-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{service.title}</h3>
                      <Badge variant="secondary" className={`${statusInfo.color} border-0 text-[10px] py-0 px-2`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserIcon className="h-3 w-3" />
                      <span className="truncate">{otherPartyName}</span>
                      <span>•</span>
                      <span>{service.points} نقطة</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
