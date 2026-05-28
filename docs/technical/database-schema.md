# Database Schema

The canonical database schema is maintained in [../database-schema.md](../database-schema.md).

This technical section keeps the schema linked from the system documentation tree while avoiding two independent schema copies.

Redis is documented here only as a cache, not a database schema. Product catalog cache keys use the `shoes:*` namespace and are rebuilt from MongoDB after TTL expiry or invalidation.

## Quick Model Map

| Domain | Collections |
| --- | --- |
| Identity | `users`, `role` |
| Catalog | `shoes`, `shoesDetail`, `categories`, `counters` |
| Orders and payments | `bills`, `coupons` |
| Inventory | `stockMovements`, nested stock in `shoesDetail` |
| Customer engagement | `reviews`, `wishlist`, `chatConversations` |
| After-sales | `returnRequests` |
