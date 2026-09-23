import cron from 'node-cron';
import query from '../../db/sqlite/query';
import { runBackup } from './backup.service';

let schedulerTask: ReturnType<typeof cron.schedule> | null = null;
let isRunning = false;

/** @description يتحقق من أن الجدولة مستحقة في الدقيقة الحالية */
function isScheduleDue(schedule: { frequency: string; time: string; day_of_week: number | null }, now: Date): boolean {
  const currentMinute = now.getMinutes();
  if (schedule.frequency === 'minutely') return true;
  if (schedule.frequency === 'hourly') return currentMinute === Number(schedule.time.slice(3, 5));
  if (schedule.frequency === 'daily') return schedule.time === now.toTimeString().slice(0, 5);
  return schedule.day_of_week === now.getDay() && schedule.time === now.toTimeString().slice(0, 5);
}

/** @description ينفذ النسخ التلقائي المستحق لكل وجهة مرة واحدة */
async function runDueBackups(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const schedules = await query('backup_schedules').where({ is_enabled: 1 });
    const now = new Date();
    for (const schedule of schedules) {
      if (!isScheduleDue(schedule, now)) continue;
      await runBackup({
        destination: schedule.destination,
        kind: 'auto',
        target_path: schedule.target_path ?? undefined,
        backup_password: schedule.backup_password ?? undefined,
      });
    }
  } catch (error) {
    console.error('⚠️ Automatic backup scheduler failed:', error);
  } finally {
    isRunning = false;
  }
}

/** @description يبدأ فحص جدولة النسخ الاحتياطي كل دقيقة */
export function startBackupScheduler(): void {
  if (schedulerTask) return;
  schedulerTask = cron.schedule('* * * * *', () => void runDueBackups());
  console.log('✅ Automatic backup scheduler started');
}