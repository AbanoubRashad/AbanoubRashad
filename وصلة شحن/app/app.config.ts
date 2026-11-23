import type { ConfigContext, ExpoConfig } from 'expo/config';

// الإعدادات الأساسية في app.json؛ هنا بس القيم اللي جاية من متغيرات البيئة (مش بتترفع على GitHub).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    config: { ...config.android?.config, googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
  },
  extra: {
    ...config.extra,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
