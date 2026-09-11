import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@clinixa/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  // ⚠ @clinixa/shared هو حزمة CJS متصلة بـ npm workspaces (symlink) — من
  // غير الإدراج الصريح ده، Vite بيخدمها مباشرة عن طريق /@fs/ بدل ما يعمل
  // Pre-bundle ليها، والتحليل التلقائي لصادراتها الاسمية (زي LAB_STATUSES)
  // بيفشل جزئيًا فبيرمي "does not provide an export named ..." وقت التشغيل.
  optimizeDeps: {
    include: ['@clinixa/shared'],
  },
})
