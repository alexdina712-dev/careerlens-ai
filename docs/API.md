# REST API

JSON responses; errors use `{ "error": "readable error" }`. Zod validates payloads. Authentication is a session cookie. Production write requests require the exact configured Origin. Cross-account entities return 404, and no document is public.

| Method/path (prefix `/api`)        | Behavior                                                        |
| ---------------------------------- | --------------------------------------------------------------- |
| GET `/health`                      | Database connectivity health                                    |
| POST `/auth/register`              | name, email, password; creates session                          |
| POST `/auth/login`                 | email/password; creates session                                 |
| POST `/auth/logout`                | revokes current session                                         |
| GET `/auth/me`                     | current user                                                    |
| GET `/workspace/config`            | provider availability and label, no secrets                     |
| GET/POST `/workspace/cvs`          | own library / title, text, optional sourceName                  |
| POST `/workspace/cvs/extract`      | multipart `file`; TXT/PDF/DOCX reviewed text                    |
| POST `/workspace/cvs/:id/versions` | text and optional sourceName; immutable new version             |
| PATCH `/workspace/cvs/:id`         | title                                                           |
| POST `/workspace/cvs/:id/default`  | sole default CV                                                 |
| DELETE `/workspace/cvs/:id`        | cascades versions and analyses                                  |
| GET/POST `/workspace/jobs`         | own jobs / company, position, location, url, description, notes |
| PATCH `/workspace/jobs/:id`        | edit saved opportunity                                          |
| PATCH `/workspace/jobs/:id/status` | status enum; records transition                                 |
| DELETE `/workspace/jobs/:id`       | cascades analyses and timeline                                  |
| GET/POST `/workspace/analyses`     | own results / cvVersionId, jobId, useExternal, consent          |
| DELETE `/workspace/analyses/:id`   | delete saved result                                             |
| DELETE `/workspace/account`        | password-confirmed complete account deletion                    |

Statuses: INTERESTED, APPLIED, INTERVIEW, OFFER, REJECTED, ARCHIVED. Limits: 10 CVs, 20 versions per CV, 200 jobs, 200 analyses; 2 MB uploads, 50,000 CV characters and 30,000 job-description characters. Authentication, extraction and analysis have rate limits. Shared demo CV mutations and account deletion return 403.
