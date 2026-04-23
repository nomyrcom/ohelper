import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';

export default function LandingPage() {
  const { lng } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll logic
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleStartNow = () => {
    navigate(`/${lng}/login`);
  };

  return (
    <div className="font-sans text-[#1f2937] bg-white leading-relaxed rtl:font-tajawal" dir={lng === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4 font-black text-2xl cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <Logo size="lg" />
             <span>{t('common:app_name')}</span>
          </div>

          <ul className={`hidden md:flex gap-8 items-center list-none`}>
            <li><button onClick={() => scrollTo('features')} className="hover:text-primary transition-colors font-bold text-sm bg-transparent border-none cursor-pointer">الميزات</button></li>
            <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-primary transition-colors font-bold text-sm bg-transparent border-none cursor-pointer">كيف يعمل</button></li>
            <li><button onClick={() => scrollTo('categories')} className="hover:text-primary transition-colors font-bold text-sm bg-transparent border-none cursor-pointer">الفئات</button></li>
            <li><button onClick={handleStartNow} className="px-6 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-all shadow-md">ابدأ الآن</button></li>
          </ul>

          <button className="md:hidden text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 flex flex-col items-center shadow-lg">
             <button onClick={() => scrollTo('features')} className="font-bold text-sm p-2 w-full text-center">الميزات</button>
             <button onClick={() => scrollTo('how-it-works')} className="font-bold text-sm p-2 w-full text-center">كيف يعمل</button>
             <button onClick={() => scrollTo('categories')} className="font-bold text-sm p-2 w-full text-center">الفئات</button>
             <button onClick={handleStartNow} className="w-full py-3 bg-primary text-white rounded-xl font-bold">ابدأ الآن</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight">
                يا معين
              </h1>
              <p className="text-xl md:text-2xl font-bold text-primary">منصة تبادل الخدمات في اليمن</p>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                تبادل الخدمات بسهولة باستخدام نظام النقاط. ابدأ برصيد 100 نقطة وتواصل مع مجتمع موثوق من المتطوعين اليمنيين.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                 <button onClick={handleStartNow} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                    ابدأ الآن
                 </button>
                 <button onClick={() => scrollTo('how-it-works')} className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-2xl font-black text-lg hover:bg-primary/5 transition-colors">
                    تعرف على المزيد
                 </button>
              </div>
           </div>
           <div className="relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584141785/fETXWErphbcmoupHrdAsc2/hero-community-kPGrVFC4c8jUUsneDpXxsK.webp" 
                alt="Community" 
                className="relative z-10 w-full rounded-3xl shadow-2xl shadow-black/10"
              />
           </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
           <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">لماذا تختار يا معين؟</h2>
              <p className="text-gray-500 font-medium tracking-tight">منصة آمنة وموثوقة لتبادل الخدمات بين أهل اليمن</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "💰", title: "نظام النقاط", desc: "ابدأ برصيد 100 نقطة واكسب المزيد من خلال تقديم الخدمات" },
                { icon: "🔍", title: "تصفح الخدمات", desc: "ابحث عن الخدمات التي تحتاجها من بين مئات الخيارات" },
                { icon: "💬", title: "دردشة فورية", desc: "تواصل مباشر مع مقدمي الخدمات في الوقت الفعلي" },
                { icon: "⭐", title: "التقييمات والثقة", desc: "بناء سمعة قوية من خلال التقييمات المتبادلة" },
                { icon: "📂", title: "فئات متعددة", desc: "تعليم، تكنولوجيا، تصميم، صحة، منزل، نقل وغيرها" },
                { icon: "👥", title: "نمو المجتمع", desc: "كن جزءاً من مجتمع ينمو ويدعم بعضه البعض" }
              ].map((f, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-3xl hover:shadow-xl hover:shadow-slate-200 transition-all group flex flex-col items-center text-center">
                   <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{f.icon}</div>
                   <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                   <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
           <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">كيف يعمل التطبيق؟</h2>
              <p className="text-gray-500 font-medium">عملية بسيطة وآمنة في 5 خطوات</p>
           </div>

           <div className="mb-20">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584141785/fETXWErphbcmoupHrdAsc2/points-system-m2weG6sBaEPTopYQy5wheg.webp" alt="How it works" className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { n: 1, title: "إنشاء حساب", desc: "سجل باستخدام بريدك الإلكتروني واحصل على 100 نقطة ترحيب" },
                { n: 2, title: "اطلب أو قدم", desc: "انشر طلب خدمة أو تصفح الطلبات المتاحة" },
                { n: 3, title: "قبول الطلب", desc: "وافق على الخدمة وابدأ التواصل المباشر" },
                { n: 4, title: "إكمال الخدمة", desc: "أكمل الخدمة وأكد الانتهاء من كلا الطرفين" },
                { n: 5, title: "تقييم وتحويل", desc: "قيّم بعضكما وتحويل النقاط تلقائياً" }
              ].map((s, i) => (
                <div key={i} className="text-center group">
                   <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl mx-auto mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                     {s.n}
                   </div>
                   <h4 className="font-bold text-lg mb-2">{s.title}</h4>
                   <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Points System Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center gap-16">
           <div className="flex-1 space-y-12">
              <div className="space-y-4">
                 <h2 className="text-3xl md:text-4xl font-black text-gray-900">نظام النقاط</h2>
                 <p className="text-gray-500 font-medium">كيف يعمل نظام النقاط في يا معين</p>
              </div>

              <div className="space-y-8">
                 {[
                   { icon: "🎁", title: "نقاط الترحيب", desc: "احصل على 100 نقطة عند إنشاء حسابك الجديد" },
                   { icon: "📈", title: "كسب النقاط", desc: "اكسب نقاط من خلال تقديم خدمات موثوقة وعالية الجودة" },
                   { icon: "💳", title: "استخدام النقاط", desc: "استخدم نقاطك لطلب الخدمات التي تحتاجها" },
                   { icon: "🔄", title: "تحويل النقاط", desc: "تحويل تلقائي للنقاط عند إكمال الخدمة من كلا الطرفين" },
                   { icon: "🛡️", title: "حماية الرصيد", desc: "لا يمكن أن ينخفض رصيدك عن الصفر" }
                 ].map((p, i) => (
                   <div key={i} className="flex gap-6 group">
                      <div className="text-4xl bg-slate-50 w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">{p.icon}</div>
                      <div>
                         <h4 className="text-xl font-bold mb-1">{p.title}</h4>
                         <p className="text-gray-500 leading-relaxed max-w-sm">{p.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="flex-1">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584141785/fETXWErphbcmoupHrdAsc2/features-section-6DojtWK5Tjmo5ZSfZrGMsz.webp" alt="Points System" className="w-full rounded-3xl shadow-2xl shadow-primary/10" />
           </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-16">
           <h2 className="text-3xl md:text-4xl font-black">فئات الخدمات</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 px-4">
              {[
                { i: "📚", t: "تعليم" }, { i: "💻", t: "تكنولوجيا" },
                { i: "🎨", t: "تصميم" }, { i: "⚕️", t: "صحة" },
                { i: "🏠", t: "منزل" }, { i: "🚗", t: "نقل" },
                { i: "🍽️", t: "طعام" }, { i: "📦", t: "أخرى" }
              ].map((c, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-4 group">
                   <div className="text-4xl group-hover:scale-110 transition-transform">{c.i}</div>
                   <span className="font-bold text-gray-700">{c.t}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary to-[#f97316] rounded-[3rem] p-12 md:p-20 text-center text-white space-y-8 shadow-2xl shadow-primary/30 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32" />
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full -mr-32 -mb-32" />
           
           <h2 className="text-3xl md:text-5xl font-black relative z-10">جاهز للبدء؟</h2>
           <p className="text-xl opacity-90 relative z-10 max-w-2xl mx-auto lowercase tracking-tight">انضم إلى مئات اليمنيين الذين يستخدمون {t('common:app_name')} لتبادل الخدمات</p>
           <button onClick={handleStartNow} className="px-12 py-5 bg-white text-primary rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-xl relative z-10">
              ابدأ الآن مجاناً
           </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-white py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-4 font-black text-2xl">
                 <Logo size="lg" className="bg-white p-1" />
                 <span>يا معين</span>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm">
                منصة آمنة وموثوقة لتبادل الخدمات بين أهل اليمن باستخدام نظام النقاط
              </p>
           </div>
           
           <div className="space-y-6">
              <h4 className="text-lg font-bold">الروابط</h4>
              <ul className="space-y-3 text-gray-400 font-medium text-sm">
                 <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer">الميزات</button></li>
                 <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer">كيف يعمل</button></li>
                 <li><button onClick={() => scrollTo('categories')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer">الفئات</button></li>
              </ul>
           </div>

           <div className="space-y-6">
              <h4 className="text-lg font-bold">المزيد</h4>
              <ul className="space-y-3 text-gray-400 font-medium text-sm">
                 <li><a href="#" className="hover:text-white transition-colors">اتصل بنا</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a></li>
              </ul>
           </div>

           <div className="space-y-6 text-center md:text-right">
              <h4 className="text-lg font-bold">تابعنا</h4>
              <div className="flex gap-4 justify-center md:justify-start">
                 {['f', 'X', 'in'].map((s, i) => (
                   <a key={i} href="#" className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-all text-xl font-bold">{s}</a>
                 ))}
              </div>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-20 pt-8 text-center text-gray-500 text-xs font-medium">
           <p>جميع الحقوق محفوظة © 2026 يا معين</p>
        </div>
      </footer>
    </div>
  );
}
