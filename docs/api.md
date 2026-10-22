# API v1

The web interface uses the same-origin `/api/v1` API. All endpoints except login require an owner session cookie. Mutations require JSON and reject a supplied Origin that differs from PUBLIC_ORIGIN. There are no public registration endpoints or API keys.

| Resource                   | Operations                                                                 |
| -------------------------- | -------------------------------------------------------------------------- |
| `/auth/login`              | POST email and password; returns email and sets an HttpOnly session cookie |
| `/auth/me`, `/auth/logout` | GET current owner; POST logout with `{}` revokes the current session       |
| `/dashboard`               | GET stored lead, qualified lead, campaign, and suppression counts          |
| `/leads`                   | GET with optional q/status filters; POST a lead                            |
| `/leads/:id`               | PUT a complete lead; DELETE with `{}`                                      |
| `/leads/import`            | POST `{csv}`; returns imported count and row-level errors                  |
| `/leads/export`            | GET CSV with spreadsheet formula escaping                                  |
| `/campaigns`               | GET campaigns; POST name and draft/archived status                         |
| `/campaigns/:id`           | GET composition; PUT name/status; DELETE with `{}`                         |
| `/campaigns/:id/steps`     | PUT `{steps:[{subject,body}]}` in desired order                            |
| `/campaigns/:id/members`   | PUT `{leadIds:[1,2]}` to replace membership                                |
| `/campaigns/:id/schedule`  | PUT timezone, days, startTime, endTime                                     |
| `/suppression`             | GET entries; POST email and optional reason                                |
| `/suppression/:id`         | DELETE with `{}`                                                           |
| `/settings`                | GET or PUT workspaceName and timezone                                      |

Lead fields are email, name, company, status, notes. Status is new, contacted, qualified, or archived. Emails are normalized to lowercase and must be unique. CSV requires an email header, accepts these fields, and is limited to 5,000 records and 900,000 characters. Invalid rows are reported while valid rows are committed.

Schedules use IANA timezone identifiers, days 1–7 (Monday–Sunday), and 24-hour HH:mm times with start before end. They store a plan without scheduling a sending job. Maximum 50 sequence steps per campaign. JSON request bodies are limited to 1 MiB.

Validation errors return 400, anonymous requests 401, rejected origins 403, missing records 404, duplicate records 409, and rate limits 429. Error responses use `{error}`. Login allows five requests per minute per client IP; general requests allow 120. Password reset revokes all sessions. A session expires after 24 hours.
