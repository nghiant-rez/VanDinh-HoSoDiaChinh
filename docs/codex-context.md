# Task Group: Greenfield land/GIS architecture planning in QLKHO workspace

scope: planning a new local/offline land-record webapp from scratch in the QLKHO workspace; use for stack selection, scope framing, and deployment-complexity tradeoffs when no maintainable source baseline exists
applies_to: cwd=C:\Users\rinzl\Desktop\Phan mem QLKHO VAN DINH\copy phan mem QLKHO; reuse_rule=safe for this workspace's greenfield planning and similar local-first land/GIS discussions, but artifact-specific findings should not be treated as source-code truth

## Task 1: Inspect existing project shape and determine greenfield direction, success

### rollout_summary_files

- rollout_summaries/2026-06-12T08-11-29-bsbC-greenfield_local_land_gis_stack_selection.md (cwd=\\?\C:\Users\rinzl\Desktop\Phan mem QLKHO VAN DINH\copy phan mem QLKHO, rollout_path=\\?\C:\Users\rinzl\.codex\sessions\2026\06\12\rollout-2026-06-12T15-11-29-019ebae2-d809-7fe0-94fa-d5e5fa4ad9a8.jsonl, updated_at=2026-06-12T08:47:48+00:00, thread_id=019ebae2-d809-7fe0-94fa-d5e5fa4ad9a8, established that the workspace is published artifacts plus docs, not a maintainable source baseline)

### keywords

- QLKHO, greenfield, local webapp from scratch, UC-04, UC-06, UC-09, docs/use-case-and-diagrams.md, QLKHO_database_design.md, BACKEND\\appsettings.json, FRONTEND\\main.js, 7z, published artifacts

## Task 2: Compare stack options and answer architecture questions, success

### rollout_summary_files

- rollout_summaries/2026-06-12T08-11-29-bsbC-greenfield_local_land_gis_stack_selection.md (cwd=\\?\C:\Users\rinzl\Desktop\Phan mem QLKHO VAN DINH\copy phan mem QLKHO, rollout_path=\\?\C:\Users\rinzl\.codex\sessions\2026\06\12\rollout-2026-06-12T15-11-29-019ebae2-d809-7fe0-94fa-d5e5fa4ad9a8.jsonl, updated_at=2026-06-12T08:47:48+00:00, thread_id=019ebae2-d809-7fe0-94fa-d5e5fa4ad9a8, compared lean local stack choices against heavier PO proposal)

### keywords

- GIS, DXF, PostGIS, PostgreSQL, Vite, React, TypeScript, Tailwind, MapLibre, FastAPI, ASP.NET Core, OCR, PaddleOCR, Redis, Elasticsearch, MinIO, single-PC, local-first, Windows, time estimate, hardware estimate

## User preferences

- when the user describes this feature area, they tie it to concrete land-record workflows like CAD-to-GIS conversion, parcel search, and scanned hồ sơ display -> optimize for the actual operator workflow, not a generic map demo [Task 1]
- when the user asks which CAD format is open source and does not need a paid API, default toward local/free/open tooling over proprietary or cloud dependencies [Task 1]
- when the user clarifies "we don't have the source code of this project and we are planning to create a new local webapp from scratch" -> treat the work as greenfield and stop planning around generated `dll/js` artifacts [Task 1]
- when the user asks "what is the best tech stacks for our project?", "the backend be .Net or java?", or asks for Vite/React vs Next.js comparisons, they want a direct recommendation plus practical tradeoffs, not just a menu of options [Task 2]
- when the user keeps asking about PostgreSQL local, Redis/Elasticsearch local, and MinIO vs PostgreSQL, optimize recommendations for offline/local deployment and low operational burden [Task 2]
- when a PO proposal adds Redis/Elasticsearch/MinIO/Docker, separate "feasible" from "advisable under time constraints" instead of treating enterprise completeness as the default target [Task 2]
- when the user asks about development time and hardware sizing, include schedule and deployment-machine estimates in the recommendation by default [Task 2]

## Reusable knowledge

- The existing docs already frame the business scope around UC-04 import digital map, UC-06 find parcel on map, and UC-09 compare scan vs map, so those are good anchors for future planning in this workspace [Task 1]
- The workspace contains published backend/frontend/database artifacts and generated docs, but not a clean maintainable source tree; `QLKHO_database_design.md`, `DataBase/script.sql`, and `BACKEND\appsettings.json` are useful reference artifacts, not a source baseline [Task 1]
- The old frontend bundle exposed routes and service proxies in `FRONTEND\main.js`, which is another indicator that this is bundled output rather than a project ready for normal source edits [Task 1]
- Lean stack direction from this rollout: `Vite + React + TypeScript + Tailwind + MapLibre` on the frontend, `FastAPI` or `ASP.NET Core` on the backend depending on team choice, `PostgreSQL + PostGIS` for spatial data, local filesystem storage, and OCR later rather than day-one platform sprawl [Task 2]
- `Vite` was favored over `Next.js` because this is an internal local GIS tool, not an SEO/public website; `Next.js` can replace the role of "Vite + React" in some projects, but it adds framework/server complexity the user likely does not need here [Task 2]
- `PostgreSQL + PostGIS` can run locally on Windows and is the spatial storage/query layer; `MinIO` is optional S3-like object storage, not a default requirement for a single-PC setup [Task 2]
- `Redis` and `Elasticsearch` can run locally, but they are poor default additions for a small single-PC land-record system because they add install/debug/backup complexity without proving core-value first [Task 2]
- For OCR, the stronger ecosystem signal in this rollout was Python with `PaddleOCR`; pure-.NET OCR is possible, but it is the weaker default for difficult Vietnamese scanned land records [Task 2]
- Practical planning estimates from the rollout: lean local hardware around 8-core CPU, 32 GB RAM, 1 TB NVMe SSD; move to 64 GB RAM only if heavy services are added early. Timeline estimate: MVP 3-4 months, solid production 6-9 months, fuller OCR/reporting/hardening 9-12 months for 2 devs + 1 BA/tester [Task 2]

## Failures and how to do differently

- symptom: planning starts from the assumption that the existing folder can be extended as source -> cause: compiled binaries and archives were mistaken for a maintainable codebase -> fix: confirm source availability early and, if the user says the app must be rebuilt from scratch, stop planning edits against generated outputs [Task 1]
- symptom: archive inspection becomes a time sink -> cause: `7z` was unavailable in this environment -> fix: treat archive restoration as blocked here and rely on docs/config/generated artifacts only for orientation unless the tool becomes available [Task 1]
- symptom: stack discussion keeps pivoting across many frameworks -> cause: the user is asking comparative follow-ups and no concise recommendation matrix was surfaced early -> fix: provide a lean recommendation first, then compare alternatives against that baseline [Task 2]
- symptom: an infra-heavy proposal sounds possible and starts to dominate the conversation -> cause: "feasible" is being conflated with "good default for this team and timeline" -> fix: explicitly separate feasibility from advisability under the local/offline, single-PC, time-constrained constraints [Task 2]

# Task Group: Codex self-knowledge docs lookup

scope: answering Codex terminology or feature questions from official/current docs instead of memory; use for direct product-explanation lookups
applies_to: cwd=C:\Users\rinzl\Documents\Codex\2026-06-11\goal-what-is-pursue-goal-mode; reuse_rule=safe for Codex self-knowledge questions, but product details should still be rechecked against current official docs

## Task 1: Explain "pursue goal" mode in Codex, success

### rollout_summary_files

- rollout_summaries/2026-06-11T09-30-32-aXva-codex_goal_mode_docs_lookup.md (cwd=\\?\C:\Users\rinzl\Documents\Codex\2026-06-11\goal-what-is-pursue-goal-mode, rollout_path=C:\Users\rinzl\.codex\sessions\2026\06\11\rollout-2026-06-11T16-30-32-019eb604-de0f-7641-988a-4c1b423607d8.jsonl, updated_at=2026-06-11T09:32:29+00:00, thread_id=019eb604-de0f-7641-988a-4c1b423607d8, mapped informal wording to official `Goal mode`)

### keywords

- Codex, Goal mode, /goal, pursue goal, codex manual, fetch-codex-manual, features.goals, /plan, update_goal

## User preferences

- when the user asks a Codex self-knowledge question like "what is \"pursue goal\" mode in codex?", treat it as a docs-first lookup and verify against the current manual instead of answering from memory [Task 1]
- when the user uses an informal or non-official product term such as "pursue goal", map it to the closest documented Codex term and say explicitly if the exact phrase is not official [Task 1]

## Reusable knowledge

- The documented feature name is `Goal mode`, started with `/goal`; it is a persistent objective attached to the active thread that Codex keeps working toward until it finishes, pauses, or needs more input [Task 1]
- The current reliable lookup workflow is to fetch the Codex manual first with `node C:\Users\rinzl\.codex\skills\.system\openai-docs\scripts\fetch-codex-manual.mjs`, then search the manual for the exact phrase and adjacent documented terminology [Task 1]
- Useful manual anchors from this rollout were around `#L514`, `#L4056`, and `#L5748`; if `/goal` is missing, the documented fix is `features.goals = true` in `config.toml` or `codex features enable goals` [Task 1]
- If the goal is hard to define up front, `/plan` can be used first and the refined objective can then be set with `/goal` [Task 1]

## Failures and how to do differently

- symptom: user wording does not match an official product term -> cause: the phrase is informal or UI-adjacent rather than the documented label -> fix: search official docs for both the literal phrase and nearby official terminology, then normalize to the documented term instead of repeating the informal wording as if it were official [Task 1]
- symptom: a Codex feature answer is likely to drift or be stale -> cause: answering from memory instead of the current manual -> fix: use the manual helper first and treat the docs as the source of truth [Task 1]
