import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Coins, Calendar, User as UserIcon, Star, 
  MessageSquare, ChevronRight, ArrowLeft, ShieldCheck,
  AlertCircle, Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Service, User } from '@/types';
import { toast } from 'sonner';

export default function ServiceDetailsPage() {
  const { t } = useTranslation();
  const { lng, serviceId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [requester, setRequester] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!serviceId) return;
      try {
        const serviceDoc = await getDoc(doc(db, 'services', serviceId));
        if (!serviceDoc.exists()) {
          toast.error('الخدمة غير موجودة');
          navigate(`/${lng}/services`);
          return;
        }
        
        const serviceData = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
        setService(serviceData);

        // Fetch requester profile for rating
        const requesterDoc = await getDoc(doc(db, 'users', serviceData.requesterId));
        if (requesterDoc.exists()) {
          setRequester(requesterDoc.data() as User);
        }
      } catch (error) {
        console.error(error);
        toast.error('خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [serviceId]);

  const handleAcceptService = async () => {
    if (!currentUser || !service) return;
    
    if (service.requesterId === currentUser._id) {
      toast.info('هذا طلبك الخاص');
      navigate(`/${lng}/chat/${service.id}`);
      return;
    }

    try {
      setIsAccepting(true);
      await updateDoc(doc(db, 'services', service.id), {
        status: 'active',
        providerId: currentUser._id,
        providerName: currentUser.name || 'مزود خدمة',
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'services', service.id, 'messages'), {
        senderId: 'system',
        senderName: 'نظام',
        text: `قبل ${currentUser.name} مساعدتك. يمكنكما التحدث الآن.`,
        createdAt: serverTimestamp(),
        type: 'system'
      });

      // Create Notification for the requester
      await addDoc(collection(db, 'users', service.requesterId, 'notifications'), {
        userId: service.requesterId,
        title: 'تم قبول طلبك',
        message: `قام ${currentUser.name} بقبول طلبك: ${service.title}`,
        type: 'status_change',
        link: `/${lng}/chat/${service.id}`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success('تم قبول الطلب بنجاح!');
      navigate(`/${lng}/chat/${service.id}`);
    } catch (error) {
      console.error(error);
      toast.error('خطأ في قبول الطلب');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCancelService = async () => {
    if (!currentUser || !service || service.status !== 'open') return;

    try {
      setIsAccepting(true); // Re-using loading state
      await runTransaction(db, async (transaction) => {
        const serviceRef = doc(db, 'services', service.id);
        const userRef = doc(db, 'users', currentUser._id);
        
        // 1. Delete service
        transaction.delete(serviceRef);

        // 2. Refund points
        transaction.update(userRef, {
          points: increment(service.points)
        });
      });

      toast.success('تم إلغاء الطلب واسترجاع النقاط بنجاح');
      navigate(`/${lng}/`);
    } catch (error) {
      console.error(error);
      toast.error('خطأ في إلغاء الطلب');
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold">جاري تحميل التفاصيل...</div>;
  }

  if (!service) return null;

  const isParty = currentUser && (service.requesterId === currentUser._id || service.providerId === currentUser._id);
  const isRequester = currentUser && service.requesterId === currentUser._id;
  const canAccept = currentUser && !isParty && service.status === 'open';

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          {lng === 'ar' ? <ChevronRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Info */}
      <Card className="p-6 md:p-8 rounded-3xl border-border bg-card shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-lg px-3 py-1 font-bold uppercase tracking-wider text-xs">
              {service.category}
            </Badge>
            <div className="text-right">
              <span className="text-3xl font-black text-primary">+{service.points}</span>
              <p className="text-[10px] text-muted-foreground font-black uppercase">{t('common:points')}</p>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{service.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary/60" />
              <span>{service.city}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary/60" />
              <span>{service.createdAt?.toDate?.()?.toLocaleDateString() || 'اليوم'}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        <div className="space-y-4">
          <h3 className="font-black text-lg text-foreground">تفاصيل الخدمة</h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {service.description}
          </p>
        </div>

        {/* Requester Info */}
        <div className="pt-6 border-t border-border mt-8">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">طالب الخدمة</h3>
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground font-black text-lg">
                {service.requesterName?.[0] || 'ي'}
              </div>
              <div>
                <p className="font-bold text-foreground">{service.requesterName}</p>
                <div className="flex items-center gap-1 text-orange-400">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-bold">
                    {requester?.ratingCount ? (requester.ratingSum / requester.ratingCount).toFixed(1) : 'جديد'}
                  </span>
                  {requester?.ratingCount ? <span className="text-[10px] text-muted-foreground">({requester.ratingCount} تقييم)</span> : null}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/${lng}/profile/${service.requesterId}`)}
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold"
            >
              عرض الملف
            </Button>
          </div>
        </div>
      </Card>

      {/* Trust Badge */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 text-emerald-800">
        <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold">ضمان النقاط</p>
          <p className="text-xs opacity-80">يتم تجميد النقاط حتى تأكيد الإنجاز لضمان حق الطرفين.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t border-border md:relative md:bg-transparent md:border-0 md:p-0">
        <div className="max-w-3xl mx-auto">
          {canAccept ? (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate(`/${lng}/chat/${serviceId}`)}
                className="h-14 border-primary text-primary rounded-2xl text-lg font-black hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                دردشة
              </Button>
              <Button 
                onClick={handleAcceptService}
                disabled={isAccepting}
                className="h-14 bg-primary text-white rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                {isAccepting ? 'جاري القبول...' : 'قبول الطلب'}
              </Button>
            </div>
          ) : isRequester && service.status === 'open' ? (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate(`/${lng}/chat/${serviceId}`)}
                className="h-14 border-blue-600 text-blue-600 rounded-2xl font-black flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                فتح المحادثة
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCancelService}
                disabled={isAccepting}
                className="h-14 rounded-2xl font-black"
              >
                {isAccepting ? 'جاري الإلغاء...' : 'إلغاء الطلب'}
              </Button>
            </div>
          ) : isParty ? (
            <Button 
              onClick={() => navigate(`/${lng}/chat/${serviceId}`)}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-6 w-6" />
              فتح المحادثة
            </Button>
          ) : !currentUser ? (
            <Button 
              onClick={() => navigate(`/${lng}/login`)}
              className="w-full h-14 bg-muted text-muted-foreground rounded-2xl text-lg font-black"
            >
              سجل دخول لتقديم المساعدة
            </Button>
          ) : (
            <div className="bg-muted p-4 rounded-2xl text-center flex items-center justify-center gap-2 text-muted-foreground font-bold">
              <AlertCircle className="h-5 w-5" />
              هذه الخدمة غير متاحة حالياً
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
