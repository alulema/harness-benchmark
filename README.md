# Harness² Benchmark Analysis

An interactive dashboard with two separate views:

- **Playground case study:** recorded results from `harness-playground`'s exploratory AGI futures v2 study, including paired answers, development failures, manually inspected arithmetic controls, and pending qualitative review. The playground is inspired by Harness²; it is **not Google's official implementation**. This view does not run inference.
- **Benchmark dashboard:** an illustrative preview of filters, score history, component adoption, model comparison, cost and latency, run details, and CSV export. Its bundled values are **not benchmark results**.

The case study and preview are separate datasets and are never averaged together. An unblinded answer view is opt-in: reviewers participating in the source study should use its separate blind packet and avoid the raw records, source links, and this view until their review is complete.

## Playground study data

The records in `data/playground-agi-v2/` are copied from the user's public
[`alulema/harness-playground`](https://github.com/alulema/harness-playground/tree/cad3f18a7092779c778127bde8c4264da8267a8d/docs/experiments)
at commit `cad3f18a7092779c778127bde8c4264da8267a8d`. The source repository
did not declare a license when this snapshot was imported; public access alone
is not a grant of reuse rights to third parties. The source protocol and
observations remain authoritative; review materials and their mapping are not
copied. The records and the answer view are unblinded.

Regenerate the frontend data offline, without Ollama or network access:

```sh
python3 scripts/import_playground_study.py
python3 -m unittest discover -s tests
```

The adapter verifies SHA-256 hashes against the pinned source and checks that
the held-out records refer to the imported development and task files. Its
manual control counts are transcribed from the source execution record, not
independently rescored here. To update the snapshot, review the new source
revision, licensing, protocol, review status, annotations and hashes together;
do not simply change the pinned hashes. Failed development and unavailable
human judgments must remain distinct from zero or rejected results.

## Run locally

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/`. The dashboard is also available at `/projects/harness2-benchmark/`.

## Parse benchmark runs

Put JSON run files under `runs/` and run:

```sh
python -m pip install -r requirements.txt
python scripts/parse_harness_runs.py
```

The parser scans `runs/**/*.json`, validates each run, and writes `public/data/benchmark_summary.json` and `public/data/benchmark_summary.csv`. It accepts **normalized summaries**, not native Harness² artifact trees. It accepts one run per JSON file or a top-level `runs`, `results`, or `evaluations` array. A run needs benchmark, model, mode, baseline and final scores, and component adoption rates; score history can be given directly or as score-bearing iteration trace entries. Cost (USD) and latency (milliseconds) are optional. Scores and adoption rates may be fractions from 0–1 or percentages from 0–100. Invalid run files cause the parser to fail rather than silently producing partial results. An empty `runs/` directory produces an empty measured dataset.

Run parser tests with:

```sh
python -m unittest discover -s tests
```

## Build and container

```sh
npm run check
npm run build
docker build -t harness-benchmark .
docker run --rm -p 8080:8080 harness-benchmark
```

The image serves the static site at `/` on `0.0.0.0:8080`, has no app-level authentication, and does not require persistent storage or runtime secrets. The GitHub Actions workflow publishes `ghcr.io/<owner>/harness-benchmark:latest`; ensure the package visibility is set to Public before connecting it to the ephemeral demo infrastructure. See [docs/DEMO_INTEGRATION.md](docs/DEMO_INTEGRATION.md) for the integration contract and [docs/HARNESS2_BENCHMARK_DASHBOARD_SPEC.md](docs/HARNESS2_BENCHMARK_DASHBOARD_SPEC.md) for the original dashboard specification.
