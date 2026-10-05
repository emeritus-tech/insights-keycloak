# Git Commit & PR Title Convention

## Introduction

This project follows a strict message format to maintain consistency and integrate with our Jira-based workflow. Pull request titles are validated by CI and must match the format below.

## Format

```
[JIRA-ID] <type>(<scope>): <description>
```

- **JIRA-ID**: The Jira ticket ID, e.g. `[MI-1234]`.
- **type**: One of:
  - **feat**: A new feature
  - **fix**: A bug fix
  - **chore**: Build process or auxiliary tooling changes
  - **docs**: Documentation only changes
  - **style**: Formatting / whitespace changes with no code meaning change
  - **refactor**: Code change that neither fixes a bug nor adds a feature
  - **perf**: A performance improvement
  - **test**: Adding or correcting tests
  - **build**: Build system or dependency changes
  - **ci**: CI configuration / script changes
  - **revert**: Reverts a previous commit
- **scope**: Area of the change (required), e.g. `docker`, `auth`, `login`
- **description**: Brief summary in the imperative mood

## Examples

- `[MI-2536] chore(docker): configure optimized keycloak startup`
- `[MI-1234] feat(auth): add JWT-based authentication`
- `[MI-5678] fix(login): resolve crash on profile update`
