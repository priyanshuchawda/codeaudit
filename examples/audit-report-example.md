# CodeAudit Audit Report

## Findings

| Severity | Category | File                  | Title                                        | Recommendation                                    |
| -------- | -------- | --------------------- | -------------------------------------------- | ------------------------------------------------- |
| high     | security | app/api/chat/route.ts | Route handler lacks obvious input validation | Validate request bodies with a schema before use. |
| medium   | docs     | README.md             | Unsupported secure claim                     | Add evidence or weaken the claim.                 |
