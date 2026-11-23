-- اتولّد تلقائي من app/src/data/stations.ts — متعدلش هنا
-- npm run seed:sql

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('infinity-smart-village', 'Infinity Hub – القرية الذكية', 'Infinity', 'الصحراوي', 'من الإنترنت – محتاج تأكيد', 30.0712, 31.017, true, null, null, array[]::text[], 'على الطريق الصحراوي قبل بوابات إسكندرية · تسع 6 عربيات', 'hatla2ee.com', true)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;
insert into public.plugs (station_id, id, connector, kw) values ('infinity-smart-village', '01', 'CCS2', null)
on conflict (station_id, id) do update set connector = excluded.connector, kw = excluded.kw;
insert into public.plugs (station_id, id, connector, kw) values ('infinity-smart-village', '02', 'CCS2', null)
on conflict (station_id, id) do update set connector = excluded.connector, kw = excluded.kw;
insert into public.plugs (station_id, id, connector, kw) values ('infinity-smart-village', '03', 'Type 2', 22)
on conflict (station_id, id) do update set connector = excluded.connector, kw = excluded.kw;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('shell-out-desert-october', 'شل أوت – الطريق الصحراوي أكتوبر', 'Infinity', 'أكتوبر', 'من الإنترنت – محتاج تأكيد', 30.042, 31.003, true, null, null, array[]::text[], 'اتقال إنه وقف فترة ورجع اشتغل', 'hatla2ee.com / shbabbek.com', true)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;
insert into public.plugs (station_id, id, connector, kw) values ('shell-out-desert-october', '01', 'CCS2', null)
on conflict (station_id, id) do update set connector = excluded.connector, kw = excluded.kw;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('gezira-square-mall', 'مول الجزيرة سكوير', 'غير معروف', 'أكتوبر', 'من الإنترنت – محتاج تأكيد', 29.99, 30.97, true, null, null, array['مول']::text[], null, 'almaal.org', false)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('safwa-mall', 'صفوة مول', 'غير معروف', 'أكتوبر', 'من الإنترنت – محتاج تأكيد', 29.972, 30.948, true, null, null, array['مول']::text[], null, 'almaal.org', false)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('galleria-40', 'جاليريا مول 40', 'غير معروف', 'زايد', 'من الإنترنت – محتاج تأكيد', 30.028, 30.979, true, null, null, array['مول']::text[], null, 'almaal.org', false)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('arkan-mall', 'أركان مول', 'غير معروف', 'زايد', 'من الإنترنت – محتاج تأكيد', 30.0257, 30.9853, true, null, null, array['مول']::text[], null, 'almaal.org', false)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('dar-shal-km111', 'دار شال – استراحة واحة عمر (الكيلو 111)', 'غير معروف', 'الصحراوي', 'من الإنترنت – محتاج تأكيد', 30.63, 30.45, true, null, null, array['استراحة']::text[], 'عند بوابات إسكندرية', 'shbabbek.com / almaal.org', true)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('wataniya-south-beheira', 'محطة الوطنية – جنوب البحيرة', 'غير معروف', 'الصحراوي', 'من الإنترنت – محتاج تأكيد', 30.45, 30.63, true, null, null, array['محطة بنزين']::text[], 'طريق مصر إسكندرية الصحراوي', 'shbabbek.com / almaal.org', true)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

insert into public.stations (id, name, operator, area, quality, lat, lng, approximate, price, hours, nearby, notes, source, on_highway)
values ('wataniya-107', 'محطة الوطنية 107', 'غير معروف', 'الصحراوي', 'من الإنترنت – محتاج تأكيد', 30.6, 30.48, true, null, null, array['محطة بنزين']::text[], 'طريق إسكندرية البحيرة الصحراوي', 'shbabbek.com / almaal.org', true)
on conflict (id) do update set name = excluded.name, operator = excluded.operator, area = excluded.area, quality = excluded.quality,
  lat = excluded.lat, lng = excluded.lng, approximate = excluded.approximate, price = excluded.price, hours = excluded.hours,
  nearby = excluded.nearby, notes = excluded.notes, source = excluded.source, on_highway = excluded.on_highway;

