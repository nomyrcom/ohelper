import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  doc, onSnapshot, collection, addDoc, updateDoc, 
  serverTimestamp, query, orderBy, getDoc, getDocs, where, increment, writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { 
  Send, ChevronRight, ArrowLeft, MoreVertical, 
  CheckCircle2, Clock, ShieldCheck, Star, 
  AlertCircle, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Message, User } from '@/types';
import { toast } from 'sonner';

export default function ChatRoomPage() {
  const { t } = useTranslation();
  const { lng, serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rating State
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    if (!serviceId || !user) return;

    // Listen to service updates
    const unsubscribeService = onSnapshot(doc(db, 'services', serviceId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Service;
        setService(data);
        
        // Check if already rated when completed
        if (data.status === 'completed') {
          getDoc(doc(db, 'services', serviceId, 'ratings', user._id))
            .then(snap => {
              if (snap.exists()) setHasRated(true);
            });
        }
      } else {
        toast.error('الخدمة غير موجودة');
        navigate(`/${lng}/chat`);
      }
    }, (error) => {
      console.error("ChatRoomPage service listener error:", error);
      setLoading(false);
    });

    // Listen to messages
    const q = query(
      collection(db, 'services', serviceId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setLoading(false);
    }, (error) => {
      console.error("ChatRoomPage messages listener error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeService();
      unsubscribeMessages();
    };
  }, [serviceId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !serviceId || !user) return;

    try {
      const text = inputText;
      setInputText('');
      await addDoc(collection(db, 'services', serviceId, 'messages'), {
        senderId: user._id,
        senderName: user.name || 'مستخدم',
        text,
        createdAt: serverTimestamp(),
        type: 'text'
      });
      
      // Update service updatedAt
      await updateDoc(doc(db, 'services', serviceId), {
        updatedAt: serverTimestamp()
      });

      // Notify the other party
      const otherPartyId = isRequester ? service?.providerId : service?.requesterId;
      if (otherPartyId && service) {
        await addDoc(collection(db, 'users', otherPartyId, 'notifications'), {
          userId: otherPartyId,
          title: `رسالة جديدة من ${user.name}`,
          message: text.length > 50 ? text.substring(0, 50) + '...' : text,
          type: 'message',
          link: `/${lng}/chat/${serviceId}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('فشل إرسال الرسالة');
    }
  };

  const handleConfirmCompletion = async () => {
    if (!service || !user || !serviceId) return;
    
    const isRequester = service.requesterId === user._id;
    const update: any = {
      updatedAt: serverTimestamp(),
      status: 'confirming'
    };

    if (isRequester) {
      update.requesterConfirmed = true;
    } else {
      update.providerConfirmed = true;
    }

    try {
      const batch = writeBatch(db);
      
      // If both confirmed, mark as completed
      if ((isRequester && service.providerConfirmed) || (!isRequester && service.requesterConfirmed)) {
        update.status = 'completed';
        
        // Point transfer
        if (service.providerId) {
          batch.update(doc(db, 'users', service.requesterId), { 
            points: increment(-service.points) 
          });
          batch.update(doc(db, 'users', service.providerId), { 
            points: increment(service.points) 
          });
        }
        
        // System message for completion
        const msgRef = doc(collection(db, 'services', serviceId, 'messages'));
        batch.set(msgRef, {
          senderId: 'system',
          senderName: 'نظام',
          text: `اكتملت الخدمة بنجاح! تم تحويل ${service.points} نقطة إلى ${isRequester ? (service.providerName || 'المزود') : 'رصيدك'}.`,
          createdAt: serverTimestamp(),
          type: 'system'
        });
      } else {
        // System message for one-sided confirmation
        const msgRef = doc(collection(db, 'services', serviceId, 'messages'));
        batch.set(msgRef, {
          senderId: 'system',
          senderName: 'نظام',
          text: `قام ${user.name} بتأكيد اكتمال الخدمة.`,
          createdAt: serverTimestamp(),
          type: 'system'
        });
      }

      batch.update(doc(db, 'services', serviceId), update);
      
      // Notify the other party about confirmation or completion
      const otherPartyId = isRequester ? service.providerId : service.requesterId;
      if (otherPartyId) {
        await addDoc(collection(db, 'users', otherPartyId, 'notifications'), {
          userId: otherPartyId,
          title: update.status === 'completed' ? 'اكتملت الخدمة' : 'تأكيد من طرف واحد',
          message: update.status === 'completed' 
            ? `تم إكمال الخدمة بنجاح: ${service.title}` 
            : `قام ${user.name} بتأكيد انتهاء الخدمة. يرجى التأكيد من طرفك للإغلاق.`,
          type: 'status_change',
          link: `/${lng}/chat/${serviceId}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      
      toast.success('تم تأكيد اكتمال الخدمة من طرفك');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء التأكيد');
    }
  };

  const handleSubmitRating = async () => {
    if (!service || !user || !serviceId) return;
    
    setIsSubmittingRating(true);
    try {
      const recipientId = isRequester ? service.providerId : service.requesterId;
      if (!recipientId) throw new Error("Recipient not found");

      const batch = writeBatch(db);
      
      // 1. Create rating doc with deterministic ID (rater's ID)
      const ratingRef = doc(db, 'services', serviceId, 'ratings', user._id);
      batch.set(ratingRef, {
        serviceId,
        fromId: user._id,
        toId: recipientId,
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      // 2. Update recipient user summary
      const recipientRef = doc(db, 'users', recipientId);
      batch.update(recipientRef, {
        ratingSum: increment(rating),
        ratingCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Notify recipient about new rating
      await addDoc(collection(db, 'users', recipientId, 'notifications'), {
        userId: recipientId,
        title: 'تقييم جديد',
        message: `حصلت على تقييم ${rating} نجوم من ${user.name}`,
        type: 'system',
        link: `/${lng}/profile`,
        read: false,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      
      toast.success('تم إرسال تقييمك بنجاح');
      setHasRated(true);
      setShowRating(false);
    } catch (error) {
      console.error(error);
      toast.error('فشل إرسال التقييم');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const steps = [
    { id: 'open', label: 'مفتوح', icon: Clock },
    { id: 'active', label: 'بدأ التنفيذ', icon: ShieldCheck },
    { id: 'confirming', label: 'تأكيد الختام', icon: CheckCircle2 },
    { id: 'completed', label: 'مكتمل', icon: Star },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === service?.status);

  if (loading || !service) {
    return <div className="p-8 text-center font-bold">جاري تحميل المحادثة...</div>;
  }

  const isRequester = service.requesterId === user?._id;
  const userConfirmed = isRequester ? service.requesterConfirmed : service.providerConfirmed;
  const otherConfirmed = isRequester ? service.providerConfirmed : service.requesterConfirmed;
  const otherPartyName = isRequester ? (service.providerName || 'مقدم الخدمة') : service.requesterName;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background relative">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/${lng}/chat`)}
            className="rounded-full"
          >
            {lng === 'ar' ? <ChevronRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
          </Button>
          <div>
            <h2 className="text-sm font-black text-foreground truncate max-w-[200px]">{service.title}</h2>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              تواصل مع {otherPartyName}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Status Tracker */}
      <div className="bg-muted/30 p-4 border-b border-border overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[400px] px-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-4 ring-primary/10 scale-110' : ''}`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className={`absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-0.5 -z-10 ${
                    idx < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scroll-smooth relative"
      >
        {/* Waiting Banner */}
        <AnimatePresence>
          {service.status === 'confirming' && userConfirmed && !otherConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sticky top-0 z-20 mb-4"
            >
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center gap-3 text-orange-700 shadow-sm shadow-orange-200/50">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 animate-spin-slow" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black leading-tight">بانتظار تأكيد {otherPartyName}</p>
                  <p className="text-[10px] opacity-80">سيتم إغلاق الطلب وتحويل النقاط بمجرد تأكيده.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center p-2">
                  <span className="bg-muted px-4 py-1 rounded-full text-[10px] font-medium text-muted-foreground border border-border">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMine = msg.senderId === user?._id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMine 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-card text-foreground border border-border rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                  <span className={`text-[8px] mt-1 block opacity-60 text-left`}>
                    {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Interaction Bar (Confirmations, Banners, etc.) */}
      <div className="px-4 py-2 space-y-2">
        {service.status === 'completed' ? (
          !hasRated ? (
            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2 h-12 shadow-lg shadow-emerald-500/10"
              onClick={() => setShowRating(true)}
            >
              <Star className="h-5 w-5" />
              تقييم الخدمة
            </Button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-center gap-2 text-emerald-700">
               <ShieldCheck className="h-5 w-5" />
               <span className="text-xs font-bold">شكراً لتقييمك! تم إغلاق الطلب.</span>
            </div>
          )
        ) : service.status !== 'open' && (
          <>
            {!userConfirmed ? (
              <Button 
                onClick={handleConfirmCompletion}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 h-12 shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="h-5 w-5" />
                تأكيد انتهاء الخدمة
              </Button>
            ) : null}
            
            {otherConfirmed && !userConfirmed && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3 text-emerald-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold leading-tight">أكد {otherPartyName} انتهاء الخدمة. يرجى التأكيد من طرفك للإغلاق.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="rounded-full border-border bg-muted/30 focus:ring-primary/20 pr-4"
            disabled={service.status === 'completed'}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputText.trim() || service.status === 'completed'}
            className="rounded-full h-10 w-10 shrink-0 bg-primary text-white shadow-lg shadow-primary/20"
          >
            {lng === 'ar' ? <ArrowLeft className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="rounded-2xl max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="text-center font-black">تقييم تجربتك</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <p className="text-center text-sm text-muted-foreground">كيف كانت تجربتك مع {otherPartyName}؟</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform active:scale-90"
                >
                  <Star className={`h-8 w-8 ${s <= rating ? 'fill-orange-400 text-orange-400' : 'text-muted'}`} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold px-1">رأيك (اختياري)</span>
              <Textarea 
                placeholder="اكتب تعليقك هنا..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-xl border-border bg-muted/30 focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleSubmitRating} 
              disabled={isSubmittingRating}
              className="w-full bg-primary text-white rounded-xl font-bold h-12"
            >
              {isSubmittingRating ? 'جاري الإرسال...' : 'تأكيد التقييم'}
            </Button>
            <DialogClose render={<Button variant="ghost" className="w-full font-bold" />}>
              إلغاء
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
