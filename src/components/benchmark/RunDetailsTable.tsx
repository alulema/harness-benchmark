import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import type { HarnessRunSummary } from '../../types/benchmark';
import { percentagePoints, percent } from './chart-utils';

const PAGE_SIZE = 6;

function exportCsv(runs: HarnessRunSummary[]) {
  const headers = ['runId', 'benchmark', 'model', 'mode', 'maxK', 'baseScore', 'finalScore', 'improvementDelta', 'costUsd', 'latencyMs', 'convergedAtIteration', 'systemPromptAdoption', 'memoryAdoption', 'toolGuidanceAdoption'];
  const records = runs.map((run) => [
    run.runId, run.benchmark, run.model, run.mode, run.maxK, run.baseScore, run.finalScore,
    run.improvementDelta, run.costUsd ?? '', run.latencyMs ?? '', run.convergedAtIteration ?? '', run.adoptedComponents.systemPrompt,
    run.adoptedComponents.memory, run.adoptedComponents.toolGuidance,
  ]);
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const content = [headers, ...records].map((row) => row.map(quote).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'harness2-benchmark-runs.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function RunDetailsTable({ runs }: { runs: HarnessRunSummary[] }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return runs;
    return runs.filter((run) => [run.runId, run.benchmark, run.model, run.mode].some((value) => value.toLowerCase().includes(normalized)));
  }, [query, runs]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRuns = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <section className="panel mt-5 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--demo-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold">Evaluation runs</h2><p className="muted mt-1 text-[11px]">{filtered.length} runs · click a row to inspect scores</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <Search className="muted absolute left-3 top-1/2 -translate-y-1/2" size={14} />
            <input aria-label="Search runs" className="field-control min-w-[190px] pl-9" onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search runs…" value={query} />
          </label>
          <button className="button-secondary" disabled={!filtered.length} onClick={() => exportCsv(filtered)} type="button"><Download size={14} />Export CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
          <thead className="eyebrow">
            <tr>{['Run ID', 'Benchmark', 'Model', 'Mode', 'Budget', 'Baseline', 'Final', 'Delta', ''].map((label) => <th className="px-4 py-3 font-semibold" key={label}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {pageRuns.map((run) => (
              <Fragment key={run.runId}>
                <tr className="cursor-pointer border-t border-[var(--demo-border)] transition hover:bg-white/[.025]" key={run.runId} onClick={() => setExpandedId(expandedId === run.runId ? null : run.runId)}>
                  <td className="px-4 py-3 font-mono text-[10px]">{run.runId}</td>
                  <td className="px-4 py-3">{run.benchmark}</td>
                  <td className="px-4 py-3">{run.model}</td>
                  <td className="px-4 py-3 capitalize">{run.mode}</td>
                  <td className="px-4 py-3">k = {run.maxK}</td>
                  <td className="px-4 py-3">{percent(run.baseScore)}</td>
                  <td className="px-4 py-3">{percent(run.finalScore)}</td>
                  <td className="positive-text px-4 py-3 font-semibold">{percentagePoints(run.improvementDelta)}</td>
                  <td className="px-4 py-3">{expandedId === run.runId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                </tr>
                {expandedId === run.runId && (
                  <tr className="border-t border-[var(--demo-border)] bg-black/10" key={`${run.runId}-details`}>
                    <td className="px-4 py-3" colSpan={9}>
                      <div className="grid gap-3 text-[10px] sm:grid-cols-2">
                        <div><p className="eyebrow mb-2">Score history · k 0–{run.maxK}</p><p className="font-mono">{run.scoreHistory.map(percent).join(' → ')}</p></div>
                        <div><p className="eyebrow mb-2">Adopted components</p><p>Prompt {percent(run.adoptedComponents.systemPrompt)} · Memory {percent(run.adoptedComponents.memory)} · Tools {percent(run.adoptedComponents.toolGuidance)}</p></div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!pageRuns.length && <tr><td className="muted px-4 py-10 text-center" colSpan={9}>No runs match your search.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--demo-border)] px-4 py-3">
        <span className="muted text-[10px]">Page {currentPage + 1} of {pageCount}</span>
        <div className="flex gap-2">
          <button className="button-secondary min-h-8" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} type="button">Previous</button>
          <button className="button-secondary min-h-8" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} type="button">Next</button>
        </div>
      </div>
    </section>
  );
}
