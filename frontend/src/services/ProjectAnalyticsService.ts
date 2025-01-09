// src/services/ProjectAnalyticsService.ts

import DataTransformer from '../utils/dataTransformers';
import { Project, Commit, TimeSeriesData, LanguageData } from '../types';
import { apiService } from './api';

class ProjectAnalyticsService {
  async getProjectAnalytics(projectId: string) {
    try {
      const rawProjectData = await apiService.get(`/projects/${projectId}`);
      const rawCommitsData = await apiService.get(`/projects/${projectId}/repository/commits`);
      const rawTimeSeriesData = await apiService.get(`/projects/${projectId}/analytics/commit_activity`);
      const rawLanguageData = await apiService.get(`/projects/${projectId}/languages`);

      const normalizedProject = DataTransformer.normalizeProjectData(rawProjectData);
      const normalizedCommits = rawCommitsData.map(DataTransformer.normalizeCommitData);
      
      const projectStats = DataTransformer.calculateProjectStats(normalizedProject);
      const uniqueContributors = DataTransformer.getUniqueContributors(normalizedCommits);
      
      const timeSeriesData = DataTransformer.transformTimeSeriesData(rawTimeSeriesData, 'date', 'commits_count');
      const aggregatedWeeklyData = DataTransformer.aggregateTimeSeriesData(timeSeriesData, 'week');
      
      const normalizedLanguageData = DataTransformer.normalizeLanguageData(rawLanguageData);

      return {
        project: normalizedProject,
        stats: projectStats,
        contributors: uniqueContributors,
        commitActivity: aggregatedWeeklyData,
        languageBreakdown: normalizedLanguageData,
      };
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw error;
    }
  }

  async getProjectsOverview(namespaceId: string) {
    try {
      const rawProjectsData = await apiService.get(`/namespaces/${namespaceId}/projects`);
      const normalizedProjects = rawProjectsData.map(DataTransformer.normalizeProjectData);
      
      const projectsByNamespace = DataTransformer.groupProjectsByNamespace(normalizedProjects);
      const sortedProjects = DataTransformer.sortProjectsByActivity(normalizedProjects);

      return {
        projectsByNamespace,
        sortedProjects,
        totalProjects: normalizedProjects.length,
      };
    } catch (error) {
      console.error('Error fetching projects overview:', error);
      throw error;
    }
  }
}

export const projectAnalyticsService = new ProjectAnalyticsService();
