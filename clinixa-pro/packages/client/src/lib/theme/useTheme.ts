import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * مبدّل الوضع الفاتح/الداكن — بيحط data-theme على <html> عشان توكنز
 * tokens.css تتفعّل (نفس toggleTheme() في البروتوتايب). بدون تخزين محلي
 * بقصد: البروتوتايب برضه بيرجع للفاتح افتراضيًا في كل تحميل.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
