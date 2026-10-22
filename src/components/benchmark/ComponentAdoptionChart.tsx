import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HarnessRunSummary } from '../../types/benchmark';
import { ACCENT, GRID, MUTED, percent } from './chart-utils';

export default function ComponentAdoptionChart({ runs }: { runs: HarnessRunSummary[] }) {
  const data = useMemo(() => {
    const labels = [
      ['System prompt', 'systemPrompt'],
      ['Memory', 'memory'],
      ['Tool guidance', 'toolGuidance'],
    ] as const;
    return labels.map(([name, key]) => ({
      name,
      rate: runs.length ? runs.reduce((sum, run) => sum + run.adoptedComponents[key], 0) / runs.length : 0,
    }));
  }, [runs]);

  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <div className="mb-4"><h2 className="text-sm font-semibold">Component adoption</h2><p className="muted mt-1 text-[11px]">Average accepted changes by harness component</p></div>
      {runs.length ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 5" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><strong>{percent(Number(payload[0].value))}</strong><p className="muted mt-1">{payload[0].payload.name}</p></div> : null} />
            <Bar dataKey="rate" fill={ACCENT} radius={[0, 5, 5, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      ) : <div className="muted grid h-[250px] place-items-center text-sm">No runs match these filters.</div>}
    </article>
  );
}
