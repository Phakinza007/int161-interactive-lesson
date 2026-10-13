# Transcript → Interactive lesson audit

Reviewed 2026-10-13. Scope: improve existing W1–W6 modules, beginning with W4/W6. No raw transcript or recording is bundled into the public site. Speaker names, student discussion and unrelated classroom details are omitted.

## Source matching

The website module number is a topic identifier, not a reliable recording week. Match by topic and recording date. DOCX transcripts have merged text and unreliable fine-grained timing: reference the source file, date and search topic rather than invent minute marks. VTT references use cue timestamps.

| Source | Existing coverage | Change made |
|---|---|---|
| W1, 2026-08-06 DOCX | HTML/JSON, SPA, backend overview already described | Added responsibility prediction, server/request experiment steps, JSON exercise hints |
| W2, 2026-08-13 DOCX | Request as input and URL reading already described | Added method/path prediction and get/getAll comparison |
| W3, 2026-08-20 DOCX | Layered project already present | Added request tracing, responsibility question and hints for avoiding router → repository shortcuts |
| W4, 2026-08-27 DOCX | async chain and duplicate insertion already present | Added symptom-first guidance, predictions, insertId comparison, three-stage hints, duplicate → following GET regression check |
| W4 duplicate downloaded 2026-10-13 | Extracted text matches original W4 transcript | Deduplicated; no additional activity or claim attributed to the duplicate |
| W5, 2026-09-03 DOCX | Express request APIs and middleware already present | Added input-source prediction, parser-order experiment and staged logger hints |
| W7, 2026-09-24 DOCX | Template exists in W6 module | Mapped layer-by-layer testing guidance into W6 layered-errors experiment |
| W8, 2026-10-01 VTT | W6 had slide/template coverage but lacked recording references | Added input/constraint motivation (00:22:26–00:23:30), throw/catch distinction (00:28:47–00:29:58), middleware flow (01:19:11–01:20:48), error middleware (01:21:35–01:22:02) |
| W9, 2026-10-08 DOCX | Pagination is outside existing W1–W6 topic scope | Identified page/limit/offset and response metadata as follow-on curriculum; not mixed into the existing error-handling assignment response contract |

## Teaching format

22 selected topics across all six modules now carry context, a summary of the lecturer's emphasis, a misconception to examine, a takeaway and source references. 13 have optional multiple-choice predictions; experiment activities have ordered steps where useful. Six exercises have two conceptual hints followed by the original technical hint, revealed one step at a time. Existing hints elsewhere remain available through the same control. Predictions do not mark an activity complete or affect progress.

All new questions, hints and experiment sequences are teaching adaptations, not claimed verbatim teacher instructions. The “อาจารย์เน้น” panel is explicitly labeled as a summary. Existing code, block identifiers and activity counts are preserved; the duplicate-insertion exercise additionally checks that a subsequent GET still works and the original row remains unchanged.

## Accuracy adjustments

- Distinguish simulator fixture resets from persistence in an actual MySQL server.
- Explain that a duplicate pre-check does not remove the need to catch database conflicts under concurrency.
- Correct the old simplified pool description: connections are created on demand up to the limit, reused, and the pool can be ended when no longer needed.
- Distinguish placeholders in query(sql, values) from mysql2 execute() server-side preparation.
- Remove the inaccurate claim that every Express error ends the Node process through an explicit process.exit(1). Note Express 5 returned-Promise error forwarding separately from callback error handling.

Reference documentation: [mysql2 quickstart](https://sidorares.github.io/node-mysql2/docs), [Express error handling](https://expressjs.com/en/guide/error-handling/), [Node errors](https://nodejs.org/api/errors.html). These clarifications are separate from transcript summaries.

## Validation

- Content tests verify references against the checked source inventory (transcript-sources.json), including dates and topic-module mapping, and verify prediction answer ranges. Source existence and file/text SHA-256 were checked locally when generating the inventory; ordinary tests do not require private source files outside this repository.
- Existing engine/content tests still execute examples and exercise solutions.
- W4 duplicate test sends a second request in the same session after a 409.
- Browser checks cover prediction feedback, progressive hints, source disclosure and the retained Run/check/autocomplete workflow.
