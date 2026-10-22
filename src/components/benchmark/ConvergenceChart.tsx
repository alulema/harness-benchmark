import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HarnessRunSummary } from '../../types/benchmark';
import { ACCENT, GRID, MUTED, percent } from './chart-utils';

export default function ConvergenceChart({ runs }: { runs: HarnessRunSummary[] }) {
  const data = useMemo(() => {
    const maxLength = Math.max(0, ...runs.map((run) => run.scoreHistory.length));
    return Array.from({ length: maxLength }, (_, index) => {
      const scores = runs.flatMap((run) => {
        const score = run.scoreHistory[index] ?? run.scoreHistory.at(-1);
        return score === undefined ? [] : [score];
      });
      return { k: index, score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0 };
    });
  }, [runs]);

  return (
    <article className="panel min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><h2 className="text-sm font-semibold">Score convergence</h2><p className="muted mt-1 text-[11px]">Mean accuracy over optimization iterations</p></div>
        <span className="eyebrow">k = 0 → K</span>
      </div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
            <defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} /><stop offset="95%" stopColor={ACCENT} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="k" tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="chart-tooltip"><p className="muted mb-1">Iteration k = {label}</p><strong>{percent(Number(payload[0].value))}</strong></div> : null} />
            <Area type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2.5} fill="url(#scoreFill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : <div className="muted grid h-[250px] place-items-center text-sm">No score history in this view.</div>}
    </article>
  );
}
