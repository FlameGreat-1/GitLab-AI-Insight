// src/components/Common/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { Button, Typography, Space, Collapse, message } from 'antd';
import { ReloadOutlined, BugOutlined, MailOutlined } from '@ant-design/icons';
import * as Sentry from "@sentry/react";
import { withTranslation, WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { RootState } from '../../store';
import { ThemeType } from '../../types/theme';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  theme: ThemeType;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  background-color: ${props => props.theme.colors.errorBackground};
  color: ${props => props.theme.colors.text};
`;

const ErrorImage = styled.img`
  width: 200px;
  margin-bottom: 20px;
`;

const ErrorDetails = styled(Collapse)`
  width: 100%;
  max-width: 600px;
  margin-top: 20px;
`;

const ActionButtons = styled(Space)`
  margin-top: 20px;
`;

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true, error: null, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log the error to Sentry
    Sentry.captureException(error, { extra: errorInfo });

    // You can also log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = `
      Error: ${error?.toString()}
      Component Stack: ${errorInfo?.componentStack}
      User Agent: ${navigator.userAgent}
      Timestamp: ${new Date().toISOString()}
    `;

    // Here you would typically send this error report to your backend
    console.log("Sending error report:", errorReport);
    message.success(this.props.t('errorReported'));
  };

  private handleContactSupport = () => {
    window.location.href = `mailto:support@example.com?subject=Error Report&body=${encodeURIComponent(this.state.error?.toString() || '')}`;
  };

  public render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, t, theme } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorContainer theme={theme}>
          <ErrorImage src="/error-illustration.svg" alt="Error Illustration" />
          <Title level={2}>{t('somethingWentWrong')}</Title>
          <Paragraph>{t('errorDescription')}</Paragraph>
          <ActionButtons>
            <Button icon={<ReloadOutlined />} onClick={this.handleReload}>
              {t('reload')}
            </Button>
            <Button icon={<BugOutlined />} onClick={this.handleReportError}>
              {t('reportError')}
            </Button>
            <Button icon={<MailOutlined />} onClick={this.handleContactSupport}>
              {t('contactSupport')}
            </Button>
          </ActionButtons>
          <ErrorDetails>
            <Panel header={t('errorDetails')} key="1">
              <Text code>{error && error.toString()}</Text>
              <br />
              <Text code>{errorInfo && errorInfo.componentStack}</Text>
            </Panel>
          </ErrorDetails>
        </ErrorContainer>
      );
    }

    return children;
  }
}

const mapStateToProps = (state: RootState) => ({
  theme: state.theme
});

export default connect(mapStateToProps)(withTranslation()(ErrorBoundary));
