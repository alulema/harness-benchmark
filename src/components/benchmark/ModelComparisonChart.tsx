import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HarnessRunSummary } from '../../types/benchmark';
import { ACCENT, GRID, MUTED, percent } from './chart-utils';

export default function ModelComparisonChart({ runs }: { runs: HarnessRunSummary[] }) {
  const data = useMemo(() => {
    const models = [...new Set(runs.map((run) => run.model))].sort();
    return models.map((model, index) => {
      const group = runs.filter((run) => run.model === model);
      return {
        model,
        baseline: group.reduce((sum, run) => sum + run.baseScore, 0) / group.length,
        optimized: group.reduce((sum, run) => sum + run.finalScore, 0) / group.length,
        color: index % 2 ? '#61cdbb' : ACCENT,
      };
    });
  }, [runs]);

  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <div className="mb-4"><h2 className="text-sm font-semibold">Model comparison</h2><p className="muted mt-1 text-[11px]">Baseline vs. Harness² optimized score</p></div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={255}>
          <BarChart data={data} margin={{ top: 4, right: 6, left: -18, bottom: 0 }} barGap={5}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="model" tick={{ fill: MUTED, fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><p className="mb-1 font-medium">{payload[0].payload.model}</p>{payload.map((item) => <p className="muted" key={String(item.dataKey)}>{item.name}: {percent(Number(item.value))}</p>)}</div> : null} />
            <Legend wrapperStyle={{ fontSize: 10, color: MUTED }} />
            <Bar dataKey="baseline" name="Baseline" fill="var(--color-border, #45434e)" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="optimized" name="Optimized" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      ) : <div className="muted grid h-[255px] place-items-center text-sm">No model data in this view.</div>}
    </article>
  );
}
