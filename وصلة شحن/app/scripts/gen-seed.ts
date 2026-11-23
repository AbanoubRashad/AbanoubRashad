// يولّد backend/seed.sql من src/data/stations.ts
// التشغيل: npm run seed:sql
import { writeFileSync } from 'node:fs';
import { seedStations } from '../src/data/stations.ts';

const q = (v: string | null) => (v === null ? 'null' : `'${v.replace(/'/g, "''")}'`);
const arr = (a: string[]) => `array[${a.map(q).join(', ')}]::text[]`;

let sql = '-- اتولّد تلقائي من app/src/data/stations.ts — متعدلش هنا\n-- npm run seed:sql\n\n';
for (const s of seedStations) {
  sql += `insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values (${q(s.id)}, ${q(s.name)}, ${q(s.operator)}, ${q(s.area)}, ${q(s.quality)}, ${s.lat}, ${s.lng}, ${s.approximate}, ${q(s.price)}, ${q(s.hours)}, ${arr(s.nearby)}, ${q(s.notes)}, ${q(s.source)}, ${s.onHighway})
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;\n`;
  for (const p of s.plugs) {
    sql += `insert into public.plugs (station_id, id, connector, kw) values (${q(s.id)}, ${q(p.id)}, ${q(p.connector)}, ${p.kw ?? 'null'})
on conflict (station_id, id) do update set connector = excluded.connector, kw = excluded.kw;\n`;
  }
  sql += '\n';
}
writeFileSync(new URL('../../backend/seed.sql', import.meta.url), sql);
console.log(`seed.sql: ${seedStations.length} stations`);
