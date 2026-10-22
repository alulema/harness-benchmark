import { Filter, RotateCcw } from 'lucide-react';
import type { BenchmarkFilters, BenchmarkType, HarnessMode, HarnessRunSummary } from '../../types/benchmark';

interface Props {
  runs: HarnessRunSummary[];
  filters: BenchmarkFilters;
  onChange: (filters: BenchmarkFilters) => void;
}

const benchmarks: BenchmarkType[] = ['LAB', 'JobBench', 'WorkBuddy'];
const modes: HarnessMode[] = ['parallel', 'sequential'];

export default function FilterToolbar({ runs, filters, onChange }: Props) {
  const models = [...new Set(runs.map((run) => run.model))].sort();
  const budgets = [...new Set(runs.map((run) => run.maxK))].sort((a, b) => a - b);
  const update = <K extends keyof BenchmarkFilters>(key: K, value: BenchmarkFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[auto_repeat(4,minmax(130px,1fr))] lg:items-end">
      <div className="hidden items-center gap-2 pb-3 lg:flex">
        <Filter size={14} className="accent-text" />
        <span className="eyebrow">Filters</span>
      </div>
      <label className="eyebrow flex flex-col gap-2">
        Benchmark
        <select className="field-control" value={filters.benchmark} onChange={(event) => update('benchmark', event.target.value as BenchmarkFilters['benchmark'])}>
          <option value="all">All benchmarks</option>
          {benchmarks.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="eyebrow flex flex-col gap-2">
        Execution
        <select className="field-control" value={filters.mode} onChange={(event) => update('mode', event.target.value as BenchmarkFilters['mode'])}>
          <option value="all">All modes</option>
          {modes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="eyebrow flex flex-col gap-2">
        Model
        <select className="field-control" value={filters.model} onChange={(event) => update('model', event.target.value)}>
          <option value="all">All models</option>
          {models.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="eyebrow flex flex-col gap-2">
        Budget · k
        <select className="field-control" value={filters.maxK} onChange={(event) => update('maxK', event.target.value === 'all' ? 'all' : Number(event.target.value))}>
          <option value="all">Any budget</option>
          {budgets.map((item) => <option key={item} value={item}>k = {item}</option>)}
        </select>
      </label>
      <button className="button-secondary sm:col-span-2 lg:col-span-1" onClick={() => onChange({ benchmark: 'all', mode: 'all', model: 'all', maxK: 'all' })} type="button">
        <RotateCcw size={13} />Reset
      </button>
    </section>
  );
}
