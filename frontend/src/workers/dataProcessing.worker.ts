// src/workers/dataProcessing.worker.ts

import { expose } from 'comlink';

interface DataProcessingFunctions {
  processLargeDataset: (data: any[]) => Promise<any[]>;
  calculateStatistics: (data: number[]) => Promise<{ mean: number; median: number; stdDev: number }>;
  performComplexCalculation: (input: number) => Promise<number>;
}

const dataProcessingFunctions: DataProcessingFunctions = {
  async processLargeDataset(data: any[]): Promise<any[]> {
    // Simulate a time-consuming operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    return data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));
  },

  async calculateStatistics(data: number[]): Promise<{ mean: number; median: number; stdDev: number }> {
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;

    const sortedData = [...data].sort((a, b) => a - b);
    const median = sortedData[Math.floor(sortedData.length / 2)];

    const squareDiffs = data.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / data.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return { mean, median, stdDev };
  },

  async performComplexCalculation(input: number): Promise<number> {
    // Simulate a complex calculation
    let result = input;
    for (let i = 0; i < 1000000; i++) {
      result = Math.sin(result) * Math.cos(result);
    }
    return result;
  }
};

expose(dataProcessingFunctions);
