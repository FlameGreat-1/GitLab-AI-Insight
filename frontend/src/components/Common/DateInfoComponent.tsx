// src/components/Common/DateInfoComponent.tsx

import React, { useState, useEffect } from 'react';
import { Card, Select, Typography, List, Tag, Button } from 'antd';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DateFormatter from '../../utils/dateFormatter';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/types';

const { Option } = Select;
const { Title, Text } = Typography;

const DateInfoComponent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [dateFormatter, setDateFormatter] = useState(new DateFormatter(i18n.language as 'en-US' | 'es' | 'fr' | 'de' | 'ja'));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date('2023-01-01'));
  const { projectCreationDate } = useSelector((state: RootState) => state.project);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dateFormatter.setLocale(i18n.language as 'en-US' | 'es' | 'fr' | 'de' | 'ja');
  }, [i18n.language]);

  const handleLocaleChange = (locale: 'en-US' | 'es' | 'fr' | 'de' | 'ja') => {
    i18n.changeLanguage(locale);
    setDateFormatter(new DateFormatter(locale));
  };

  const dateInfo = [
    { label: t('currentDateTime'), value: dateFormatter.format(currentDate, 'PPpp') },
    { label: t('selectedDate'), value: dateFormatter.format(selectedDate, 'PP') },
    { label: t('relativeDate'), value: dateFormatter.formatRelative(selectedDate) },
    { label: t('timeAgo'), value: dateFormatter.formatDistance(selectedDate) },
    { label: t('monthName'), value: dateFormatter.getMonthName(selectedDate.getMonth()) },
    { label: t('dayName'), value: dateFormatter.getDayName(selectedDate.getDay()) },
    { label: t('isWeekend'), value: dateFormatter.isWeekend(selectedDate) ? t('yes') : t('no') },
    { label: t('daysInMonth'), value: dateFormatter.getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()).toString() },
    { label: t('nextWeek'), value: dateFormatter.format(dateFormatter.addDays(selectedDate, 7), 'PP') },
    { label: t('lastWeek'), value: dateFormatter.format(dateFormatter.subtractDays(selectedDate, 7), 'PP') },
  ];

  return (
    <Card title={t('dateInformation')} extra={
      <Select defaultValue={i18n.language} style={{ width: 120 }} onChange={handleLocaleChange}>
        <Option value="en-US">English</Option>
        <Option value="es">Español</Option>
        <Option value="fr">Français</Option>
        <Option value="de">Deutsch</Option>
        <Option value="ja">日本語</Option>
      </Select>
    }>
      <Title level={4}>{t('currentDateInfo')}</Title>
      <List
        dataSource={dateInfo}
        renderItem={item => (
          <List.Item>
            <Text strong>{item.label}:</Text> {item.value}
          </List.Item>
        )}
      />
      <Title level={4} style={{ marginTop: 20 }}>{t('projectInfo')}</Title>
      <List>
        <List.Item>
          <Text strong>{t('projectCreationDate')}:</Text> {dateFormatter.format(projectCreationDate, 'PPpp')}
        </List.Item>
        <List.Item>
          <Text strong>{t('projectAge')}:</Text> {dateFormatter.formatDistance(projectCreationDate)}
        </List.Item>
      </List>
      <div style={{ marginTop: 20 }}>
        <Button icon={<CalendarOutlined />} onClick={() => setSelectedDate(new Date())}>
          {t('setToToday')}
        </Button>
        <Tag color="blue" style={{ marginLeft: 10 }}>
          <ClockCircleOutlined /> {dateFormatter.format(currentDate, 'pp')}
        </Tag>
      </div>
    </Card>
  );
};

export default DateInfoComponent;
