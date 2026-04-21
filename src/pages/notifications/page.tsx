import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/use-notifications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, CheckCircle2, Coins, ChevronLeft, Trash2, Clock } from 'lucide-react';
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, loading } = useNotifications();

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user._id, 'notifications', notificationId), {
        read: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          batch.update(doc(db, 'users', user._id, 'notifications', n.id), {
            read: true,
            updatedAt: new Date()
          });
        }
      });
      await batch.commit();
      toast.success('تم تحديد الكل كمقروء');
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user._id, 'notifications', notificationId));
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'status_change': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'point_transfer': return <Coins className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center font-bold">جاري تحميل التنبيهات...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          الإشعارات
        </h1>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs font-bold hover:bg-primary/5">
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative group ${!n.read ? 'ring-1 ring-primary/20' : ''}`}
              >
                <Card 
                  className={`p-4 transition-all hover:shadow-md cursor-pointer rounded-2xl flex gap-4 ${
                    !n.read ? 'bg-primary/5' : 'bg-card'
                  }`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                    !n.read ? 'bg-white shadow-sm' : 'bg-muted'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold truncate ${!n.read ? 'text-primary' : 'text-foreground'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {n.createdAt?.toDate?.()?.toLocaleDateString() || 'الآن'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-neutral-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-foreground mb-1">لا توجد إشعارات حالياً</h3>
              <p className="text-xs text-muted-foreground">سنخبرك هنا عند وجود أي تحديثات جديدة.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
