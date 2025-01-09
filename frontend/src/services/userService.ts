// src/services/userService.ts

import { apiService } from './api';
import { User } from '../types/user'; // Assuming you have a User type defined

export const userService = {
  async fetchUsers(): Promise<User[]> {
    try {
      const users = await apiService.get<User[]>('/users');
      return users;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  // You can add more user-related methods here
  async getUserById(id: string): Promise<User> {
    try {
      const user = await apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      console.error(`Failed to fetch user with id ${id}:`, error);
      throw error;
    }
  },

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const newUser = await apiService.post<User>('/users', userData);
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  // ... other user-related methods
};
