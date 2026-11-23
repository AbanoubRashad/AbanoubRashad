import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { savePushToken } from './backend';

/**
 * إشعارات «الشاحن فضي» / «المحطة بقت بايظة».
 * دلوقتي: إشعار محلي لما التطبيق شغال (أو في الخلفية) وحالة محطة بتراقبها تتغير.
 * بعد كده: إشعار من السيرفر حتى لو التطبيق مقفول (push token بيتحفظ في جدول push_tokens).
 */

let ready: Promise<boolean> | null = null;

export function initNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  ready ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('stations', {
        name: 'حالة المحطات',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#22D3EE',
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      if (projectId) {
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        await savePushToken(token.data);
      }
    } catch {
      // الـ push token محتاج development build و EAS project، مش ضروري للإشعارات المحلية
    }
    return true;
  })();
  return ready;
}

export async function notifyStationChange(title: string, body: string, stationId: string) {
  if (!(await initNotifications())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { stationId } },
    trigger: Platform.OS === 'android' ? { channelId: 'stations' } : null,
  });
}
