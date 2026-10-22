import json
import csv
import tempfile
import unittest
from pathlib import Path

from scripts.parse_harness_runs import collect_runs, parse_run, write_artifacts


class ParseHarnessRunsTests(unittest.TestCase):
    def test_parses_summary_and_normalizes_percentage_scores(self):
        run = parse_run(
            {
                "runId": "run-1",
                "benchmark": "LAB",
                "model": "gemini-2.0-flash",
                "mode": "parallel",
                "maxK": 3,
                "baseScore": 70,
                "finalScore": 78,
                "costUsd": 0.08,
                "latencyMs": 2450,
                "convergedAtIteration": 2,
                "adoptedComponents": {
                    "systemPrompt": 65,
                    "memory": 0.25,
                    "toolGuidance": 10,
                },
                "scoreHistory": [70, 76, 78],
            },
            Path("run.json"),
        )
        self.assertAlmostEqual(run.improvement_delta, 0.08)
        self.assertEqual(run.score_history, [0.7, 0.76, 0.78])
        self.assertEqual(run.adopted_components.system_prompt, 0.65)
        self.assertEqual(run.max_k, 3)
        self.assertEqual(run.cost_usd, 0.08)
        self.assertEqual(run.latency_ms, 2450)

    def test_extracts_scores_from_iteration_trace(self):
        run = parse_run(
            {
                "id": "trace-1",
                "domain": "JobBench",
                "model": "claude-3-5-sonnet",
                "execution_mode": "sequential",
                "trace": [
                    {"iteration": 0, "score": 0.61},
                    {"iteration": 1, "score": 0.69},
                ],
                "adopted_components": {"prompt": 0.5},
            },
            Path("trace.json"),
        )
        self.assertEqual(run.score_history, [0.61, 0.69])
        self.assertEqual(run.base_score, 0.61)
        self.assertEqual(run.final_score, 0.69)
        self.assertEqual(run.max_k, 1)

    def test_writes_empty_and_populated_artifacts(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            input_dir = root / "runs"
            input_dir.mkdir()
            (input_dir / "run.json").write_text(
                json.dumps(
                    {
                        "runId": "run-1",
                        "benchmark": "WorkBuddy",
                        "model": "gemini-1.5-pro",
                        "mode": "parallel",
                        "baseScore": 0.4,
                        "finalScore": 0.6,
                        "costUsd": 0.023,
                        "latencyMs": 8900,
                        "adoptedComponents": {},
                    }
                ),
                encoding="utf-8",
            )
            runs = collect_runs(input_dir)
            output_dir = root / "output"
            write_artifacts(runs, output_dir)

            summary = json.loads(
                (output_dir / "benchmark_summary.json").read_text(encoding="utf-8")
            )
            self.assertEqual(summary["totalRuns"], 1)
            self.assertAlmostEqual(summary["avgImprovement"], 0.2)
            with (output_dir / "benchmark_summary.csv").open(encoding="utf-8") as csv_file:
                csv_rows = list(csv.DictReader(csv_file))
            self.assertEqual(csv_rows[0]["costUsd"], "0.023")
            self.assertEqual(csv_rows[0]["latencyMs"], "8900.0")

            write_artifacts([], output_dir)
            empty = json.loads(
                (output_dir / "benchmark_summary.json").read_text(encoding="utf-8")
            )
            self.assertEqual(empty["totalRuns"], 0)
            self.assertEqual(empty["runs"], [])


if __name__ == "__main__":
    unittest.main()
