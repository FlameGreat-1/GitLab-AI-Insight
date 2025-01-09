// src/utils/dataTransformers.ts

import { groupBy, sortBy, flatten, uniqBy } from 'lodash';
import { Project, User, Commit, MergeRequest, Issue } from '../types';

export class DataTransformer {
  static normalizeProjectData(project: any): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      stars: project.star_count || 0,
      forks: project.forks_count || 0,
      lastActivityAt: new Date(project.last_activity_at),
      visibility: project.visibility,
      webUrl: project.web_url,
      avatarUrl: project.avatar_url,
      namespace: project.namespace ? {
        id: project.namespace.id,
        name: project.namespace.name,
        path: project.namespace.full_path,
      } : null,
    };
  }

  static normalizeUserData(user: any): User {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      webUrl: user.web_url,
      createdAt: new Date(user.created_at),
      lastActivityOn: user.last_activity_on ? new Date(user.last_activity_on) : null,
    };
  }

  static normalizeCommitData(commit: any): Commit {
    return {
      id: commit.id,
      shortId: commit.short_id,
      title: commit.title,
      authorName: commit.author_name,
      authorEmail: commit.author_email,
      createdAt: new Date(commit.created_at),
      message: commit.message,
    };
  }

  static normalizeMergeRequestData(mr: any): MergeRequest {
    return {
      id: mr.id,
      iid: mr.iid,
      title: mr.title,
      description: mr.description,
      state: mr.state,
      createdAt: new Date(mr.created_at),
      updatedAt: new Date(mr.updated_at),
      mergedAt: mr.merged_at ? new Date(mr.merged_at) : null,
      closedAt: mr.closed_at ? new Date(mr.closed_at) : null,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      author: this.normalizeUserData(mr.author),
      assignees: mr.assignees ? mr.assignees.map(this.normalizeUserData) : [],
    };
  }

  static normalizeIssueData(issue: any): Issue {
    return {
      id: issue.id,
      iid: issue.iid,
      title: issue.title,
      description: issue.description,
      state: issue.state,
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
      labels: issue.labels || [],
      author: this.normalizeUserData(issue.author),
      assignees: issue.assignees ? issue.assignees.map(this.normalizeUserData) : [],
    };
  }

  static groupProjectsByNamespace(projects: Project[]): { [key: string]: Project[] } {
    return groupBy(projects, 'namespace.name');
  }

  static sortProjectsByActivity(projects: Project[]): Project[] {
    return sortBy(projects, 'lastActivityAt').reverse();
  }

  static flattenCommits(projects: Project[]): Commit[] {
    return flatten(projects.map(project => project.commits || []));
  }

  static getUniqueContributors(commits: Commit[]): User[] {
    const contributors = commits.map(commit => ({
      id: commit.authorEmail,
      name: commit.authorName,
      email: commit.authorEmail,
    }));
    return uniqBy(contributors, 'email');
  }

  static calculateProjectStats(project: Project): { [key: string]: number } {
    return {
      totalCommits: project.commits ? project.commits.length : 0,
      openMergeRequests: project.mergeRequests ? project.mergeRequests.filter(mr => mr.state === 'opened').length : 0,
      openIssues: project.issues ? project.issues.filter(issue => issue.state === 'opened').length : 0,
    };
  }

  static transformTimeSeriesData(data: any[], dateKey: string, valueKey: string): { date: Date; value: number }[] {
    return data.map(item => ({
      date: new Date(item[dateKey]),
      value: Number(item[valueKey]),
    }));
  }

  static aggregateTimeSeriesData(data: { date: Date; value: number }[], interval: 'day' | 'week' | 'month'): { date: Date; value: number }[] {
    const groupedData = groupBy(data, item => {
      const date = item.date;
      switch (interval) {
        case 'day':
          return date.toISOString().split('T')[0];
        case 'week':
          const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
          return startOfWeek.toISOString().split('T')[0];
        case 'month':
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    });

    return Object.entries(groupedData).map(([key, values]) => ({
      date: new Date(key),
      value: values.reduce((sum, item) => sum + item.value, 0),
    }));
  }

  static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue === 0 ? 0 : 100;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  static normalizeLanguageData(data: { [key: string]: number }): { name: string; value: number }[] {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: (value / total) * 100,
    }));
  }
}

export default DataTransformer;
