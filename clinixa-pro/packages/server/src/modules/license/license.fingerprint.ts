import * as os from 'os';
import * as crypto from 'crypto';

/**
 * @description استخراج بصمة عتاد ثابتة وفريدة للجهاز الحالي
 */
export function getMachineFingerprint(): string {
  const cpus = os.cpus().map((c) => c.model).join(';');
  const hostname = os.hostname();
  const platform = os.platform();
  const totalMem = os.totalmem().toString();
  
  // تجميع عناوين MAC لبطاقات الشبكة المتاحة
  const nets = os.networkInterfaces();
  const macs: string[] = [];
  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (netList) {
      for (const net of netList) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          macs.push(net.mac);
        }
      }
    }
  }

  const rawInfo = [hostname, platform, totalMem, cpus, macs.sort().join(',')].join('@@');
  
  // تحويل البيانات لبصمة SHA-256 مختصرة
  return crypto.createHash('sha256').update(rawInfo).digest('hex').slice(0, 16).toUpperCase();
}
