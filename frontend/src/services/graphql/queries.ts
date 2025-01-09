// src/services/graphql/queries.ts

import { gql } from '@apollo/client';

// Fragment for common user fields
const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    username
    email
    name
    avatarUrl
    createdAt
    lastActivityOn
  }
`;

// Fragment for common project fields
const PROJECT_FRAGMENT = gql`
  fragment ProjectFields on Project {
    id
    name
    description
    visibility
    createdAt
    lastActivityAt
    webUrl
    statistics {
      commitCount
      storageSize
      repositorySize
      lfsObjectsSize
      jobArtifactsSize
    }
  }
`;

// Query to get current user
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      ...UserFields
      groups {
        edges {
          node {
            id
            name
            fullPath
          }
        }
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Query to get user by ID
export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      ...UserFields
      status {
        emoji
        message
      }
      projects {
        edges {
          node {
            ...ProjectFields
          }
        }
      }
    }
  }
  ${USER_FRAGMENT}
  ${PROJECT_FRAGMENT}
`;

// Query to get projects
export const GET_PROJECTS = gql`
  query GetProjects($first: Int, $after: String, $search: String) {
    projects(first: $first, after: $after, search: $search) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...ProjectFields
          group {
            id
            name
            fullPath
          }
          repository {
            rootRef
          }
        }
      }
    }
  }
  ${PROJECT_FRAGMENT}
`;

// Query to get project details
export const GET_PROJECT_DETAILS = gql`
  query GetProjectDetails($fullPath: ID!) {
    project(fullPath: $fullPath) {
      ...ProjectFields
      group {
        id
        name
        fullPath
      }
      repository {
        rootRef
        tree {
          lastCommit {
            id
            shortId
            title
            authorName
            authoredDate
          }
        }
      }
      issues {
        count
      }
      mergeRequests {
        count
      }
      pipelines {
        count
      }
    }
  }
  ${PROJECT_FRAGMENT}
`;

// Query to get commit history
export const GET_COMMIT_HISTORY = gql`
  query GetCommitHistory($projectPath: ID!, $ref: String!, $first: Int!, $after: String) {
    project(fullPath: $projectPath) {
      id
      repository {
        commits(ref: $ref, first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              shortId
              title
              message
              authorName
              authoredDate
              webUrl
            }
          }
        }
      }
    }
  }
`;

// Query to get merge requests
export const GET_MERGE_REQUESTS = gql`
  query GetMergeRequests($projectPath: ID!, $state: MergeRequestState, $first: Int!, $after: String) {
    project(fullPath: $projectPath) {
      id
      mergeRequests(state: $state, first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            iid
            title
            description
            state
            createdAt
            updatedAt
            mergedAt
            closedAt
            webUrl
            author {
              ...UserFields
            }
            assignees {
              edges {
                node {
                  ...UserFields
                }
              }
            }
            labels {
              edges {
                node {
                  id
                  title
                  color
                }
              }
            }
          }
        }
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Query to get issues
export const GET_ISSUES = gql`
  query GetIssues($projectPath: ID!, $state: IssuableState, $first: Int!, $after: String) {
    project(fullPath: $projectPath) {
      id
      issues(state: $state, first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            iid
            title
            description
            state
            createdAt
            updatedAt
            closedAt
            webUrl
            author {
              ...UserFields
            }
            assignees {
              edges {
                node {
                  ...UserFields
                }
              }
            }
            labels {
              edges {
                node {
                  id
                  title
                  color
                }
              }
            }
          }
        }
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Query to get pipeline details
export const GET_PIPELINE_DETAILS = gql`
  query GetPipelineDetails($projectPath: ID!, $iid: ID!) {
    project(fullPath: $projectPath) {
      id
      pipeline(iid: $iid) {
        id
        iid
        status
        createdAt
        updatedAt
        startedAt
        finishedAt
        duration
        user {
          ...UserFields
        }
        stages {
          edges {
            node {
              id
              name
              status
              jobs {
                edges {
                  node {
                    id
                    name
                    status
                    startedAt
                    finishedAt
                    duration
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Query to get project analytics
export const GET_PROJECT_ANALYTICS = gql`
  query GetProjectAnalytics($fullPath: ID!, $startDate: Time!, $endDate: Time!) {
    project(fullPath: $fullPath) {
      id
      analytics {
        issueAnalytics(startDate: $startDate, endDate: $endDate) {
          count
          openCount
          closedCount
        }
        mergeRequestAnalytics(startDate: $startDate, endDate: $endDate) {
          count
          mergedCount
          closedCount
        }
        commitAnalytics(startDate: $startDate, endDate: $endDate) {
          count
          authorCount
        }
        pipelineAnalytics(startDate: $startDate, endDate: $endDate) {
          count
          successCount
          failedCount
        }
      }
    }
  }
`;

export const queries = {
  GET_CURRENT_USER,
  GET_USER_BY_ID,
  GET_PROJECTS,
  GET_PROJECT_DETAILS,
  GET_COMMIT_HISTORY,
  GET_MERGE_REQUESTS,
  GET_ISSUES,
  GET_PIPELINE_DETAILS,
  GET_PROJECT_ANALYTICS,
};
