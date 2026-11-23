/** رقم موبايل مصري: 10 أرقام بعد +20 ويبدأ بـ 10 / 11 / 12 / 15. بيرجّع 01xxxxxxxxx أو null */
export function normalizeEgPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '').replace(/^20/, '').replace(/^0/, '');
  return /^1[0125]\d{8}$/.test(d) ? `0${d}` : null;
}
