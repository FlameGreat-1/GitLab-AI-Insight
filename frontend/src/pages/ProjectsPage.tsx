// src/pages/ProjectsPage.tsx

import React from 'react';
import { Typography } from 'antd';
import ProjectList from '../components/Projects/ProjectList';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Title level={2}>{t('projects')}</Title>
      <ProjectList />
    </div>
  );
};

export default ProjectsPage;
