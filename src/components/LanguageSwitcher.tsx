import { useEffect, useRef, useState } from 'react';

import { useI18n } from '../i18n';

const LANGUAGES: Array<{ code: 'en' | 'de'; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="lang-dropdown-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('languageSwitcher.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={current.label}
      >
        <span className="lang-flag" aria-hidden="true">
          {current.flag}
        </span>
        <span className="lang-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="lang-menu" role="menu" aria-label={t('languageSwitcher.label')}>
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={language === code}
              className={`lang-menu-item ${language === code ? 'active' : ''}`}
              onClick={() => {
                setLanguage(code);
                setOpen(false);
              }}
            >
              <span className="lang-flag" aria-hidden="true">
                {flag}
              </span>
              <span>{label}</span>
              {language === code && (
                <span className="lang-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
