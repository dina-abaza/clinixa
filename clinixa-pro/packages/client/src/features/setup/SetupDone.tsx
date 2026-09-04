import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface Props {
  clinicName: string;
  username: string;
  questionLabel: string;
}

export function SetupDone({ clinicName, username, questionLabel }: Props) {
  const { t } = useTranslation();

  return (
    <div className="done on" role="status">
      <div className="icon-badge" aria-hidden="true">
        <svg width={24} height={24}>
          <use href="#i-check" />
        </svg>
      </div>
      <h1>{t('setup.done.title')}</h1>
      <p>{t('setup.done.body')}</p>

      <dl className="recap">
        <dt>{t('setup.done.recapClinic')}</dt>
        <dd>{clinicName || '—'}</dd>
        <dt>{t('setup.done.recapUser')}</dt>
        <dd>{username || '—'}</dd>
        <dt>{t('setup.done.recapQuestion')}</dt>
        <dd>{questionLabel || '—'}</dd>
      </dl>

      <Link className="btn btn-primary" to="/login">
        {t('setup.done.cta')}
      </Link>
    </div>
  );
}
