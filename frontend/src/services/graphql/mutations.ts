// src/services/graphql/mutations.ts

import { gql } from '@apollo/client';

// Fragment for common project fields (reused from queries if needed)
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

// Mutation to create a new project
export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      project {
        ...ProjectFields
      }
      errors
    }
  }
  ${PROJECT_FRAGMENT}
`;

// Mutation to update a project
export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ProjectID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      project {
        ...ProjectFields
      }
      errors
    }
  }
  ${PROJECT_FRAGMENT}
`;

// Mutation to delete a project
export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ProjectID!) {
    destroyProject(id: $id) {
      project {
        id
      }
      errors
    }
  }
`;

// Mutation to create a new merge request
export const CREATE_MERGE_REQUEST = gql`
  mutation CreateMergeRequest($input: CreateMergeRequestInput!) {
    createMergeRequest(input: $input) {
      mergeRequest {
        id
        iid
        title
        description
        state
        createdAt
        mergeStatus
        webUrl
        author {
          id
          name
          username
        }
        targetBranch
        sourceBranch
      }
      errors
    }
  }
`;

// Mutation to update a merge request
export const UPDATE_MERGE_REQUEST = gql`
  mutation UpdateMergeRequest($projectPath: ID!, $iid: String!, $input: MergeRequestUpdateInput!) {
    mergeRequestUpdate(projectPath: $projectPath, iid: $iid, input: $input) {
      mergeRequest {
        id
        iid
        title
        description
        state
        updatedAt
      }
      errors
    }
  }
`;

// Mutation to create a new issue
export const CREATE_ISSUE = gql`
  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      issue {
        id
        iid
        title
        description
        state
        createdAt
        author {
          id
          name
          username
        }
      }
      errors
    }
  }
`;

// Mutation to update an issue
export const UPDATE_ISSUE = gql`
  mutation UpdateIssue($projectPath: ID!, $iid: String!, $input: UpdateIssueInput!) {
    updateIssue(projectPath: $projectPath, iid: $iid, input: $input) {
      issue {
        id
        iid
        title
        description
        state
        updatedAt
      }
      errors
    }
  }
`;

// Mutation to add a comment to an issue
export const ADD_ISSUE_COMMENT = gql`
  mutation AddIssueComment($input: AddNoteInput!) {
    createNote(input: $input) {
      note {
        id
        body
        createdAt
        author {
          id
          name
          username
        }
      }
      errors
    }
  }
`;

// Mutation to set user status
export const SET_USER_STATUS = gql`
  mutation SetUserStatus($emoji: String!, $message: String) {
    updateUserStatus(emoji: $emoji, message: $message) {
      status {
        emoji
        message
        updatedAt
      }
      errors
    }
  }
`;

// Mutation to create a new branch
export const CREATE_BRANCH = gql`
  mutation CreateBranch($projectPath: ID!, $name: String!, $ref: String!) {
    createBranch(projectPath: $projectPath, name: $name, ref: $ref) {
      branch {
        name
        commit {
          id
          shortId
          title
        }
      }
      errors
    }
  }
`;

// Mutation to delete a branch
export const DELETE_BRANCH = gql`
  mutation DeleteBranch($projectPath: ID!, $name: String!) {
    deleteBranch(projectPath: $projectPath, name: $name) {
      branch {
        name
      }
      errors
    }
  }
`;

// Mutation to create a new tag
export const CREATE_TAG = gql`
  mutation CreateTag($projectPath: ID!, $name: String!, $ref: String!, $message: String) {
    createTag(projectPath: $projectPath, name: $name, ref: $ref, message: $message) {
      tag {
        name
        message
        target {
          ... on Commit {
            id
            shortId
            title
          }
        }
      }
      errors
    }
  }
`;

// Mutation to run a pipeline
export const RUN_PIPELINE = gql`
  mutation RunPipeline($projectPath: ID!, $ref: String!) {
    createPipeline(input: { projectPath: $projectPath, ref: $ref }) {
      pipeline {
        id
        iid
        status
        createdAt
        user {
          id
          name
          username
        }
      }
      errors
    }
  }
`;

export const mutations = {
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  CREATE_MERGE_REQUEST,
  UPDATE_MERGE_REQUEST,
  CREATE_ISSUE,
  UPDATE_ISSUE,
  ADD_ISSUE_COMMENT,
  SET_USER_STATUS,
  CREATE_BRANCH,
  DELETE_BRANCH,
  CREATE_TAG,
  RUN_PIPELINE,
};
