// src/pages/CollaborationPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Row, Col, Card, Select, DatePicker, Button, Tooltip, Table, Tag, Spin, message, Modal, Input, Avatar } from 'antd';
import { TeamOutlined, MessageOutlined, FileSearchOutlined, BranchesOutlined, SyncOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store/types';
import { fetchCollaborationData, initiateCodeReview, sendMessage } from '../store/actions/collaborationActions';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { NetworkGraph } from '../components/Visualization/NetworkGraph';
import { CodeDiffViewer } from '../components/CodeDiffViewer';
import { ChatInterface } from '../components/ChatInterface';
import { trackEvent } from '../utils/analytics';
import { formatDate } from '../utils/formatters';
import { debounce } from 'lodash';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const CollaborationContainer = styled(motion.div)`
  padding: 24px;
`;

const CollaborationCard = styled(Card)`
  margin-bottom: 24px;
  height: 400px;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: ${props => props.theme.colors.tableHeaderBackground};
  }
`;

const CollaborationPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { data, loading, error } = useSelector((state: RootState) => state.collaboration);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (dateRange && selectedProject) {
      dispatch(fetchCollaborationData({ dateRange, projectId: selectedProject }));
    }
  }, [dispatch, dateRange, selectedProject]);

  const handleDateRangeChange = useCallback((dates: [moment.Moment, moment.Moment] | null) => {
    setDateRange(dates);
    trackEvent('Collaboration Date Range Changed', { range: dates ? `${dates[0].format('YYYY-MM-DD')} to ${dates[1].format('YYYY-MM-DD')}` : 'cleared' });
  }, []);

  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProject(projectId);
    trackEvent('Project Selected', { projectId });
  }, []);

  const handleInitiateReview = useCallback((commitId: string) => {
    setSelectedCommit(commitId);
    setReviewModalVisible(true);
    trackEvent('Code Review Initiated', { commitId });
  }, []);

  const handleReviewSubmit = useCallback(() => {
    if (selectedCommit && reviewComment) {
      dispatch(initiateCodeReview({ commitId: selectedCommit, comment: reviewComment }));
      setReviewModalVisible(false);
      setReviewComment('');
      message.success(t('reviewInitiated'));
      trackEvent('Code Review Submitted', { commitId: selectedCommit });
    }
  }, [dispatch, selectedCommit, reviewComment, t]);

  const handleChatInitiate = useCallback((userId: string) => {
    setSelectedUser(userId);
    setChatModalVisible(true);
    trackEvent('Chat Initiated', { userId });
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    if (selectedUser && message) {
      dispatch(sendMessage({ userId: selectedUser, message }));
      trackEvent('Message Sent', { userId: selectedUser });
    }
  }, [dispatch, selectedUser]);

  const debouncedFetchData = useMemo(
    () => debounce(() => {
      if (dateRange && selectedProject) {
        dispatch(fetchCollaborationData({ dateRange, projectId: selectedProject }));
      }
    }, 300),
    [dispatch, dateRange, selectedProject]
  );

  const renderCollaborationNetwork = useMemo(() => (
    <NetworkGraph data={data.collaborationNetwork} />
  ), [data.collaborationNetwork]);

  const columns = [
    {
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      render: (user: { name: string; avatar: string }) => (
        <span>
          <Avatar src={user.avatar} style={{ marginRight: 8 }} />
          {user.name}
        </span>
      ),
    },
    {
      title: t('commits'),
      dataIndex: 'commits',
      key: 'commits',
      sorter: (a, b) => a.commits - b.commits,
    },
    {
      title: t('reviews'),
      dataIndex: 'reviews',
      key: 'reviews',
      sorter: (a, b) => a.reviews - b.reviews,
    },
    {
      title: t('lastActive'),
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime(),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <Button icon={<MessageOutlined />} onClick={() => handleChatInitiate(record.id)}>
          {t('chat')}
        </Button>
      ),
    },
  ];

  const recentCommitsColumns = [
    {
      title: t('commit'),
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id.substring(0, 7),
    },
    {
      title: t('author'),
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: t('message'),
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: t('date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <Button icon={<FileSearchOutlined />} onClick={() => handleInitiateReview(record.id)}>
          {t('review')}
        </Button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) {
    message.error(t('collaborationDataLoadError'));
    return <div>{t('errorOccurred')}</div>;
  }

  return (
    <CollaborationContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1>{t('collaboration')}</h1>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker onChange={handleDateRangeChange} />
        </Col>
        <Col>
          <Select 
            style={{ width: 200 }} 
            placeholder={t('selectProject')}
            onChange={handleProjectChange}
          >
            {data.projects.map(project => (
              <Option key={project.id} value={project.id}>{project.name}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Tooltip title={t('refreshData')}>
            <Button icon={<SyncOutlined />} onClick={debouncedFetchData} />
          </Tooltip>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <CollaborationCard title={t('collaborationNetwork')}>
            {renderCollaborationNetwork}
          </CollaborationCard>
        </Col>
        <Col span={12}>
          <CollaborationCard title={t('teamMembers')}>
            <StyledTable 
              dataSource={data.teamMembers} 
              columns={columns} 
              pagination={{ pageSize: 5 }}
              scroll={{ y: 300 }}
            />
          </CollaborationCard>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <CollaborationCard title={t('recentCommits')}>
            <StyledTable 
              dataSource={data.recentCommits} 
              columns={recentCommitsColumns} 
              pagination={{ pageSize: 5 }}
              scroll={{ y: 300 }}
            />
          </CollaborationCard>
        </Col>
      </Row>
      <Modal
        title={t('initiateCodeReview')}
        visible={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
      >
        <CodeDiffViewer commitId={selectedCommit} />
        <TextArea 
          rows={4} 
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder={t('enterReviewComment')}
          style={{ marginTop: 16 }}
        />
      </Modal>
      <Modal
        title={t('chat')}
        visible={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={600}
      >
        <ChatInterface 
          userId={selectedUser} 
          onSendMessage={handleSendMessage}
        />
      </Modal>
    </CollaborationContainer>
  );
};

export default CollaborationPage;
