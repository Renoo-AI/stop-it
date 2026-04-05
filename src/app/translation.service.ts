import { Injectable, signal, effect } from '@angular/core';

export type Language = 'en' | 'fr' | 'ar';

export type Translations = Record<string, Record<Language, string>>;

const TRANSLATIONS: Translations = {
  'app_title': { en: 'Mind Warrior', fr: 'Guerrier de l\'Esprit', ar: 'محارب العقل' },
  'app_subtitle': { en: 'Master your discipline. Conquer your focus. Build the life you deserve.', fr: 'Maîtrisez votre discipline. Conquérez votre concentration. Construisez la vie que vous méritez.', ar: 'أتقن انضباطك. قهر تركيزك. ابنِ الحياة التي تستحقها.' },
  'begin_journey': { en: 'Begin Journey', fr: 'Commencer le Voyage', ar: 'ابدأ الرحلة' },
  'google_login': { en: 'Login with Google', fr: 'Se connecter avec Google', ar: 'تسجيل الدخول باستخدام جوجل' },
  'guest_login': { en: 'Login as Guest', fr: 'Se connecter en tant qu\'invité', ar: 'الدخول كضيف' },
  'qr_login': { en: 'Login with QR', fr: 'Se connecter avec QR', ar: 'تسجيل الدخول باستخدام QR' },
  'loading_dojo': { en: 'Entering the Dojo...', fr: 'Entrée dans le Dojo...', ar: 'دخول الدوجو...' },
  'onboarding_title': { en: 'Welcome, Warrior', fr: 'Bienvenue, Guerrier', ar: 'مرحباً بك أيها المحارب' },
  'onboarding_subtitle': { en: 'What shall we call you in the records?', fr: 'Comment devons-nous vous appeler dans les registres ?', ar: 'بماذا نناديك في السجلات؟' },
  'username_placeholder': { en: 'Enter your warrior name', fr: 'Entrez votre nom de guerrier', ar: 'أدخل اسم المحارب الخاص بك' },
  'continue': { en: 'Continue', fr: 'Continuer', ar: 'استمرار' },
  'week': { en: 'Week', fr: 'Semaine', ar: 'أسبوع' },
  'mission': { en: 'Mission', fr: 'Mission', ar: 'مهمة' },
  'train': { en: 'Train', fr: 'S\'entraîner', ar: 'تدريب' },
  'rank': { en: 'Rank', fr: 'Rang', ar: 'الرتبة' },
  'profile': { en: 'Profile', fr: 'Profil', ar: 'الملف الشخصي' },
  'streak': { en: 'Streak', fr: 'Série', ar: 'سلسلة' },
  'xp': { en: 'XP', fr: 'XP', ar: 'خبرة' },
  'enter_dojo': { en: 'Enter The Dojo', fr: 'Entrer dans le Dojo', ar: 'ادخل الدوجو' },
  'hold_the_line': { en: 'Hold The Line', fr: 'Tenez la Ligne', ar: 'اثبت في مكانك' },
  'dojo_instructions': { en: 'Do not touch your phone. Control your mind.', fr: 'Ne touchez pas votre téléphone. Contrôlez votre esprit.', ar: 'لا تلمس هاتفك. تحكم في عقلك.' },
  'breathe_in': { en: 'Breathe In', fr: 'Inspirez', ar: 'شهيق' },
  'breathe_out': { en: 'Breathe Out', fr: 'Expirez', ar: 'زفير' },
  'retreat': { en: 'Retreat', fr: 'Retraite', ar: 'تراجع' },
  'settings': { en: 'Settings', fr: 'Paramètres', ar: 'الإعدادات' },
  'theme': { en: 'Theme', fr: 'Thème', ar: 'المظهر' },
  'language': { en: 'Language', fr: 'Langue', ar: 'اللغة' },
  'logout': { en: 'Logout', fr: 'Déconnexion', ar: 'تسجيل الخروج' },
  'pairing_qr': { en: 'Pairing QR', fr: 'QR de Jumelage', ar: 'QR للاقتران' },
  'scan_qr': { en: 'Scan QR', fr: 'Scanner le QR', ar: 'مسح QR' },
  'pairing_instructions': { en: 'Scan this QR code with another device to sync your session.', fr: 'Scannez ce code QR avec un autre appareil pour synchroniser votre session.', ar: 'امسح رمز QR هذا بجهاز آخر لمزامنة جلستك.' },
  'scan_instructions': { en: 'Scan a pairing QR code from another device.', fr: 'Scannez un code QR de jumelage d\'un autre appareil.', ar: 'امسح رمز QR للاقتران من جهاز آخر.' },
  'warrior': { en: 'Warrior', fr: 'Guerrier', ar: 'محارب' },
  'control_mission': { en: 'Control Mission', fr: 'Mission de Contrôle', ar: 'مهمة التحكم' },
  'complete': { en: 'Complete', fr: 'Terminé', ar: 'مكتمل' },
  'day': { en: 'Day', fr: 'Jour', ar: 'يوم' },
  'ready': { en: 'Ready', fr: 'Prêt', ar: 'جاهز' },
  'resting': { en: 'Resting', fr: 'Repos', ar: 'استراحة' },
  'daily_missions': { en: 'Daily Missions', fr: 'Missions Quotidiennes', ar: 'المهام اليومية' },
  'new_mission_placeholder': { en: 'New mission...', fr: 'Nouvelle mission...', ar: 'مهمة جديدة...' },
  'no_missions': { en: 'No missions yet. Add one above.', fr: 'Pas encore de missions. Ajoutez-en une ci-dessus.', ar: 'لا توجد مهام بعد. أضف واحدة أعلاه.' },
  'records_tools': { en: 'Records & Tools', fr: 'Records et Outils', ar: 'السجلات والأدوات' },
  'discipline_journey': { en: 'Your discipline journey', fr: 'Votre parcours de discipline', ar: 'رحلة انضباطك' },
  'days_done': { en: 'Days Done', fr: 'Jours Terminés', ar: 'الأيام المنجزة' },
  'best_streak': { en: 'Best Streak', fr: 'Meilleure Série', ar: 'أفضل سلسلة' },
  'sync_devices': { en: 'Sync Devices', fr: 'Synchroniser les Appareils', ar: 'مزامنة الأجهزة' },
  'show_pairing_qr': { en: 'Show Pairing QR', fr: 'Afficher le QR de Jumelage', ar: 'إظهار QR للاقتران' },
  'next_evolution': { en: 'Next Evolution', fr: 'Prochaine Évolution', ar: 'التطور القادم' },
  'erase_data': { en: 'Erase All Data', fr: 'Effacer toutes les données', ar: 'مسح جميع البيانات' },
  'close_profile': { en: 'Close Profile', fr: 'Fermer le profil', ar: 'إغلاق الملف الشخصي' },
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  currentLang = signal<Language>('en');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang) this.currentLang.set(savedLang);
    }

    effect(() => {
      const lang = this.currentLang();
      if (typeof window !== 'undefined') {
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }
    });
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
  }

  translate(key: string): string {
    const translation = TRANSLATIONS[key];
    if (!translation) return key;
    return translation[this.currentLang()] || key;
  }

  get isRtl() {
    return this.currentLang() === 'ar';
  }
}
