/**
 * @description تحويل وقت بصيغة 24 ساعة (HH:mm أو HH:mm:ss) إلى صيغة 12 ساعة مع ص/م.
 * @param time - الوقت كنص، مثلاً "18:42" أو "18:42:12"
 * @returns الوقت بصيغة 12 ساعة، مثلاً "6:42 م"
 */
export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h24 = parseInt(hStr, 10);
  if (Number.isNaN(h24)) return time;
  const period = h24 >= 12 ? 'م' : 'ص';
  const h12 = h24 % 12 || 12;
  return `${h12}:${mStr} ${period}`;
}
