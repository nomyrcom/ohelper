import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ArrowLeft, Coins, Send, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

const postSchema = z.object({
  title: z.string().min(5, 'العنوان قصير جداً'),
  description: z.string().min(10, 'الوصف قصير جداً'),
  category: z.string(),
  city: z.string(),
  points: z.number().min(10).max(500),
});

export default function PostPage() {
  const { t } = useTranslation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      points: 10,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    if (!user) return;
    
    if (user.points < data.points) {
      toast.error('رصيدك من النقاط غير كافٍ');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'services'), {
        ...data,
        requesterId: user._id,
        requesterName: user.name || 'مستخدم',
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast.success('تم نشر الطلب بنجاح!');
      navigate(`/${lng}/`);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء نشر الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cities = [
    'sanaa', 'aden', 'taiz', 'hodeidah', 'ibb', 'mukalla', 'dhamar', 'other'
  ];

  const categories = [
    'education', 'maintenance', 'tech', 'transport', 'other'
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-2xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          className="rounded-full h-10 w-10 border-border bg-card shadow-sm hover:bg-muted"
        >
           {lng === 'ar' ? <ChevronRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{t('common:post_service')}</h1>
      </div>

      {/* Balance Box */}
      <Card className="p-6 bg-accent border-primary/20 flex items-center justify-between rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Coins className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs text-primary/80 font-bold uppercase tracking-wider mb-1">رصيدك المتاح</p>
            <p className="text-2xl font-black text-primary">{user?.points || 0} <span className="text-xs font-bold uppercase">{t('common:points')}</span></p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
      </Card>

      {/* Post Form */}
      <Card className="p-6 md:p-8 rounded-2xl border-border bg-card shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold text-foreground px-1">عنوان الطلب</Label>
            <Input 
              id="title" 
              placeholder="مثال: دروس لغة عربية" 
              {...form.register('title')} 
              className="rounded-xl border-border h-12 bg-background focus:ring-primary/20"
            />
            {form.formState.errors.title && <p className="text-red-500 text-[10px] font-bold px-1">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-foreground px-1">وصف الخدمة</Label>
            <Textarea 
              id="description" 
              placeholder="اشرح الخدمة التي تحتاجها بالتفصيل وكيف يمكن للمزود مساعدتك..." 
              {...form.register('description')}
              className="rounded-xl border-border min-h-[140px] bg-background focus:ring-primary/20 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground px-1">التصنيف</Label>
              <Select onValueChange={(v: string) => form.setValue('category', v)}>
                <SelectTrigger className="rounded-xl border-border h-12 bg-background">
                  <SelectValue placeholder="اختر التصنيف..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{t(`common:${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground px-1">المدينة</Label>
              <Select onValueChange={(v: string) => form.setValue('city', v)}>
                <SelectTrigger className="rounded-xl border-border h-12 bg-background">
                  <SelectValue placeholder="اختر المدينة..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {cities.map(c => (
                    <SelectItem key={c} value={c}>{t(`common:${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-xl border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="points" className="text-sm font-bold text-foreground">عدد النقاط المعروضة</Label>
              <span className="text-xs font-black text-primary uppercase tracking-tighter">Min 10 - Max 500</span>
            </div>
            <div className="relative">
              <Input 
                id="points" 
                type="number" 
                {...form.register('points', { valueAsNumber: true })} 
                className="rounded-xl border-border h-12 bg-background pl-12 font-bold text-lg"
              />
              <Coins className="absolute left-4 top-3.5 h-5 w-5 text-primary opacity-50" />
            </div>
            <div className="flex items-start gap-2 mt-2 opacity-70">
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-tight">سيتم خصم هذه النقاط من رصيدك بمجرد قبول الطلب وتأكيد اكتمال الخدمة.</p>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 bg-primary text-white rounded-xl text-lg font-black shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform flex items-center gap-2">
            <Send className="h-5 w-5" />
            نشر الطلب الآن
          </Button>
        </form>
      </Card>
    </div>
  );
}
