import { useMemo, useState } from 'react';
import { ArrowUpRight, Database, EyeOff, FlaskConical } from 'lucide-react';
import rawStudy from '../../data/playground_agi_v2.json';
import type { PlaygroundStudy as StudyData } from '../../types/playground-study';

const study: StudyData = rawStudy;
const source = `https://github.com/alulema/harness-playground/blob/${study.revision}/docs/experiments/`;

function SourceLink({ file, children }: { file: string; children: string }) {
  return <a className="accent-text underline underline-offset-2" href={source + file} target="_blank" rel="noreferrer">{children} <ArrowUpRight className="inline" size={12} /></a>;
}

export default function PlaygroundStudy() {
  const [kind, setKind] = useState('all');
  const [taskId, setTaskId] = useState('all');
  const [reveal, setReveal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = useMemo(() => study.pairs.filter((pair) =>
    (kind === 'all' || pair.kind === kind) && (taskId === 'all' || pair.taskId === taskId),
  ), [kind, taskId]);
  const completed = study.pairs.flatMap((pair) => [pair.responses.base, pair.responses.candidate])
    .filter((response) => response.status === 'completed').length;
  const totalBase = study.manualControls.reduce((sum, item) => sum + item.baseCorrect, 0);
  const totalCandidate = study.manualControls.reduce((sum, item) => sum + item.candidateCorrect, 0);
  const totalControls = study.manualControls.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <section className="mb-6">
        <span className="badge mb-4"><FlaskConical size={12} />Recorded case study</span>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">From agent traces to <span className="accent-gradient">evidence.</span></h1>
        <p className="muted mt-3 max-w-3xl text-sm leading-6">Explore a local Ollama experiment from harness-playground. The records are real; the optimization loop is an educational implementation inspired by Harness², not the official framework.</p>
      </section>

      <aside className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-xs leading-5 text-amber-100/80">
        <Database className="mt-0.5 shrink-0 text-amber-200" size={15} />
        <p><strong className="text-amber-100">Exploratory evidence, not a benchmark claim.</strong> The qualitative human reviews are pending. The arithmetic controls were inspected manually in the source study, not scored automatically here. A small sample cannot establish a general effect.</p>
      </aside>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Study overview">
        {[
          ['Recorded pairs', String(study.pairs.length), `${study.tasks.length} tasks × ${study.repetitions} repetitions`],
          ['Completed streams', `${completed}/${study.pairs.length * 2}`, 'Completed does not mean untruncated'],
          ['Held-out model', 'Qwen 1.5B', 'Gemma excluded after development error'],
          ['Qualitative review', 'Pending', 'No claim of improvement'],
        ].map(([label, value, detail]) => <article className="panel p-4" key={label}>
          <p className="eyebrow">{label}</p><p className="mt-4 text-2xl font-semibold">{value}</p><p className="muted mt-2 text-xs">{detail}</p>
        </article>)}
      </section>

      <section className="panel mb-5 p-5">
        <h2 className="text-lg font-semibold">Arithmetic controls</h2>
        <p className="muted mt-2 text-xs leading-5">Manual inspection required both correct counts and a consistent calculation. The counts below are transcribed from the <SourceLink file="agi-v2-observations.md">execution record</SourceLink>; they are not qualitative scores.</p>
        <div className="overflow-x-auto">
          <table className="mt-4 w-full min-w-[380px] text-left text-sm">
            <thead className="eyebrow"><tr><th className="py-2">Task</th><th>Base correct</th><th>Candidate correct</th></tr></thead>
            <tbody>{study.manualControls.map((control) => <tr className="border-t border-[var(--demo-border)]" key={control.taskId}>
              <td className="py-3">{control.taskId === 'arithmetic-labs' ? 'Lab inspections' : 'Reports'}</td>
              <td>{control.baseCorrect}/{control.total}</td><td>{control.candidateCorrect}/{control.total}</td>
            </tr>)}
              <tr className="border-t border-[var(--demo-border)] font-semibold"><td className="py-3">Total</td><td>{totalBase}/{totalControls}</td><td>{totalCandidate}/{totalControls}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted mt-2 text-xs">These six observations per arm concern controls only, not the qualitative questions. One response had correct calculations but a cut-off final sentence; completion status alone cannot detect truncation.</p>
      </section>

      <section className="panel mb-5 p-5">
        <h2 className="text-lg font-semibold">Development and limits</h2>
        <p className="muted mt-2 text-xs leading-5">Qwen&apos;s two accepted instructions concern employment and were applied unchanged to different tasks. The same model proposed, answered and judged during development. The labels used for proposal categories did not create persistent memory or invoke tools.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {study.development.map((run) => <div className="rounded-lg border border-[var(--demo-border)] p-3 text-xs" key={run.model}>
            <p className="font-semibold">{run.model} · {run.status === 'completed' ? 'development completed' : 'development failed'}</p>
            {run.instructions.length > 0 && <ul className="muted mt-2 list-disc space-y-2 pl-4">{run.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul>}
            {run.errors.map((error) => <p className="muted mt-2" key={error}>{error}</p>)}
          </div>)}
        </div>
        <p className="muted mt-3 text-xs">Gemma&apos;s invalid judge JSON was a technical failure, not a rejected candidate; it was excluded from held-out comparisons. The judge was subsequently changed, so further runs are a separate study.</p>
      </section>

      <section className="panel mb-5 p-5">
        <h2 className="text-lg font-semibold">Compare recorded responses</h2>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/20 p-3 text-xs leading-5 text-amber-100/80">
          <EyeOff className="mt-0.5 shrink-0" size={15} />
          <p><strong>Not blinded.</strong> This view reveals which response is base or candidate. Independent reviewers should use the source study&apos;s separate blind packet and avoid this view and the raw records before completing their review.</p>
        </div>
        {!reveal ? <button className="button-secondary mt-4" type="button" onClick={() => setReveal(true)}>Reveal unblinded comparisons</button> : <>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="text-xs">Task type <select className="field-control ml-2" value={kind} onChange={(event) => { setKind(event.target.value); setTaskId('all'); }}>
              <option value="all">All</option><option value="qualitative">Qualitative</option><option value="control">Arithmetic controls</option>
            </select></label>
            <label className="text-xs">Task <select className="field-control ml-2" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
              <option value="all">All tasks</option>
              {study.tasks.filter((task) => kind === 'all' || task.kind === kind).map((task) => <option value={task.id} key={task.id}>{task.id}</option>)}
            </select></label>
          </div>
          <p className="muted mt-3 text-xs">{filtered.length} pairs · qualitative review pending · response text may be truncated</p>
          <div className="mt-3 space-y-2">
            {filtered.map((pair) => {
              const task = study.tasks.find((item) => item.id === pair.taskId);
              return <article className="rounded-lg border border-[var(--demo-border)]" key={pair.id}>
                <button className="flex w-full flex-wrap justify-between gap-2 p-3 text-left text-xs" type="button" aria-expanded={expanded === pair.id} onClick={() => setExpanded(expanded === pair.id ? null : pair.id)}>
                  <span className="font-semibold">{pair.taskId} · repetition {pair.repetition}</span><span className="muted">{pair.kind} · {expanded === pair.id ? 'Hide' : 'Inspect'}</span>
                </button>
                {expanded === pair.id && <div className="border-t border-[var(--demo-border)] p-4 text-xs leading-5">
                  <p><strong>Task:</strong> {task?.prompt}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">{(['base', 'candidate'] as const).map((arm) => <div className="rounded-lg bg-black/10 p-3" key={arm}>
                    <p className="eyebrow">{arm} · {pair.responses[arm].status}{pair.responses[arm].wallSeconds !== null ? ` · ${pair.responses[arm].wallSeconds}s` : ''}</p>
                    <p className="mt-2 whitespace-pre-wrap">{pair.responses[arm].text || 'No response text recorded.'}</p>
                  </div>)}</div>
                </div>}
              </article>;
            })}
          </div>
        </>}
      </section>

      <section className="panel p-5 text-xs leading-6">
        <h2 className="text-lg font-semibold">Provenance and methodology</h2>
        <p className="muted mt-2">Source snapshot: <code>{study.revision}</code>. Development recorded {study.recordedAt}; Ollama {study.ollamaVersion}. Qwen model digest: <code className="break-all">{study.modelDigest}</code>.</p>
        <p className="muted mt-2">Held-out arms used temperature 0.2 and a 160-token output limit; sampling seeds were not controlled. Recorded engine revision: <code>{study.engineRevision}</code>; engine SHA-256: <code className="break-all">{study.engineSha256}</code>. The source study records an additional engine patch; refer to its execution record for reconstruction. The protocol was not independently preregistered and the study authors could read the held-out tasks.</p>
        <p className="mt-3"><SourceLink file="agi-v2-protocol.md">Protocol</SourceLink> · <SourceLink file="agi-v2-observations.md">Execution record</SourceLink> · <SourceLink file="agi-v2-heldout-results.json">Raw held-out data (unblinded)</SourceLink> · <SourceLink file="agi-v2-development-results.json">Development record</SourceLink> · <SourceLink file="agi-v2-heldout-tasks.json">Tasks</SourceLink></p>
        <p className="muted mt-2">Responses are historical model outputs, not advice or verified claims. No inference is performed by this dashboard.</p>
      </section>
    </div>
  );
}
