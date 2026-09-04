/**
 * أرقام صفحات الـ Pagination مع "…" — نفس منطق `pagerHtml()` في البروتوتايب
 * (prototype/screens/patients/03-patients-list.html): أول صفحة، آخر صفحة،
 * والصفحة الحالية ±١، والباقي بينضغط لـ"…" واحدة.
 */
export function getPaginationRange(currentPage: number, totalPages: number): (number | '…')[] {
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  return pages;
}
