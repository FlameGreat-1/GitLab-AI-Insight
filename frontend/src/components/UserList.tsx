// src/components/UserList.tsx

import React, { useState, useEffect } from 'react';
import { List, message } from 'antd';
import { userService } from '../services/userService';
import { User } from '../types/user';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userService.fetchUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      message.error('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <List
      loading={loading}
      dataSource={users}
      renderItem={(user) => (
        <List.Item>
          <List.Item.Meta
            title={user.name}
            description={user.email}
          />
        </List.Item>
      )}
    />
  );
};

export default UserList;
