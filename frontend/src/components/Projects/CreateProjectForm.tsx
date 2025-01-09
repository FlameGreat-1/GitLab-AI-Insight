// src/components/Projects/CreateProjectForm.tsx

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Form, Input, Select, Button, message } from 'antd';
import { mutations } from '../../services/graphql/mutations';
import { queries } from '../../services/graphql/queries';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../../utils/analytics';

const { Option } = Select;

const CreateProjectForm: React.FC = () => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [createProject, { loading }] = useMutation(mutations.CREATE_PROJECT, {
    update(cache, { data: { createProject } }) {
      const existingProjects = cache.readQuery({ query: queries.GET_PROJECTS });
      cache.writeQuery({
        query: queries.GET_PROJECTS,
        data: { projects: { edges: [createProject.project, ...existingProjects.projects.edges] } },
      });
    },
    onCompleted: () => {
      message.success(t('projectCreated'));
      form.resetFields();
      trackEvent('Project Created');
    },
    onError: (error) => {
      message.error(t('projectCreationError'));
      console.error('Project creation error:', error);
    },
  });

  const onFinish = (values: any) => {
    createProject({
      variables: {
        input: {
          name: values.name,
          description: values.description,
          visibility: values.visibility,
        },
      },
      optimisticResponse: {
        createProject: {
          project: {
            id: 'temp-id',
            name: values.name,
            description: values.description,
            visibility: values.visibility,
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            webUrl: '#',
            statistics: {
              commitCount: 0,
              storageSize: 0,
              repositorySize: 0,
              lfsObjectsSize: 0,
              jobArtifactsSize: 0,
            },
            __typename: 'Project',
          },
          errors: null,
        },
      },
    });
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="name"
        label={t('projectName')}
        rules={[{ required: true, message: t('projectNameRequired') }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="description" label={t('projectDescription')}>
        <Input.TextArea />
      </Form.Item>
      <Form.Item
        name="visibility"
        label={t('projectVisibility')}
        rules={[{ required: true, message: t('visibilityRequired') }]}
      >
        <Select>
          <Option value="private">{t('private')}</Option>
          <Option value="internal">{t('internal')}</Option>
          <Option value="public">{t('public')}</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('createProject')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CreateProjectForm;
