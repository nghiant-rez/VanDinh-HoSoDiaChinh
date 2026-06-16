---
name: db-operations
description: Prisma + PostgreSQL + PostGIS workflow commands
---

Prisma workflow: `npm run db:generate` -> `npm run db:push` -> `npm run db:seed`
- generate: regenerates Prisma Client after schema changes
- push: pushes schema to local PostgreSQL
- seed: runs prisma/seed.ts via tsx

PostGIS: geometry columns use raw SQL (prisma/schema.prisma:66)
- Manual: `psql -d vandinh -c "SELECT AddGeometryColumn('parcels','geometry',4326,'POLYGON',2);"`
- Prisma raw: `$queryRaw\`SELECT ST_AsGeoJSON(geometry) FROM parcels\``
