// src/components/ProjectAnalytics/ProjectAnalytics.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Row, Col } from 'antd';
import { projectAnalyticsService } from '../../services/ProjectAnalyticsService';
import CommitActivityChart from './CommitActivityChart';
import LanguageBreakdownChart from './LanguageBreakdownChart';
import ContributorsList from './ContributorsList';

const ProjectAnalytics: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await projectAnalyticsService.getProjectAnalytics(projectId);
        setAnalyticsData(data);
      } catch (error) {
        // Handle error (e.g., show error message)
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId]);

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <h1>{analyticsData.project.name} Analytics</h1>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Commit Activity">
            <CommitActivityChart data={analyticsData.commitActivity} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Language Breakdown">
            <LanguageBreakdownChart data={analyticsData.languageBreakdown} />
          </Card>
        </Col>
      </Row>
      <Card title="Contributors">
        <ContributorsList contributors={analyticsData.contributors} />
      </Card>
    </div>
  );
};

export default ProjectAnalytics;
