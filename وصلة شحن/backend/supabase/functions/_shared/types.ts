// منسوخ تلقائي من app/src/domain — متعدلش هنا، عدّل في التطبيق وشغّل npm run sync:functions
export type StationStatus = 'working' | 'broken' | 'queue' | 'conflict' | 'unknown';

export type Connector = 'CCS2' | 'Type 2' | 'GB/T' | 'CHAdeMO';

export type Area = 'أكتوبر' | 'زايد' | 'الصحراوي';

export type DataQuality = 'من الإنترنت – محتاج تأكيد' | 'من تطبيق المشغل' | 'اتأكدت بنفسي' | 'مش موجودة / اتشالت';

export interface Plug {
  /** رقم الشاحن جوه المحطة، "01" "02" ... */
  id: string;
  connector: Connector;
  /** القدرة بالكيلووات، null لو مش معروفة */
  kw: number | null;
}

export interface Station {
  id: string;
  name: string;
  operator: string;
  area: Area;
  quality: DataQuality;
  lat: number;
  lng: number;
  /** الإحداثيات تقريبية لحد ما حد يأكدها على الأرض */
  approximate: boolean;
  plugs: Plug[];
  price: string | null;
  hours: string | null;
  nearby: string[];
  notes: string | null;
  source: string;
  onHighway: boolean;
}

export type ReportKind = 'ok' | 'broken' | 'queue';

export interface CheckIn {
  id: string;
  stationId: string;
  plugId: string | null;
  kind: ReportKind;
  /** وقت البلاغ بالميللي ثانية */
  at: number;
  userId: string;
  /** صورة اختيارية مع البلاغ (مسار في Storage) */
  photoPath?: string | null;
}
