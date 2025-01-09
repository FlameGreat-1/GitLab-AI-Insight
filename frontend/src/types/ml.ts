// src/types/ml.ts

export interface MLModel {
    id: string;
    name: string;
    description: string;
    type: MLModelType;
    status: MLModelStatus;
    createdAt: string;
    updatedAt: string;
    version: string;
    accuracy: number;
    parameters: Record<string, any>;
  }
  
  export type MLModelType = 'CLASSIFICATION' | 'REGRESSION' | 'CLUSTERING' | 'ANOMALY_DETECTION';
  
  export type MLModelStatus = 'TRAINING' | 'READY' | 'FAILED' | 'DEPRECATED';
  
  export interface MLPrediction {
    id: string;
    modelId: string;
    input: Record<string, any>;
    output: Record<string, any>;
    confidence: number;
    timestamp: string;
  }
  
  export interface MLMetric {
    name: string;
    value: number;
    unit?: string;
  }
  
  export interface MLModelPerformance {
    modelId: string;
    metrics: MLMetric[];
    confusionMatrix?: number[][];
    rocCurve?: [number, number][];
  }
  
  export interface MLFeature {
    name: string;
    type: 'NUMERIC' | 'CATEGORICAL' | 'BOOLEAN' | 'DATETIME';
    importance: number;
  }
  
  export interface MLDataset {
    id: string;
    name: string;
    description: string;
    features: MLFeature[];
    rowCount: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface MLTrainingJob {
    id: string;
    modelId: string;
    status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    progress: number;
    startTime: string;
    endTime?: string;
    error?: string;
  }
  
  export interface MLHyperparameter {
    name: string;
    type: 'NUMERIC' | 'CATEGORICAL' | 'BOOLEAN';
    range?: [number, number];
    options?: string[];
    value: any;
  }
  
  export interface MLExperiment {
    id: string;
    name: string;
    description: string;
    modelType: MLModelType;
    hyperparameters: MLHyperparameter[];
    bestModelId?: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface MLDeployment {
    id: string;
    modelId: string;
    environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
    status: 'DEPLOYING' | 'ACTIVE' | 'FAILED' | 'STOPPED';
    url: string;
    version: string;
    deployedAt: string;
    lastPingAt: string;
  }
  
  export interface MLAlert {
    id: string;
    modelId: string;
    type: 'PERFORMANCE_DEGRADATION' | 'DRIFT_DETECTED' | 'HIGH_ERROR_RATE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }
  