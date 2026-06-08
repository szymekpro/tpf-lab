import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { app } from './firebase';

type AnalyticsParams = Record<string, string | number | boolean>;

type ScreenAnalytics = {
  key: string;
  title: string;
};

const analyticsPromise = isSupported()
  .then((supported) => {
    if (!supported || !import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      return null;
    }
    return getAnalytics(app);
  })
  .catch(() => null);

export async function trackEvent(name: string, params?: AnalyticsParams): Promise<void> {
  const analytics = await analyticsPromise;
  if (!analytics) return;
  try {
    logEvent(analytics, name, params);
  } catch {
    /* analytics must not break app flows */
  }
}

export async function trackScreen(screen: ScreenAnalytics): Promise<void> {
  await trackEvent('screen_view', {
    screen_name: screen.key,
    page_title: screen.title,
    firebase_screen: screen.key,
    firebase_screen_class: screen.key,
  });
  await trackEvent(`view_${screen.key}`, {
    screen_name: screen.key,
    page_title: screen.title,
  });
}
