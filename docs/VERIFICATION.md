# Verification record — 2 October 2026

| Check                                  | Executed result                                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript and production build        | Passed locally and in GitHub Actions                                                                                                                                                          |
| Unit/provider tests                    | 7 passed                                                                                                                                                                                      |
| PostgreSQL-backed API tests            | 17 passed, including real PDF/DOCX/TXT and multi-byte UTF-8 extraction                                                                                                                        |
| Actual Desktop installation            | All 24 unit/API tests and all 12 desktop/mobile browser workflows passed                                                                                                                      |
| Public HTTPS end-to-end tests          | All 12 passed against https://careerlens-ai-dina19.vercel.app after the final parser fix                                                                                                      |
| Hosted security/extraction smoke check | Passed: unauthenticated access rejection, Secure/HttpOnly/SameSite cookies, no-store responses, Origin rejection, real TXT/DOCX/PDF extraction, API survival, and disposable account deletion |
| GitHub CI                              | [Successful application verification](https://github.com/alexdina712-dev/careerlens-ai/actions/runs/36986637085) on the final parser implementation                                           |
| Windows launcher                       | Fresh dependency install/database/migration/seed/build/start passed; safe stop/restart passed; port conflicts explicitly rejected                                                             |
| Responsive visual inspection           | Actual desktop, 390-pixel mobile, and 820-pixel tablet screenshots captured from the hosted app                                                                                               |

The browser suite covers login/session persistence/logout, private registration and upload, immutable CV versions, job creation/editing/status timelines/search, advisory analysis/export/deletion cascades, navigation/overflow/browser exceptions, and password-confirmed account deletion.

## Debugging evidence

Browser checks exposed prefilled textarea accessibility labels, asynchronous save/hydration timing, mobile sidebar scrolling, and native modal touch scrolling. Full-screen mobile editors resolved the touch issue. Windows API verification exposed a native PDF dependency failure in worker threads; parsing now runs in a separate bounded subprocess, with UTF-8 output decoding and API survival checks. The local supervisor now checks for port conflicts before startup.

## Scope and limits

All fixtures are fictional; disposable accounts are deleted. No paid external model inference was performed. The OpenAI-compatible provider's contract, consent handling, schema validation and evidence filtering were tested with controlled HTTP responses. Model quality is not claimed from those transport tests.

Docker and Compose support are prepared, but no Docker engine was available here, so container execution is not claimed. Native Windows and clean Linux CI builds/tests were executed. Hosted application code uses the validated backend parser commit `9a4ffaae77d3dd3abf2ecb24921b551458258240`; subsequent documentation-only commits do not change runtime behavior.
