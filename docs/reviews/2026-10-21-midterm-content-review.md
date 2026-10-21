# INT161 October content review

## Scope and sources

Added W7 Pagination/DTO and a midterm review to the standalone lesson and local Knowledge Web. Sources: supplied Week-07 Pagination and DTO slides; Week-08 practice exam specifications; midterm-exam-esm-template.zip; the supplied exam announcement; earlier transcript review, especially 15 October.

No real student identities or secret keys were copied into the new practice tasks. New coding tasks and input policies are labelled as invented practice.

## Findings corrected during review

- Both the slides and the supplied template use page starting at 1 and the parameter limit. No zero-based/page-size convention was substituted.
- Offset uses the validated, capped limit; invalid/empty/noninteger input receives 400 in the invented W7 parser.
- total=0 remains present; total counts the collection, not the current page. Empty pages preserve pagination metadata.
- One slide example shows page 2 with hasPreviousPage=false; the lesson explains the mismatch and uses page>1.
- DTO examples use an explicit field allowlist, with exact-shape tests to catch unintended data exposure.
- Template gaps are documented: query middleware wiring, pagination/view forwarding, missing total count, empty error middleware, PUT arguments and null/not-found handling.
- Actual announcement and Week-08 practice rules are distinct. The announcement did not state practical duration; the practice's 120 minutes is not presented as actual exam duration.
- Week-09 INT261 Java/Spring Boot material is excluded.
- Diagram was resized from 960px doc-inline to 800px fit after desktop review. It fits the desktop reading column and scrolls locally on a 390px phone without page overflow.
- Standalone SQL experiment closes its pool. The standalone engine gained validated LIMIT/OFFSET placeholder support, covered by WHERE + LIMIT binding, comma syntax, empty pages, zero limit and invalid values.

## Validation

- Standalone: 314 tests pass; activity ratios pass for all eight modules.
- Knowledge Web: 416 tests pass across content, registry and lab-link contracts; production build succeeds.
- Diagram Design self_check.py --offline passes for the standalone HTML figure.
- Chrome: home links and W7 table of contents render; SQL experiment returns two rows and a count of three; DELETE starter fails, solution passes through the actual editor and Web Worker, including empty 204 body and subsequent 404s. No browser console errors were observed in that flow.
- Responsive: 1470px and 390px checked; diagram has no desktop horizontal scroll and uses its own scroller on mobile. No document overflow.

## Limits and publication

The local Knowledge Web note URL redirects to its sign-in screen, so its authenticated visual page was not reviewed. Its content and labs passed the registry/behavior tests and build. Existing unrelated Knowledge Web work was left intact. This review preceded publication; deployment was subsequently requested by the user. Publication status is recorded in the release commits and deployment logs.

Diagram source: https://github.com/cathrynlavery/diagram-design . Skill is installed at ~/.agents/skills/diagram-design. INT161 uses a named profile with system fonts; the global installed style guide was not changed.
