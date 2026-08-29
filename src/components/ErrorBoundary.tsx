import { Component, type ReactNode } from 'react';

import { I18nContext, type I18nContextValue } from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  static contextType = I18nContext;

  declare context: I18nContextValue;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.context;
      return (
        <div className="error-screen">
          <h2>{t('errors.genericTitle')}</h2>
          <p>{this.state.error?.message ?? t('errors.unknownError')}</p>
          <button onClick={() => window.location.reload()}>
            {t('errors.reload')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
