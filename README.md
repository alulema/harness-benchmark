# Harness² Benchmark Analysis

An interactive dashboard for comparing Harness² benchmark runs across LAB, JobBench, and WorkBuddy. It includes filters for benchmark, model, execution mode, and iteration budget; score convergence, component adoption, model comparison, execution cost and latency, searchable run details, and CSV export.

> The bundled values are illustrative preview data, not benchmark results. Replace them by generating artifacts from actual run logs.

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

The parser scans `runs/**/*.json`, validates each run, and writes `public/data/benchmark_summary.json` and `public/data/benchmark_summary.csv`. It accepts one run per JSON file or a top-level `runs`, `results`, or `evaluations` array. A run needs benchmark, model, mode, baseline and final scores, and component adoption rates; score history can be given directly or as score-bearing iteration trace entries. Cost (USD) and latency (milliseconds) are optional. Scores and adoption rates may be fractions from 0–1 or percentages from 0–100. Invalid run files cause the parser to fail rather than silently producing partial results. An empty `runs/` directory produces an empty measured dataset.

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
