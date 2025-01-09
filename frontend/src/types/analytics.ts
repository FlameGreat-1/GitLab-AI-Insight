export interface NetworkNode {
  id: string;
  type: 'user' | 'project' | 'issue' | 'merge_request';
  name: string;
  weight: number;
  metadata: {
    [key: string]: any;
  };
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
  type: 'collaboration' | 'dependency' | 'reference';
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  metadata: {
    totalNodes: number;
    totalLinks: number;
    density: number;
    averageDegree: number;
  };
}

export type AnalyticsTimeRange = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'LAST_12_MONTHS' | 'ALL_TIME';

export type AnalyticsMetric = 'COMMITS' | 'ISSUES' | 'MERGE_REQUESTS' | 'CODE_CHANGES';

export interface AnalyticsFilters {
  projects?: string[];
  users?: string[];
  labels?: string[];
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

export interface TimeSeriesData {
  metric: AnalyticsMetric;
  data: TimeSeriesDataPoint[];
}

export interface ContributorStats {
  userId: string;
  username: string;
  commits: number;
  additions: number;
  deletions: number;
  issuesCreated: number;
  issuesClosed: number;
  mergeRequestsCreated: number;
  mergeRequestsMerged: number;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  commits: number;
  contributors: number;
  openIssues: number;
  closedIssues: number;
  openMergeRequests: number;
  mergedMergeRequests: number;
}

export interface CodeQualityData {
  date: string;
  complexity: number;
  maintainability: number;
  testCoverage: number;
}

export interface CodeQualityPrediction {
  complexity: number;
  maintainability: number;
  testCoverage: number;
}

export interface SentimentEntry {
  date: string;
  source: string;
  sentimentScore: number;
  text: string;
}
