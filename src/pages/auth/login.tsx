import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Mail, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const { lng } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(`/${lng}/`);
    } catch (error: any) {
      toast.error('خطأ في البريد الإلكتروني أو كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(`/${lng}/`);
    } catch (error: any) {
      toast.error('حدث خطأ أثناء تسجيل الدخول بجوجل');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md p-8 border-border shadow-xl rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">ي</div>
          <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm mt-2">مرحباً بك مجدداً في يا معين</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pr-10 rounded-xl"
              />
              <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 rounded-xl"
              />
              <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isLoading}>
            {isLoading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center justify-center py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <span className="relative z-10 px-4 bg-card text-xs text-muted-foreground font-bold uppercase">أو عبر</span>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-border flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
            onClick={handleGoogleLogin}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span>تسجيل الدخول بجوجل</span>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          ليس لديك حساب؟ <Link to={`/${lng}/signup`} className="text-primary font-bold hover:underline">أنشئ حساباً جديداً</Link>
        </p>
      </Card>
    </div>
  );
}
