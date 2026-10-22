import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, BarChart3, Database, Sparkles } from 'lucide-react';
import exampleData from '../../data/benchmark_summary.json';
import type { BenchmarkAggregateData, BenchmarkFilters } from '../../types/benchmark';
import ComponentAdoptionChart from './ComponentAdoptionChart';
import ConvergenceChart from './ConvergenceChart';
import ExecutionMetricsChart from './ExecutionMetricsChart';
import FilterToolbar from './FilterToolbar';
import KpiSummaryCards from './KpiSummaryCards';
import ModelComparisonChart from './ModelComparisonChart';
import RunDetailsTable from './RunDetailsTable';

const initialFilters: BenchmarkFilters = { benchmark: 'all', mode: 'all', model: 'all', maxK: 'all' };

export default function BenchmarkDashboard() {
  const [data, setData] = useState<BenchmarkAggregateData>(exampleData as BenchmarkAggregateData);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/data/benchmark_summary.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Dashboard data request failed (${response.status})`);
        return response.json() as Promise<BenchmarkAggregateData>;
      })
      .then((summary) => {
        if (active) setData(summary);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Dashboard data could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  const [filters, setFilters] = useState(initialFilters);
  const runs = useMemo(() => data.runs.filter((run) =>
    (filters.benchmark === 'all' || run.benchmark === filters.benchmark)
    && (filters.mode === 'all' || run.mode === filters.mode)
    && (filters.model === 'all' || run.model === filters.model)
    && (filters.maxK === 'all' || run.maxK === filters.maxK),
  ), [data.runs, filters]);

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 pb-14 pt-6 sm:px-7 sm:pt-9 lg:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--demo-border)] pb-5">
        <a className="flex items-center gap-3 no-underline" href="/">
          <span className="brand-mark">H²</span>
          <span><span className="block text-sm font-semibold">Harness²</span><span className="muted block text-[10px] tracking-wide">BENCHMARK ANALYSIS</span></span>
        </a>
        <div className="flex items-center gap-2">
          <span className="status-pill"><span className="live-dot" />Analysis ready</span>
          <a className="button-secondary" href="https://github.com/alulema/harness-benchmark" target="_blank" rel="noreferrer">Source <ArrowUpRight size={12} /></a>
        </div>
      </header>

      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <span className="badge mb-4"><Sparkles size={12} />Evaluation insights</span>
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Measure the <span className="accent-gradient">harness effect.</span></h1>
          <p className="muted mt-3 max-w-2xl text-sm leading-6">Explore how Harness² optimization changes agent accuracy across Legal Analysis, JobBench, and WorkBuddy — by model, execution mode, and iteration budget.</p>
        </div>
        <button className="button-primary self-start lg:self-auto" onClick={() => window.location.assign('/data/benchmark_summary.csv')} type="button"><ArrowDownToLine size={14} />Download full dataset</button>
      </section>

      {data.dataSource === 'illustrative' && (
        <aside className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-3 text-xs text-amber-100/80">
          <Database className="mt-0.5 shrink-0 text-amber-200" size={15} />
          <p><strong className="text-amber-100">Illustrative preview data.</strong> These values are examples, not benchmark results. Run <code className="rounded bg-black/20 px-1.5 py-0.5">python scripts/parse_harness_runs.py</code> to replace them with measured runs.</p>
        </aside>
      )}
      {loadError && <p className="muted mb-4 text-xs" role="status">{loadError} Showing the bundled preview dataset.</p>}

      <FilterToolbar runs={data.runs} filters={filters} onChange={setFilters} />
      <KpiSummaryCards runs={runs} />

      <div className="mb-3 flex items-center gap-2"><BarChart3 className="accent-text" size={14} /><span className="eyebrow">Performance patterns</span><span className="muted ml-auto text-[10px]">{runs.length} runs in view</span></div>
      <section className="grid gap-4 xl:grid-cols-2">
        <ConvergenceChart runs={runs} />
        <ComponentAdoptionChart runs={runs} />
      </section>
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ModelComparisonChart runs={runs} />
        <ExecutionMetricsChart runs={runs} />
      </section>
      <RunDetailsTable runs={runs} />
      <footer className="muted mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--demo-border)] pt-5 text-[10px] sm:flex-row">
        <p>{data.totalRuns} total runs · Updated {new Date(data.generatedAt).toISOString().slice(0, 10)}</p>
        <a className="transition hover:text-[var(--color-text,#fff)]" href="https://github.com/alulema/harness-benchmark/blob/main/docs/HARNESS2_BENCHMARK_DASHBOARD_SPEC.md" target="_blank" rel="noreferrer">Dashboard methodology <ArrowUpRight className="inline" size={11} /></a>
      </footer>
    </main>
  );
}
