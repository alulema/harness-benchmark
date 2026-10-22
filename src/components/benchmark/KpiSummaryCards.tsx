import { Activity, ArrowUpRight, Layers3, TrendingUp } from 'lucide-react';
import type { HarnessRunSummary } from '../../types/benchmark';
import { percentagePoints, percent } from './chart-utils';

interface Props {
  runs: HarnessRunSummary[];
}

export default function KpiSummaryCards({ runs }: Props) {
  const averageImprovement = runs.length
    ? runs.reduce((sum, run) => sum + run.improvementDelta, 0) / runs.length
    : 0;
  const averageConvergence = runs.filter((run) => run.convergedAtIteration !== null);
  const convergence = averageConvergence.length
    ? averageConvergence.reduce((sum, run) => sum + (run.convergedAtIteration ?? 0), 0) / averageConvergence.length
    : null;
  const adoption = [
    { label: 'System prompt', total: runs.reduce((sum, run) => sum + run.adoptedComponents.systemPrompt, 0) },
    { label: 'Memory guardrails', total: runs.reduce((sum, run) => sum + run.adoptedComponents.memory, 0) },
    { label: 'Tool guidance', total: runs.reduce((sum, run) => sum + run.adoptedComponents.toolGuidance, 0) },
  ].sort((a, b) => b.total - a.total);
  const topAdoption = runs.length ? adoption[0] : null;
  const costs = runs.flatMap((run) => run.costUsd === null ? [] : [run.costUsd]);
  const latencies = runs.flatMap((run) => run.latencyMs === null ? [] : [run.latencyMs]);
  const cards = [
    { label: 'Average improvement', value: runs.length ? percentagePoints(averageImprovement) : '—', detail: 'Final score vs. baseline', Icon: TrendingUp, positive: true },
    { label: 'Runs in view', value: String(runs.length), detail: 'Matching current filters', Icon: Activity },
    { label: 'Top adopted component', value: topAdoption?.label ?? '—', detail: topAdoption ? `${percent(topAdoption.total / runs.length)} average adoption` : 'No component data', Icon: Layers3 },
    { label: 'Avg. convergence', value: convergence === null ? '—' : `k = ${convergence.toFixed(1)}`, detail: `${averageConvergence.length} runs with convergence data`, Icon: ArrowUpRight },
    { label: 'Average cost', value: costs.length ? `$${(costs.reduce((sum, cost) => sum + cost, 0) / costs.length).toFixed(3)}` : '—', detail: `${costs.length} runs with cost data`, Icon: Activity },
    { label: 'Average latency', value: latencies.length ? `${(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length / 1000).toFixed(2)}s` : '—', detail: `${latencies.length} runs with latency data`, Icon: TrendingUp },
  ];

  return (
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Summary metrics">
      {cards.map(({ label, value, detail, Icon, positive }) => (
        <article className="panel flex min-h-[138px] flex-col justify-between p-4" key={label}>
          <div className="flex items-center justify-between">
            <span className="eyebrow">{label}</span>
            <span className="icon-chip"><Icon size={15} /></span>
          </div>
          <div>
            <p className={`mb-1 text-2xl font-semibold tracking-tight ${positive ? 'positive-text' : ''}`}>{value}</p>
            <p className="muted text-[11px]">{detail}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
