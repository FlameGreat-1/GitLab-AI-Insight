// src/components/Projects/ProjectList.tsx

import React, { useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { List, Card, Skeleton, Input, Button, message, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { queries } from '../../services/graphql/queries';
import { Project } from '../../types/project';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import { trackEvent } from '../../utils/analytics';

const { Meta } = Card;

const ProjectList: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  const { loading, error, data, fetchMore, refetch } = useQuery(queries.GET_PROJECTS, {
    variables: { first: 10, after: currentCursor, search: searchTerm },
    notifyOnNetworkStatusChange: true,
  });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setCurrentCursor(null);
      refetch({ first: 10, after: null, search: value });
      trackEvent('Project Search', { searchTerm: value });
    }, 300),
    []
  );

  const handleLoadMore = useCallback(() => {
    if (data?.projects.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.projects.pageInfo.endCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            projects: {
              ...fetchMoreResult.projects,
              edges: [...prev.projects.edges, ...fetchMoreResult.projects.edges],
            },
          };
        },
      });
      setCurrentCursor(data.projects.pageInfo.endCursor);
      trackEvent('Load More Projects');
    }
  }, [data, fetchMore]);

  const handleRefresh = useCallback(() => {
    refetch();
    trackEvent('Refresh Projects List');
  }, [refetch]);

  if (error) {
    message.error(t('projectListError'));
    console.error('Failed to fetch projects:', error);
    return <div>{t('errorOccurred')}</div>;
  }

  return (
    <div>
      <Input
        prefix={<SearchOutlined />}
        placeholder={t('searchProjects')}
        onChange={(e) => debouncedSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={data?.projects.edges || []}
        renderItem={({ node }: { node: Project }) => (
          <List.Item>
            <Card
              hoverable
              cover={
                <img
                  alt={node.name}
                  src={node.avatarUrl || 'https://via.placeholder.com/300'}
                  style={{ height: 200, objectFit: 'cover' }}
                />
              }
              actions={[
                <Tooltip title={t('viewDetails')}>
                  <Button icon={<SearchOutlined />} href={`/projects/${node.id}`} />
                </Tooltip>,
              ]}
            >
              <Skeleton loading={loading} active>
                <Meta
                  title={node.name}
                  description={
                    <>
                      <p>{node.description}</p>
                      <p>{t('lastActivity')}: {new Date(node.lastActivityAt).toLocaleDateString()}</p>
                    </>
                  }
                />
              </Skeleton>
            </Card>
          </List.Item>
        )}
        loadMore={
          data?.projects.pageInfo.hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={handleLoadMore} loading={loading}>
                {t('loadMore')}
              </Button>
            </div>
          )
        }
      />
      <Tooltip title={t('refreshList')}>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          style={{ position: 'fixed', bottom: 20, right: 20 }}
        />
      </Tooltip>
    </div>
  );
};

export default ProjectList;
