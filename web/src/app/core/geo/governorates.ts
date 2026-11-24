export interface LatLng {
  lat: number;
  lng: number;
}

export interface Governorate {
  /** القيمة اللي بتتخزّن مع الطلب (إنجليزي ثابت). */
  value: string;
  ar: string;
  /** مركز تقريبي للمحافظة، بنفتح عليه الخريطة. */
  center: LatLng;
  /** أسماء تانية بتيجي من خدمة العناوين (بعد التنضيف). */
  aliases?: string[];
}

export const GOVERNORATES: readonly Governorate[] = [
  { value: 'Cairo', ar: 'القاهرة', center: { lat: 30.0444, lng: 31.2357 } },
  { value: 'Giza', ar: 'الجيزة', center: { lat: 30.0131, lng: 31.2089 }, aliases: ['aljizah'] },
  {
    value: 'Alexandria',
    ar: 'الإسكندرية',
    center: { lat: 31.2001, lng: 29.9187 },
    aliases: ['aliskandariyah'],
  },
  {
    value: 'Qalyubia',
    ar: 'القليوبية',
    center: { lat: 30.466, lng: 31.185 },
    aliases: ['qalyubiyah', 'alqalyubiyah', 'qalubiya'],
  },
  { value: 'Port Said', ar: 'بورسعيد', center: { lat: 31.2653, lng: 32.3019 } },
  { value: 'Suez', ar: 'السويس', center: { lat: 29.9668, lng: 32.5498 }, aliases: ['alsuways'] },
  {
    value: 'Dakahlia',
    ar: 'الدقهلية',
    center: { lat: 31.0409, lng: 31.3785 },
    aliases: ['daqahliyah', 'addaqahliyah', 'dakahliya'],
  },
  {
    value: 'Sharqia',
    ar: 'الشرقية',
    center: { lat: 30.5877, lng: 31.502 },
    aliases: ['sharqiyah', 'ashsharqiyah', 'sharkia'],
  },
  {
    value: 'Gharbia',
    ar: 'الغربية',
    center: { lat: 30.7865, lng: 31.0004 },
    aliases: ['gharbiyah', 'algharbiyah'],
  },
  {
    value: 'Monufia',
    ar: 'المنوفية',
    center: { lat: 30.5972, lng: 30.9876 },
    aliases: ['menofia', 'minufiyah', 'almunufiyah', 'monofia'],
  },
  {
    value: 'Beheira',
    ar: 'البحيرة',
    center: { lat: 31.0341, lng: 30.4682 },
    aliases: ['buhayrah', 'albuhayrah', 'behira'],
  },
  {
    value: 'Kafr El Sheikh',
    ar: 'كفر الشيخ',
    center: { lat: 31.1107, lng: 30.9388 },
    aliases: ['kafrashshaykh', 'kafrelsheikh'],
  },
  { value: 'Damietta', ar: 'دمياط', center: { lat: 31.4165, lng: 31.8133 }, aliases: ['dumyat'] },
  {
    value: 'Ismailia',
    ar: 'الإسماعيلية',
    center: { lat: 30.5965, lng: 32.2715 },
    aliases: ['alismailiyah', 'ismailiyah'],
  },
  {
    value: 'Faiyum',
    ar: 'الفيوم',
    center: { lat: 29.3084, lng: 30.8428 },
    aliases: ['fayoum', 'alfayyum', 'fayyum'],
  },
  {
    value: 'Beni Suef',
    ar: 'بني سويف',
    center: { lat: 29.0661, lng: 31.0994 },
    aliases: ['banisuwayf', 'benisuwef'],
  },
  {
    value: 'Minya',
    ar: 'المنيا',
    center: { lat: 28.1099, lng: 30.7503 },
    aliases: ['alminya', 'minia'],
  },
  { value: 'Asyut', ar: 'أسيوط', center: { lat: 27.1783, lng: 31.1859 }, aliases: ['assiut'] },
  { value: 'Sohag', ar: 'سوهاج', center: { lat: 26.5591, lng: 31.6948 }, aliases: ['suhaj'] },
  { value: 'Qena', ar: 'قنا', center: { lat: 26.1551, lng: 32.716 } },
  { value: 'Luxor', ar: 'الأقصر', center: { lat: 25.6872, lng: 32.6396 }, aliases: ['alaqsur'] },
  { value: 'Aswan', ar: 'أسوان', center: { lat: 24.0889, lng: 32.8998 }, aliases: ['aswan'] },
  {
    value: 'Red Sea',
    ar: 'البحر الأحمر',
    center: { lat: 27.2579, lng: 33.8116 },
    aliases: ['albahralahmar'],
  },
  {
    value: 'New Valley',
    ar: 'الوادي الجديد',
    center: { lat: 25.439, lng: 30.5586 },
    aliases: ['alwadialjadid'],
  },
  {
    value: 'Matrouh',
    ar: 'مطروح',
    center: { lat: 31.3543, lng: 27.2373 },
    aliases: ['matruh', 'marsamatruh'],
  },
  {
    value: 'North Sinai',
    ar: 'شمال سيناء',
    center: { lat: 31.1316, lng: 33.7984 },
    aliases: ['shamalsina'],
  },
  {
    value: 'South Sinai',
    ar: 'جنوب سيناء',
    center: { lat: 28.2417, lng: 33.6222 },
    aliases: ['janubsina'],
  },
];

/** "Cairo Governorate" / "محافظة القاهرة" / "Al-Qalyubiyah" -> "cairo" / "القاهرة" / "alqalyubiyah". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/governorate|محافظة/g, '')
    .replace(/[^a-z0-9ء-ي]/g, '');
}

/** أكواد ISO 3166-2:EG (بتيجي من خدمة العناوين، وهي أدق من الاسم لأن كتابة الاسم بتختلف). */
const ISO_CODES: Record<string, string> = {
  'EG-ALX': 'Alexandria',
  'EG-ASN': 'Aswan',
  'EG-AST': 'Asyut',
  'EG-BA': 'Red Sea',
  'EG-BH': 'Beheira',
  'EG-BNS': 'Beni Suef',
  'EG-C': 'Cairo',
  'EG-DK': 'Dakahlia',
  'EG-DT': 'Damietta',
  'EG-FYM': 'Faiyum',
  'EG-GH': 'Gharbia',
  'EG-GZ': 'Giza',
  'EG-IS': 'Ismailia',
  'EG-JS': 'South Sinai',
  'EG-KB': 'Qalyubia',
  'EG-KFS': 'Kafr El Sheikh',
  'EG-KN': 'Qena',
  'EG-LX': 'Luxor',
  'EG-MN': 'Minya',
  'EG-MNF': 'Monufia',
  'EG-MT': 'Matrouh',
  'EG-PTS': 'Port Said',
  'EG-SHG': 'Sohag',
  'EG-SHR': 'Sharqia',
  'EG-SIN': 'North Sinai',
  'EG-SUZ': 'Suez',
  'EG-WAD': 'New Valley',
};

/**
 * المحافظة المقابلة للمكان: بنجرّب كود ISO الأول، وبعدين الاسم (بعد التنضيف).
 * بترجّع null لو مش معروفة، والعميل يختارها بإيده.
 */
export function matchGovernorate(
  state: string | null | undefined,
  isoCode?: string | null,
): Governorate | null {
  const byCode = isoCode ? findGovernorate(ISO_CODES[isoCode.toUpperCase()] ?? '') : null;
  if (byCode) return byCode;

  if (!state) return null;
  const wanted = normalize(state);
  if (!wanted) return null;

  return (
    GOVERNORATES.find((g) =>
      [g.value, g.ar, ...(g.aliases ?? [])].some((name) => normalize(name) === wanted),
    ) ?? null
  );
}

export function findGovernorate(value: string): Governorate | null {
  return GOVERNORATES.find((g) => g.value === value) ?? null;
}

/** وسط مصر تقريباً: بنفتح عليه الخريطة قبل ما العميل يختار محافظة. */
export const EGYPT_CENTER: LatLng = { lat: 29.6, lng: 31.0 };
