// بينسخ قواعد الحالة من التطبيق للسيرفر (Edge Functions)، علشان الاتنين يحسبوا نفس الحالة بالظبط.
// التشغيل: npm run sync:functions
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const out = new URL('../../backend/supabase/functions/_shared/', import.meta.url);
mkdirSync(out, { recursive: true });
const header = '// منسوخ تلقائي من app/src/domain — متعدلش هنا، عدّل في التطبيق وشغّل npm run sync:functions\n';
for (const f of ['status.ts', 'types.ts']) {
  const src = readFileSync(new URL(`../src/domain/${f}`, import.meta.url), 'utf8').replace(/from '\.\/types'/g, "from './types.ts'");
  writeFileSync(new URL(f, out), header + src);
}
console.log('synced status.ts + types.ts → backend/supabase/functions/_shared');
