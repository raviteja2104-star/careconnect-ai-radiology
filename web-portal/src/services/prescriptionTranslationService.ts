export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳', script: 'Devanagari' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', flag: '🇮🇳', script: 'Telugu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr', flag: '🇮🇳', script: 'Tamil' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr', flag: '🇮🇳', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr', flag: '🇮🇳', script: 'Malayalam' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr', flag: '🇮🇳', script: 'Devanagari' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr', flag: '🇮🇳', script: 'Gujarati' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', flag: '🇮🇳', script: 'Bengali' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr', flag: '🇮🇳', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ိଆ', dir: 'ltr', flag: '🇮🇳', script: 'Odia' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', dir: 'ltr', flag: '🇮🇳', script: 'Bengali-Assamese' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇮🇳', script: 'Arabic' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇦🇪', script: 'Arabic' }
];

export type DisplayMode = 'english' | 'translated' | 'bilingual';

// Comprehensive Medical Phrase Dictionaries
const FREQUENCY_MAP: Record<string, Record<string, string>> = {
  '1-0-1 (BID)': {
    hi: '1-0-1 (सुबह 1 - शाम 1)',
    te: '1-0-1 (ఉదయం 1 - సాయంత్రం 1)',
    ta: '1-0-1 (காலை 1 - இரவு 1)',
    kn: '1-0-1 (ಬೆಳಿಗ್ಗೆ 1 - ಸಂಜೆ 1)',
    ml: '1-0-1 (രാവിലെ 1 - വൈകുന്നേരം 1)',
    mr: '1-0-1 (सकाळी 1 - संध्याकाळी 1)',
    gu: '1-0-1 (સવારે 1 - સાંજે 1)',
    bn: '1-0-1 (সকালে ১ - সন্ধ্যায় ১)',
    pa: '1-0-1 (ਸਵੇਰੇ 1 - ਸ਼ਾਮ 1)',
    or: '1-0-1 (ସକାଳେ ୧ - ସନ୍ଧ୍ୟାରେ ୧)',
    as: '1-0-1 (পুৱা ১ - গধূলি ১)',
    ur: '1-0-1 (صبح 1 - شام 1)',
    ar: '1-0-1 (صباحاً 1 - مساءً 1)'
  },
  '1-1-1 (TID)': {
    hi: '1-1-1 (सुबह 1 - दोपहर 1 - रात 1)',
    te: '1-1-1 (ఉదయం 1 - మధ్యాహ్నం 1 - రాత్రి 1)',
    ta: '1-1-1 (காலை 1 - மதியம் 1 - இரவு 1)',
    kn: '1-1-1 (ಬೆಳಿಗ್ಗೆ 1 - ಮಧ್ಯಾಹ್ನ 1 - ರಾತ್ರಿ 1)',
    ml: '1-1-1 (രാവിലെ 1 - ഉച്ചയ്ക്ക് 1 - രാത്രി 1)',
    mr: '1-1-1 (सकाळी 1 - दुपारी 1 - रात्री 1)',
    gu: '1-1-1 (સવારે 1 - બપોરે 1 - રાત્રે 1)',
    bn: '1-1-1 (সকালে ১ - দুপুরে ১ - রাতে ১)',
    pa: '1-1-1 (ਸਵੇਰੇ 1 - ਦੁਪਹਿਰ 1 - ਰਾਤ 1)',
    or: '1-1-1 (ସକାଳେ ୧ - ମଧ୍ୟାହ୍ନରେ ୧ - ରାତିରେ ୧)',
    as: '1-1-1 (পুৱা ১ - দুপৰীয়া ১ - ৰাতি ১)',
    ur: '1-1-1 (صبح 1 - دوپہر 1 - رات 1)',
    ar: '1-1-1 (صباحاً 1 - ظهراً 1 - مساءً 1)'
  },
  '1-0-0 (OD)': {
    hi: '1-0-0 (दिन में 1 बार - सुबह)',
    te: '1-0-0 (రోజుకు 1 సారి - ఉదయం)',
    ta: '1-0-0 (நாளைக்கு 1 முறை - காலை)',
    kn: '1-0-0 (ದಿನಕ್ಕೆ 1 ಬಾರಿ - ಬೆಳಿಗ್ಗೆ)',
    ml: '1-0-0 (ദിവസത്തിൽ 1 തവണ - രാവിലെ)',
    mr: '1-0-0 (दिवसातून 1 वेळ - सकाळी)',
    gu: '1-0-0 (દિવસમાં 1 વખત - સવારે)',
    bn: '1-0-0 (দিনে ১ বার - সকালে)',
    pa: '1-0-0 (ਦਿਨ ਵਿੱਚ 1 ਵਾਰ - ਸਵੇਰੇ)',
    or: '1-0-0 (ଦିନକୁ ୧ ଥର - ସକାଳେ)',
    as: '1-0-0 (দিনে ১ বাৰ - পুৱা)',
    ur: '1-0-0 (دن میں 1 بار - صبح)',
    ar: '1-0-0 (مرة واحدة يومياً - صباحاً)'
  },
  '0-0-1 (OD Bedtime)': {
    hi: '0-0-1 (रात को सोने से पहले)',
    te: '0-0-1 (రాత్రి పడుకునే ముందు)',
    ta: '0-0-1 (இரவு தூங்குவதற்கு முன்)',
    kn: '0-0-1 (ರಾತ್ರಿ ಮಲಗುವ ಮೊದಲು)',
    ml: '0-0-1 (രാത്രി ഉറങ്ങുന്നതിന് മുമ്പ്)',
    mr: '0-0-1 (रात्री झोपण्यापूर्वी)',
    gu: '0-0-1 (રાત્રે સુતા પહેલા)',
    bn: '0-0-1 (রাতে ঘুমানোর আগে)',
    pa: '0-0-1 (ਰਾਤ ਨੂੰ ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ)',
    or: '0-0-1 (ରାତି ଶୋଇବା ପୂର୍ବରୁ)',
    as: '0-0-1 (ৰাতি শোৱাৰ আগতে)',
    ur: '0-0-1 (رات کو سونے سے پہلے)'
  },
  'SOS': {
    hi: 'SOS (ज़रूरत पड़ने पर)',
    te: 'SOS (అవసరమైనప్పుడు మాత్రమే)',
    ta: 'SOS (தேவைப்படும் போது மட்டும்)',
    kn: 'SOS (ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ)',
    ml: 'SOS (ആവശ്യമുള്ളപ്പോൾ മാത്രം)',
    mr: 'SOS (गरज भासल्यास)',
    gu: 'SOS (જરૂર પડે ત્યારે)',
    bn: 'SOS (প্রয়োজনে)',
    pa: 'SOS (ਲੋੜ ਪੈਣ \'ਤੇ)',
    or: 'SOS (ଆବଶ୍ୟକ ହେଲେ)',
    as: 'SOS (প্ৰয়োজন হ\'লে)',
    ur: 'SOS (ضرورت پڑنے پر)'
  }
};

const INSTRUCTION_MAP: Record<string, Record<string, string>> = {
  'After Meals': {
    hi: 'खाना खाने के बाद',
    te: 'భోజనం తర్వాత',
    ta: 'உணவுக்குப் பிறகு',
    kn: 'ಊಟದ ನಂತರ',
    ml: 'ഭക്ഷണത്തിന് ശേഷം',
    mr: 'जेवणानंतर',
    gu: 'જમ્યા પછી',
    bn: 'খাবারের পর',
    pa: 'ਖਾਣੇ ਤੋਂ ਬਾਅਦ',
    or: 'ଖାଇବା ପରେ',
    as: 'আহাৰৰ পিছত',
    ur: 'کھانے کے بعد'
  },
  'Before Meals': {
    hi: 'खाना खाने से पहले',
    te: 'భోజనానికి ముందు',
    ta: 'உணவுக்கு முன்',
    kn: 'ಊಟಕ್ಕೆ ಮೊದಲು',
    ml: 'ഭക്ഷണത്തിന് മുമ്പ്',
    mr: 'जेवणापूर्वी',
    gu: 'જમ્યા પહેલા',
    bn: 'খাবারের আগে',
    pa: 'ਖਾਣੇ ਤੋਂ ਪਹਿਲਾਂ',
    or: 'ଖାଇବା ପୂର୍ବରୁ',
    as: 'আহাৰৰ আগতে',
    ur: 'کھانے سے پہلے'
  },
  'After Dinner': {
    hi: 'रात के खाने के बाद',
    te: 'రాత్రి భోజనం తర్వాత',
    ta: 'இரவு உணவுக்குப் பிறகு',
    kn: 'ರಾತ್ರಿ ಊಟದ ನಂತರ',
    ml: 'അത്താഴത്തിന് ശേഷം',
    mr: 'रात्रीच्या जेवणानंतर',
    gu: 'રાત્રિભોજન પછી',
    bn: 'রাতের খাবারের পর',
    pa: 'ਰਾਤ ਦੇ ਖਾਣੇ ਤੋਂ ਬਾਅਦ',
    or: 'ରାତି ଖାଇବା ପରେ',
    as: 'ৰাতিৰ আহাৰৰ পিছত',
    ur: 'رات کے کھانے کے بعد'
  },
  'Empty Stomach': {
    hi: 'खाली पेट (सुबह उठते ही)',
    te: 'పరగడుపున (ఖాళీ కడుపుతో)',
    ta: 'வெறும் வயிற்றில்',
    kn: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ',
    ml: 'വെറും വയറ്റിൽ',
    mr: 'रिकाम्या पोटी',
    gu: 'ખાલી પેટે',
    bn: 'খালি পেটে',
    pa: 'ਖਾਲੀ ਪੇਟ',
    or: 'ଖାଲି ପେଟରେ',
    as: 'খালী পেটত',
    ur: 'خالی پیٹ'
  }
};

const DIAGNOSIS_MAP: Record<string, Record<string, string>> = {
  'Atypical Chest Pain': {
    hi: 'असामान्य सीने में दर्द (Atypical Chest Pain)',
    te: 'అసాధారణ ఛాతీ నొప్పి (Atypical Chest Pain)',
    ta: 'நெஞ்சு வலி (Atypical Chest Pain)',
    kn: 'ಎದೆ ನೋವು (Atypical Chest Pain)',
    ml: 'നെഞ്ചുവേദന (Atypical Chest Pain)',
    mr: 'छातीत दुखणे (Atypical Chest Pain)',
    gu: 'છાતીમાં દુખાવો (Atypical Chest Pain)',
    bn: 'বুকে ব্যথা (Atypical Chest Pain)',
    pa: 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ (Atypical Chest Pain)',
    or: 'ଛାତି ବିନ୍ଧା (Atypical Chest Pain)',
    as: 'বুকুৰ বিষ (Atypical Chest Pain)',
    ur: 'سینے میں درد (Atypical Chest Pain)'
  },
  'Essential Hypertension': {
    hi: 'उच्च रक्तचाप (High Blood Pressure / Hypertension)',
    te: 'అధిక రక్తపోటు (High Blood Pressure / Hypertension)',
    ta: 'உயர் ரத்த அழுத்தம் (Hypertension)',
    kn: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ (Hypertension)',
    ml: 'ഉയർന്ന രക്തസമ്മർദ്ദം (Hypertension)',
    mr: 'उच्च रक्तदाब (Hypertension)',
    gu: 'હાઈ બ્લડ પ્રેશર (Hypertension)',
    bn: 'উচ্চ রক্তচাপ (Hypertension)',
    pa: 'ਹਾਈ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (Hypertension)',
    or: 'ଉଚ୍ଚ ରକ୍ତଚାପ (Hypertension)',
    as: 'উচ্চ ৰক্তচাপ (Hypertension)',
    ur: 'ہائی بلڈ پریشر (Hypertension)'
  },
  'Type 2 Diabetes Mellitus': {
    hi: 'टाइप 2 मधुमेह (Type 2 Diabetes)',
    te: 'టైప్ 2 మధుమేహం (Type 2 Diabetes)',
    ta: 'டைப் 2 நீரிழிவு (Type 2 Diabetes)',
    kn: 'ಟೈಪ್ 2 ಮಧುಮೇಹ (Type 2 Diabetes)',
    ml: 'ടൈപ്പ് 2 പ്രമേഹം (Type 2 Diabetes)',
    mr: 'टाइप 2 मधुमेह (Type 2 Diabetes)',
    gu: 'ટાઇપ 2 ડાયાબિટીસ (Type 2 Diabetes)',
    bn: 'টাইপ ২ ডায়াবেটিস (Type 2 Diabetes)',
    pa: 'ਟਾਈਪ 2 ਡਾਇਬਟੀਜ਼ (Type 2 Diabetes)',
    or: 'ଟାଇପ୍ ୨ ମଧୁମେହ (Type 2 Diabetes)',
    as: 'টাইপ ২ ডায়াবেটিছ (Type 2 Diabetes)',
    ur: 'ٹائپ 2 ذیابیطس (Type 2 Diabetes)'
  }
};

const UI_LABELS: Record<string, Record<string, string>> = {
  prescribedMedications: {
    en: 'Prescribed Medications',
    hi: 'निर्धारित दवाएं (Rx)',
    te: 'సూచించిన మందులు (Rx)',
    ta: 'பரிந்துரைக்கப்பட்ட மருந்துகள்',
    kn: 'ಸೂಚಿಸಿದ ಔಷಧಿಗಳು',
    ml: 'നിർദ്ദേശിച്ച മരുന്നുകൾ',
    mr: 'नियुक्त औषधे',
    gu: 'લખાયેલ દવાઓ',
    bn: 'প্রেসক্রাইব করা ওষুধ',
    pa: 'ਲਿਖੀਆਂ ਦਵਾਈਆਂ',
    or: 'ଦିଆଯାଇଥିବା ଷଧ',
    as: 'লিখি দিয়া ঔষধ',
    ur: 'تجویز کردہ ادویات'
  },
  medicationHeader: {
    en: 'Medication Name & Strength',
    hi: 'दवा का नाम और खुराक',
    te: 'మందు పేరు & మోతాదు',
    ta: 'மருந்தின் பெயர் & அளவு',
    kn: 'ಔಷಧಿಯ ಹೆಸರು ಮತ್ತು ಪ್ರಮಾಣ',
    ml: 'മരുന്നിന്റെ പേരും അളവും',
    mr: 'औषधाचे नाव व डोस',
    gu: 'દવાનું નામ અને ડોઝ',
    bn: 'ওষুধের নাম ও মাত্রা',
    pa: 'ਦਵਾਈ ਦਾ ਨਾਮ ਅਤੇ ਖੁਰਾਕ',
    or: ' ଷଧର ନାମ ଓ ମାତ୍ରା',
    as: 'ঔষধৰ নাম আৰু মাত্ৰা',
    ur: 'دوا کا نام اور مقدار'
  },
  frequencyHeader: {
    en: 'Frequency (Schedule)',
    hi: 'समय सारणी (Frequency)',
    te: 'వేసే సమయాలు (Frequency)',
    ta: 'அளவு நேரம்',
    kn: 'ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ',
    ml: 'കഴിക്കേണ്ട സമയം',
    mr: 'वेळापत्रक',
    gu: 'સમયપત્રક',
    bn: 'সময়সূচী',
    pa: 'ਸਮਾਂ ਸਾਰਣੀ',
    or: 'ସମୟସୂଚୀ',
    as: 'সময়সূচী',
    ur: 'وقت کی پابندی'
  },
  durationHeader: {
    en: 'Duration',
    hi: 'अवधि (दिन)',
    te: 'వాడాల్సిన రోజులు',
    ta: 'நாட்கள்',
    kn: 'ದಿನಗಳು',
    ml: 'ദിവസങ്ങൾ',
    mr: 'कालावधी',
    gu: 'સમયગાળો',
    bn: 'মেয়াদ',
    pa: 'ਮਿਆਦ',
    or: 'ସମୟସୀମା',
    as: 'সময়সীমা',
    ur: 'مدت'
  },
  instructionsHeader: {
    en: 'Instructions / Timing',
    hi: 'दिशानिर्देश / समय',
    te: 'సూచనలు / పద్ధతి',
    ta: 'வழிமுறைகள்',
    kn: 'ಸೂಚನೆಗಳು',
    ml: 'നിർദ്ദേശങ്ങൾ',
    mr: 'सूचना',
    gu: 'સૂચનાઓ',
    bn: 'নির্দেশনা',
    pa: 'ਹਦਾਇਤਾਂ',
    or: 'ନିର୍ଦ୍ଦେଶାବଳୀ',
    as: 'নিৰ্দেশনা',
    ur: 'ہدایات'
  },
  advisedTests: {
    en: 'Advised Investigations & Tests',
    hi: 'सलाह दी गई प्रयोगशाला जांच',
    te: 'సూచించిన ల్యాబ్ పరీక్షలు',
    ta: 'பரிந்துரைக்கப்பட்ட சோதனைகள்',
    kn: 'ಸೂಚಿಸಿದ ಪರೀಕ್ಷೆಗಳು',
    ml: 'നിർദ്ദേശിച്ച പരിശോധനകൾ',
    mr: 'सल्ला दिलेल्या चाचण्या',
    gu: 'સૂચવેલ લેબ ટેસ્ટ',
    bn: 'পরামর্শকৃত পরীক্ষাসমূহ',
    pa: 'ਸਲਾਹ ਦਿੱਤੇ ਟੈਸਟ',
    or: 'ପରାମର୍ଶ ଦିଆଯାଇଥିବା ପରୀକ୍ଷା',
    as: 'পৰামৰ্শ দিয়া পৰীক্ষাসমূহ',
    ur: 'تجویز کردہ لیبارٹری ٹیسٹ'
  },
  clinicalDiagnosis: {
    en: 'Clinical Diagnosis',
    hi: 'चिकित्सकीय निदान (Diagnosis)',
    te: 'వ్యాధి నిర్ధారణ (Diagnosis)',
    ta: 'நோய் கண்டறிதல்',
    kn: 'ರೋಗ ನಿರ್ಣಯ',
    ml: 'രോഗനിർണയം',
    mr: 'निदान',
    gu: 'રોગ નિદાન',
    bn: 'রোগ নির্ণয়',
    pa: 'ਬਿਮਾਰੀ ਦੀ ਜਾਂਚ',
    or: 'ରୋଗ ନିରୂପଣ',
    as: 'ৰোগ নিৰ্ণয়',
    ur: 'طبی تشخیص'
  }
};

// Memory Translation Cache Structure
export interface CacheEntry {
  key: string;
  originalText: string;
  translatedText: string;
  langCode: string;
  timestamp: number;
}

class TranslationCacheService {
  private cache: Map<string, CacheEntry> = new Map();

  private generateKey(text: string, langCode: string): string {
    return `${langCode}_${text.trim().toLowerCase()}`;
  }

  get(text: string, langCode: string): string | null {
    if (langCode === 'en') return text;
    const entry = this.cache.get(this.generateKey(text, langCode));
    return entry ? entry.translatedText : null;
  }

  set(text: string, langCode: string, translatedText: string): void {
    const key = this.generateKey(text, langCode);
    this.cache.set(key, {
      key,
      originalText: text,
      translatedText,
      langCode,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const translationCache = new TranslationCacheService();

/**
 * Enterprise Medical Translation Function
 * Translates frequency, instructions, diagnosis & advice while leaving
 * generic drug names, brand names, numbers, units, and doctor metadata intact.
 */
export function translateMedicalText(text: string, langCode: string): string {
  if (!text || langCode === 'en') return text;

  // Check cache first
  const cached = translationCache.get(text, langCode);
  if (cached) return cached;

  let translated = text;

  // 1. Frequency Lookup
  if (FREQUENCY_MAP[text] && FREQUENCY_MAP[text][langCode]) {
    translated = FREQUENCY_MAP[text][langCode];
  } else {
    // Partial frequency replacements
    Object.keys(FREQUENCY_MAP).forEach(freqKey => {
      if (translated.includes(freqKey) && FREQUENCY_MAP[freqKey][langCode]) {
        translated = translated.replace(freqKey, FREQUENCY_MAP[freqKey][langCode]);
      }
    });
  }

  // 2. Instruction Lookup
  if (INSTRUCTION_MAP[text] && INSTRUCTION_MAP[text][langCode]) {
    translated = INSTRUCTION_MAP[text][langCode];
  } else {
    Object.keys(INSTRUCTION_MAP).forEach(instKey => {
      if (translated.includes(instKey) && INSTRUCTION_MAP[instKey][langCode]) {
        translated = translated.replace(instKey, INSTRUCTION_MAP[instKey][langCode]);
      }
    });
  }

  // 3. Diagnosis Lookup
  if (DIAGNOSIS_MAP[text] && DIAGNOSIS_MAP[text][langCode]) {
    translated = DIAGNOSIS_MAP[text][langCode];
  }

  // Cache result
  translationCache.set(text, langCode, translated);
  return translated;
}

export function getUILabel(key: string, langCode: string): string {
  if (UI_LABELS[key] && UI_LABELS[key][langCode]) {
    return UI_LABELS[key][langCode];
  }
  return UI_LABELS[key]?.['en'] || key;
}
