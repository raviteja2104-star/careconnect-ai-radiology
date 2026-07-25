// @careconnect/utils — Shared Utilities

// ─── Date & Time ──────────────────────────────────────────────────────────────
export function formatDate(date: Date | string, locale = 'en-IN'): string {
  return new Date(date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(date: Date | string, use24h = true): string {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: !use24h });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function calculateAge(dob: Date | string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function timeSince(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

// ─── String Utilities ─────────────────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

export function truncate(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─── Number & Currency Utilities ──────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatNumber(n: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundTo(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ─── Clinical Utilities ───────────────────────────────────────────────────────
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return roundTo(weightKg / (heightM * heightM), 1);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function calculateMAP(systolic: number, diastolic: number): number {
  return roundTo(diastolic + (systolic - diastolic) / 3, 0);
}

export function mlPerKgHr(urineOutputMl: number, weightKg: number, periodHours: number): number {
  return roundTo(urineOutputMl / (weightKg * periodHours), 2);
}

export function isOliguria(urineOutputMl: number, weightKg: number, periodHours: number): boolean {
  return mlPerKgHr(urineOutputMl, weightKg, periodHours) < 0.5;
}

// ─── Validation Utilities ─────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[+]?[\d\s()-]{10,15}$/.test(phone);
}

export function isValidMRN(mrn: string): boolean {
  return /^MRN-\d{4}-\d{8}$/.test(mrn);
}

// ─── Array Utilities ──────────────────────────────────────────────────────────
export function groupBy<T, K extends string>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] ?? []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function uniqueBy<T>(arr: T[], key: (item: T) => unknown): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function sortBy<T>(arr: T[], key: (item: T) => number | string, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const av = key(a), bv = key(b);
    const result = av < bv ? -1 : av > bv ? 1 : 0;
    return order === 'asc' ? result : -result;
  });
}

// ─── Debounce / Throttle ──────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Random / ID Utilities ────────────────────────────────────────────────────
export function generateId(prefix = ''): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
