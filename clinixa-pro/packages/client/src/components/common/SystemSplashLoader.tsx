import { BrandLogo } from '../BrandLogo';
import './SystemSplashLoader.css';

interface SystemSplashLoaderProps {
  statusMessage?: string;
}

export function SystemSplashLoader({
  statusMessage = 'جاري تهيئة النظام والمزامنة…',
}: SystemSplashLoaderProps) {
  return (
    <div className="splash-loader-wrapper" role="status" aria-live="polite">
      <div className="splash-bg-glow" />

      <div className="splash-content">
        <div className="splash-logo-container">
          <div className="splash-pulse-ring" />
          <div className="splash-pulse-ring delay" />
          <div className="splash-logo-box">
            <BrandLogo />
          </div>
        </div>

        <h2 className="splash-brand-title">CLINIXA</h2>

        {/* ECG pulse graphic animation */}
        <div className="splash-ecg-box" aria-hidden="true">
          <svg width="180" height="32" viewBox="0 0 180 32" fill="none">
            <path
              d="M0 16 H50 L58 4 L68 28 L78 8 L86 22 L94 16 H180"
              stroke="url(#logoGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="splash-ecg-path"
            />
          </svg>
        </div>

        {/* Animated Progress bar */}
        <div className="splash-progress-track">
          <div className="splash-progress-bar" />
        </div>

        <p className="splash-status-text">{statusMessage}</p>
      </div>
    </div>
  );
}
