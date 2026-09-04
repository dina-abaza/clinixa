import { useEffect, useRef, useState } from 'react';

/**
 * حالة فتح/قفل قايمة منسدلة واحدة في الـ Top bar (فرع/تنبيهات/حساب) — بتتقفل
 * بالضغط برّه العنصر أو بـ Esc، نفس سلوك `toggleMenu()` في البروتوتايب
 * (Design System §3، Row action menu / dropdown states).
 */
export function useDropdownMenu<T extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return { open, setOpen, ref, toggle: () => setOpen((v) => !v), close: () => setOpen(false) };
}
