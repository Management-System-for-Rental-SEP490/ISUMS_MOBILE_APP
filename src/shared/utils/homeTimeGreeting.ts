/**
 * Khóa i18n `home.greeting_*` — căn theo giờ thiết bị (local).
 * Sáng 5–11, trưa 11–13, chiều 13–18, tối 18–22, đêm 22–5.
 */
export type HomeGreetingI18nKey =
  | "home.greeting_morning"
  | "home.greeting_noon"
  | "home.greeting_afternoon"
  | "home.greeting_evening"
  | "home.greeting_night";

export function getHomeGreetingI18nKey(date: Date = new Date()): HomeGreetingI18nKey {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "home.greeting_morning";
  if (h >= 11 && h < 13) return "home.greeting_noon";
  if (h >= 13 && h < 18) return "home.greeting_afternoon";
  if (h >= 18 && h < 22) return "home.greeting_evening";
  return "home.greeting_night";
}
