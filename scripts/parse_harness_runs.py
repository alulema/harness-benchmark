#!/usr/bin/env python3
"""Parse Harness² run summaries into dashboard JSON and CSV artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator


class AdoptedComponents(BaseModel):
    system_prompt: float = Field(alias="systemPrompt", ge=0, le=1)
    memory: float = Field(ge=0, le=1)
    tool_guidance: float = Field(alias="toolGuidance", ge=0, le=1)

    model_config = ConfigDict(populate_by_name=True)


class HarnessRunSummary(BaseModel):
    run_id: str = Field(alias="runId", min_length=1)
    benchmark: str
    model: str
    mode: str
    max_k: int = Field(alias="maxK", ge=0)
    base_score: float = Field(alias="baseScore", ge=0, le=1)
    final_score: float = Field(alias="finalScore", ge=0, le=1)
    improvement_delta: float = Field(alias="improvementDelta")
    cost_usd: float | None = Field(alias="costUsd", default=None, ge=0)
    latency_ms: float | None = Field(alias="latencyMs", default=None, ge=0)
    converged_at_iteration: int | None = Field(alias="convergedAtIteration", default=None, ge=0)
    adopted_components: AdoptedComponents = Field(alias="adoptedComponents")
    score_history: list[float] = Field(alias="scoreHistory", min_length=1)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("benchmark", "model", "mode")
    @classmethod
    def non_empty_label(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value.strip()


class BenchmarkAggregateData(BaseModel):
    total_runs: int = Field(alias="totalRuns", ge=0)
    avg_improvement: float = Field(alias="avgImprovement")
    runs: list[HarnessRunSummary]
    generated_at: str = Field(alias="generatedAt")
    data_source: str = Field(alias="dataSource", default="measured")

    model_config = ConfigDict(populate_by_name=True)


ALIASES: dict[str, tuple[str, ...]] = {
    "run_id": ("runId", "run_id", "id", "taskId", "task_id"),
    "benchmark": ("benchmark", "suite", "domain"),
    "model": ("model", "modelName", "model_name"),
    "mode": ("mode", "executionMode", "execution_mode"),
    "max_k": ("maxK", "max_k", "maxIterations", "max_iterations"),
    "base_score": ("baseScore", "base_score", "initialScore", "initial_score"),
    "final_score": ("finalScore", "final_score", "optimizedScore", "optimized_score"),
    "cost_usd": ("costUsd", "cost_usd", "executionCost", "execution_cost", "cost"),
    "latency_ms": ("latencyMs", "latency_ms", "durationMs", "duration_ms"),
    "score_history": ("scoreHistory", "score_history", "scores", "iterationScores"),
    "converged_at": ("convergedAtIteration", "converged_at_iteration", "convergenceIteration"),
    "adopted_components": ("adoptedComponents", "adopted_components", "componentAdoption"),
}

COMPONENT_ALIASES = {
    "systemPrompt": ("systemPrompt", "system_prompt", "system prompt", "prompt"),
    "memory": ("memory", "memoryGuardrails", "memory_guardrails", "guardrails"),
    "toolGuidance": ("toolGuidance", "tool_guidance", "tool guidance", "tools"),
}


def _candidate_mappings(value: dict[str, Any]) -> list[dict[str, Any]]:
    candidates = [value]
    for key in ("metadata", "config", "summary", "result", "metrics"):
        nested = value.get(key)
        if isinstance(nested, dict):
            candidates.append(nested)
    return candidates


def _find_value(candidates: list[dict[str, Any]], names: tuple[str, ...]) -> Any:
    for candidate in candidates:
        for name in names:
            if name in candidate and candidate[name] is not None:
                return candidate[name]
    return None


def _normalize_score(value: Any, label: str) -> float:
    score = float(value)
    if 1 < score <= 100:
        score /= 100
    if not 0 <= score <= 1:
        raise ValueError(f"{label} must be between 0 and 1, or 0 and 100")
    return score


def _score_history(value: Any) -> list[float]:
    if not isinstance(value, list):
        return []
    history = []
    for item in value:
        score = item.get("score") if isinstance(item, dict) else item
        if score is not None:
            history.append(_normalize_score(score, "scoreHistory item"))
    return history


def _component_rates(value: Any) -> dict[str, float]:
    if not isinstance(value, dict):
        return {}
    rates: dict[str, float] = {}
    for output_name, accepted_names in COMPONENT_ALIASES.items():
        raw = next((value[name] for name in accepted_names if name in value), None)
        if raw is None:
            continue
        rate = float(raw)
        if 1 < rate <= 100:
            rate /= 100
        rates[output_name] = rate
    return rates


def parse_run(data: dict[str, Any], source: Path) -> HarnessRunSummary:
    candidates = _candidate_mappings(data)
    values = {
        key: _find_value(candidates, aliases)
        for key, aliases in ALIASES.items()
    }

    # Iteration traces commonly store one score per step instead of a scoreHistory array.
    if values["score_history"] is None:
        trace = data.get("trace", data.get("steps", data.get("iterations")))
        if isinstance(trace, list):
            ordered = sorted(
                (step for step in trace if isinstance(step, dict)),
                key=lambda step: step.get("k", step.get("iteration", 0)),
            )
            values["score_history"] = [
                step.get("score", step.get("accuracy"))
                for step in ordered
                if step.get("score", step.get("accuracy")) is not None
            ]
    history = _score_history(values["score_history"])

    base_score = values["base_score"]
    final_score = values["final_score"]
    if base_score is None and history:
        base_score = history[0]
    if final_score is None and history:
        final_score = history[-1]
    if not history and base_score is not None and final_score is not None:
        history = [
            _normalize_score(base_score, "baseScore"),
            _normalize_score(final_score, "finalScore"),
        ]
    if values["max_k"] is None:
        values["max_k"] = max(len(history) - 1, 0)

    adopted = _component_rates(values["adopted_components"])
    components = {
        name: adopted.get(name, 0.0)
        for name in ("systemPrompt", "memory", "toolGuidance")
    }
    try:
        return HarnessRunSummary.model_validate(
            {
                "runId": values["run_id"] or source.stem,
                "benchmark": values["benchmark"],
                "model": values["model"],
                "mode": values["mode"],
                "maxK": values["max_k"],
                "baseScore": _normalize_score(base_score, "baseScore"),
                "finalScore": _normalize_score(final_score, "finalScore"),
                "improvementDelta": _normalize_score(final_score, "finalScore")
                - _normalize_score(base_score, "baseScore"),
                "costUsd": values["cost_usd"],
                "latencyMs": values["latency_ms"],
                "convergedAtIteration": values["converged_at"],
                "adoptedComponents": components,
                "scoreHistory": history,
            }
        )
    except (ValidationError, TypeError, ValueError) as error:
        raise ValueError(f"{source}: {error}") from error


def runs_from_document(document: Any, source: Path) -> list[HarnessRunSummary]:
    if isinstance(document, list):
        records = document
    elif isinstance(document, dict):
        records = next(
            (
                document[key]
                for key in ("runs", "results", "evaluations")
                if isinstance(document.get(key), list)
            ),
            [document],
        )
    else:
        raise ValueError(f"{source}: expected a JSON object or array")
    if any(not isinstance(record, dict) for record in records):
        raise ValueError(f"{source}: each run entry must be a JSON object")
    return [
        parse_run(record, source)
        for record in records
    ]


def collect_runs(input_dir: Path) -> list[HarnessRunSummary]:
    files = sorted(input_dir.rglob("*.json"))
    runs: list[HarnessRunSummary] = []
    failures: list[str] = []
    for source in files:
        try:
            document = json.loads(source.read_text(encoding="utf-8"))
            runs.extend(runs_from_document(document, source))
        except (json.JSONDecodeError, OSError, ValueError) as error:
            failures.append(str(error))
    if failures:
        raise ValueError("\n".join(failures))
    return runs


def write_artifacts(runs: list[HarnessRunSummary], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    summary = BenchmarkAggregateData(
        totalRuns=len(runs),
        avgImprovement=(
            sum(run.improvement_delta for run in runs) / len(runs)
            if runs
            else 0.0
        ),
        runs=runs,
        generatedAt=datetime.now(UTC).isoformat(),
        dataSource="measured",
    )
    (output_dir / "benchmark_summary.json").write_text(
        summary.model_dump_json(by_alias=True, indent=2) + "\n",
        encoding="utf-8",
    )
    rows = []
    for run in runs:
        row = run.model_dump(by_alias=True)
        components = row.pop("adoptedComponents")
        row.update(
            {
                f"adopted_{key}": value
                for key, value in components.items()
            }
        )
        row["scoreHistory"] = json.dumps(row["scoreHistory"])
        rows.append(row)
    columns = [
        "runId",
        "benchmark",
        "model",
        "mode",
        "maxK",
        "baseScore",
        "finalScore",
        "improvementDelta",
        "costUsd",
        "latencyMs",
        "convergedAtIteration",
        "adopted_systemPrompt",
        "adopted_memory",
        "adopted_toolGuidance",
        "scoreHistory",
    ]
    pd.DataFrame(rows, columns=columns).to_csv(
        output_dir / "benchmark_summary.csv",
        index=False,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=Path("runs"))
    parser.add_argument("--output-dir", type=Path, default=Path("public/data"))
    args = parser.parse_args()

    try:
        runs = collect_runs(args.input_dir)
        write_artifacts(runs, args.output_dir)
    except ValueError as error:
        print(error, file=sys.stderr)
        return 1

    print(f"Wrote dashboard data for {len(runs)} run(s) to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
