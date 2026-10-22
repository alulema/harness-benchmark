import { useMemo } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HarnessRunSummary } from '../../types/benchmark';
import { ACCENT, GRID, MUTED } from './chart-utils';

export default function ExecutionMetricsChart({ runs }: { runs: HarnessRunSummary[] }) {
  const data = useMemo(() => ['parallel', 'sequential'].map((mode) => {
    const group = runs.filter((run) => run.mode === mode);
    const costs = group.flatMap((run) => run.costUsd === null ? [] : [run.costUsd]);
    const latencies = group.flatMap((run) => run.latencyMs === null ? [] : [run.latencyMs]);
    return {
      mode,
      cost: costs.length ? costs.reduce((sum, value) => sum + value, 0) / costs.length : null,
      latency: latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null,
    };
  }).filter((item) => item.cost !== null || item.latency !== null), [runs]);

  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <div className="mb-4"><h2 className="text-sm font-semibold">Execution cost &amp; latency</h2><p className="muted mt-1 text-[11px]">Mean run cost and duration by execution mode</p></div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={255}>
          <ComposedChart data={data} margin={{ top: 4, right: 2, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="mode" tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="cost" tickFormatter={(value: number) => `$${value.toFixed(2)}`} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="latency" orientation="right" tickFormatter={(value: number) => `${Math.round(value / 1000)}s`} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><p className="mb-1 font-medium capitalize">{payload[0].payload.mode}</p>{payload.map((item) => <p className="muted" key={String(item.dataKey)}>{item.name}: {item.dataKey === 'cost' ? `$${Number(item.value).toFixed(3)}` : `${(Number(item.value) / 1000).toFixed(1)}s`}</p>)}</div> : null} />
            <Legend wrapperStyle={{ fontSize: 10, color: MUTED }} />
            <Bar yAxisId="cost" dataKey="cost" name="Cost / run" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={34} />
            <Line yAxisId="latency" dataKey="latency" name="Latency" stroke="#61cdbb" strokeWidth={2.5} activeDot={{ r: 4 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      ) : <div className="muted grid h-[255px] place-items-center text-sm">No cost or latency data in this view.</div>}
    </article>
  );
}
