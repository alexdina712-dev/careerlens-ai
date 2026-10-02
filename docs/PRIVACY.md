# Privacy and data lifecycle

CareerLens is a portfolio demonstration. Use fictional data during recruiter testing.

## Stored data

Account name/email, password hash, session token digests, reviewed CV text and source filename, CV versions, job descriptions/notes/URLs, application timelines, structured analyses, and immutable job snapshots. No original upload is saved to disk or offered through a public URL.

## Access and deletion

Authenticated account ownership is checked on all private routes and referenced CV/job entities. Deleting a CV cascades versions and analyses; deleting a job cascades timelines and analyses; password-confirmed account deletion cascades all owned records and sessions. Deletion affects the live database; hosting backup retention is governed separately by the hosting provider.

## External processors

Local mode sends no CV to an AI provider. If configured, external analysis needs explicit per-request consent. Only the chosen CV text and job description are sent. The provider's retention and terms apply. Secrets remain in backend environment settings. The frontend exposes provider availability/label, never its key.

## Demo rules

The shared demo CV library is read-only at the server, including extraction. All seed documents are fictional. Job/status changes and newly generated analyses in that shared account may be visible to other demo visitors. Create a private account to experiment with CV management, and delete it afterward.

## Operational limits

No email verification/reset, MFA, formal compliance certification, or automated backup erasure is claimed. Production hardening should add these controls and a clearly defined retention policy before handling sensitive employment records at scale.
