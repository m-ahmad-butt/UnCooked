# Security

## Pipeline scanners

Stages that must fail the build on high/critical findings:

| Stage | Tool | Fail condition |
|-------|------|----------------|
| 02 | Gitleaks | Any secret in full git history |
| 07 | SonarCloud | Quality gate failed |
| 08 | Snyk | High/critical dependency vuln |
| 10 | Trivy | High/critical image vuln (unfixed ignored) |

Do not disable scanners or lower thresholds. Fix findings, or document accepted risk below with owner and reason.

## Accepted findings

| ID / package | Severity | Reason | Owner | Review by |
|--------------|----------|--------|-------|-----------|
| _(none yet)_ | | | | |

## Secrets

Keep credentials out of the repo. Use GitHub Secrets / OIDC / AWS SSM or Secrets Manager.

Required for CI (stages 1–10):

- `SONAR_TOKEN` — SonarCloud token
- `SNYK_TOKEN` — Snyk API token

Update `sonar-project.properties` (`sonar.organization`, `sonar.projectKey`) to match your SonarCloud project.

## Branch protection (main)

Settings → Branches → Protect `main`:

1. Require a pull request before merging (1 reviewer)
2. Require status checks to pass before merging — select every CI job (02–10)
3. Do not allow bypassing for admins (course demo)
4. Block direct pushes to `main`
