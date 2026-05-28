# Change Log

All notable project changes should be recorded here.

Format follows a simple release log:

```text
## [version] - YYYY-MM-DD
### Added
### Changed
### Fixed
### Security
```

## [0.1.0] - 2026-05-19

### Added

- Added complete requirements documentation set under `docs/requirements`.
- Added system design documentation set:
  - HLD
  - LLD
  - ERD
  - system architecture diagram
  - sequence diagrams
  - API design doc
- Added technical documentation set:
  - tech stack
  - database schema
  - data flow diagram
  - deployment architecture
  - security design
  - integration doc
- Added operations and handoff documentation:
  - API reference
  - runbook
  - test plan/test cases
  - changelog

### Changed

- Documentation now reflects the current modular monolith architecture with a future microservice gateway path.

### Security

- Documented current security gaps and hardening actions for admin APIs, owner checks, CORS, token storage, DTO validation, and webhook idempotency.

## [Unreleased]

### Added

- Added Redis-backed product catalog cache, local/microservice compose Redis services, cloud Redis configuration, and documentation for cache invalidation.

### Planned

- Add OpenAPI/Swagger generation for NestJS endpoints.
- Add backend guards for all admin and owner-only routes.
- Add DTOs for all write APIs.
- Add idempotency key/event tracking for payment webhook settlement.
- Add automated frontend E2E tests for checkout and admin flows.
