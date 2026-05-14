# Catalog Service

This folder marks the first microservice boundary.

The running app still uses the NestJS monolith. Extract code here only after the gateway and tests are stable.

Target ownership:

- Product list and filters
- Product detail
- Color and media metadata
- Stock read APIs
- Inventory overview

Keep checkout stock mutation in the monolith until the order service is extracted.
