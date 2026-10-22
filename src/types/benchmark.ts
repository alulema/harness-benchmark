export type BenchmarkType = 'LAB' | 'JobBench' | 'WorkBuddy';
export type HarnessMode = 'parallel' | 'sequential';

export interface HarnessRunSummary {
  runId: string;
  benchmark: BenchmarkType;
  model: string;
  mode: HarnessMode;
  maxK: number;
  baseScore: number;
  finalScore: number;
  improvementDelta: number;
  costUsd: number | null;
  latencyMs: number | null;
  convergedAtIteration: number | null;
  adoptedComponents: {
    systemPrompt: number;
    memory: number;
    toolGuidance: number;
  };
  scoreHistory: number[];
}

export interface BenchmarkAggregateData {
  totalRuns: number;
  avgImprovement: number;
  generatedAt: string;
  dataSource: 'measured' | 'illustrative';
  runs: HarnessRunSummary[];
}

export interface BenchmarkFilters {
  benchmark: 'all' | BenchmarkType;
  mode: 'all' | HarnessMode;
  model: 'all' | string;
  maxK: 'all' | number;
}
