export interface PlaygroundStudy {
  studyId: string;
  revision: string;
  recordedAt: string;
  engineRevision: string;
  engineSha256: string;
  ollamaVersion: string;
  modelDigest: string;
  repetitions: number;
  tasks: { id: string; kind: string; prompt: string }[];
  pairs: {
    id: string;
    model: string;
    taskId: string;
    kind: string;
    repetition: number;
    responses: Record<'base' | 'candidate', { status: string; text: string; wallSeconds: number | null }>;
  }[];
  development: { model: string; status: string; instructions: string[]; errors: string[] }[];
  skipped: { model: string; reason: string }[];
  sourceChecksums: Record<string, string>;
  manualControls: { taskId: string; baseCorrect: number; candidateCorrect: number; total: number }[];
}
