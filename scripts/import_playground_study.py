#!/usr/bin/env python3
"""Normalize the pinned public playground study without accessing model services."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "playground-agi-v2"
OUTPUT = ROOT / "src" / "data" / "playground_agi_v2.json"
REVISION = "cad3f18a7092779c778127bde8c4264da8267a8d"
FILES = {
    "agi-v2-development-results.json": "0669d9982c7741ce8f29cdb99da1f48995d48d07373bf0d839604bf75f14eed2",
    "agi-v2-heldout-results.json": "0dee451ccd65ce5aad06b776a3cc5928fec94539489aa160872a683ee6e018af",
    "agi-v2-heldout-tasks.json": "c2bbaa3f2c77602d94e20f8cf9360aa47ffed2007d0178a1da6ae7b6f84b2ffe",
}


def load_sources():
    result = {}
    for name, expected in FILES.items():
        raw = (SOURCE / name).read_bytes()
        if hashlib.sha256(raw).hexdigest() != expected:
            raise ValueError(f"{name}: source checksum differs from the pinned revision")
        result[name] = json.loads(raw)
    return result


def normalize(sources):
    development = sources["agi-v2-development-results.json"]
    heldout = sources["agi-v2-heldout-results.json"]
    tasks = sources["agi-v2-heldout-tasks.json"]
    if development["study_id"] != "agi-futures-v2" or heldout["study_id"] != development["study_id"]:
        raise ValueError("Unexpected or inconsistent study ID")
    if heldout["development_sha256"] != FILES["agi-v2-development-results.json"]:
        raise ValueError("Held-out record does not match the development record")
    if heldout["heldout_task_sha256"] != FILES["agi-v2-heldout-tasks.json"]:
        raise ValueError("Held-out record does not match the task definitions")
    task_index = {task["id"]: task for task in tasks}
    if len(task_index) != len(tasks):
        raise ValueError("Duplicate task ID")

    pairs = []
    seen = set()
    for pair in heldout["pairs"]:
        task = task_index[pair["task_id"]]
        identity = (pair["model"], pair["task_id"], pair["repetition"])
        if identity in seen or set(pair["responses"]) != {"base", "candidate"}:
            raise ValueError(f"Invalid or duplicate pair: {identity}")
        seen.add(identity)
        responses = {}
        for arm in ("base", "candidate"):
            record = pair["responses"][arm]
            responses[arm] = {
                "status": record["status"],
                "text": record.get("text", ""),
                "wallSeconds": record.get("wall_seconds"),
            }
        pairs.append({
            "id": pair["id"], "model": pair["model"], "taskId": task["id"],
            "kind": task["kind"], "repetition": pair["repetition"], "responses": responses,
        })

    if len(pairs) != 24 or len(tasks) != 8 or heldout["repetitions"] != 3:
        raise ValueError("The study shape changed; review before updating the dashboard")
    for task in tasks:
        if sum(pair["taskId"] == task["id"] for pair in pairs) != 3:
            raise ValueError(f"Expected three pairs for {task['id']}")

    runs = []
    for run in development["runs"]:
        instructions = [
            event["data"]["instruction"]
            for event in run["events"]
            if event["event"] == "compose" and event["data"]["accepted"]
        ]
        errors = [event["data"]["message"] for event in run["events"] if event["event"] == "error"]
        runs.append({"model": run["model"], "status": run["status"], "instructions": instructions, "errors": errors})
    model = "qwen2.5:1.5b-instruct"
    if {pair["model"] for pair in pairs} != {model}:
        raise ValueError("Unexpected model in held-out comparisons")
    return {
        "studyId": heldout["study_id"],
        "revision": REVISION,
        "recordedAt": development["created_at_utc"],
        "engineRevision": development["git_revision"],
        "engineSha256": development["engine_sha256"],
        "ollamaVersion": heldout["model_metadata"]["ollama_version"],
        "modelDigest": heldout["model_metadata"]["models"][model]["digest"],
        "repetitions": heldout["repetitions"],
        "tasks": tasks,
        "pairs": pairs,
        "development": runs,
        "skipped": heldout["skipped"],
        "sourceChecksums": FILES,
        "manualControls": [
            {"taskId": "arithmetic-labs", "baseCorrect": 2, "candidateCorrect": 1, "total": 3},
            {"taskId": "arithmetic-reports", "baseCorrect": 2, "candidateCorrect": 1, "total": 3},
        ],
    }


def main():
    result = normalize(load_sources())
    OUTPUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}: {len(result['pairs'])} pairs")


if __name__ == "__main__":
    main()
