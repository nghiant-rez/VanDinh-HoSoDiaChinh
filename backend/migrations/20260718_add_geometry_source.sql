-- LOCAL/TEST ONLY until team reviews this schema change.
-- This migration is intentionally not executed by application startup.

BEGIN;

ALTER TABLE thuadat
    ADD COLUMN IF NOT EXISTS geometry_source VARCHAR(32);

UPDATE thuadat
SET geometry_source = CASE
    WHEN geom IS NOT NULL THEN 'untracked_polygon'
    ELSE 'centroid_only'
END
WHERE geometry_source IS NULL;

ALTER TABLE thuadat
    ALTER COLUMN geometry_source SET DEFAULT 'centroid_only',
    ALTER COLUMN geometry_source SET NOT NULL;

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_thuadat_geometry_source'
          AND conrelid = 'thuadat'::regclass
    ) THEN
        ALTER TABLE thuadat
            ADD CONSTRAINT ck_thuadat_geometry_source
            CHECK (geometry_source IN (
                'dgn_polygon',
                'area_estimate',
                'centroid_only',
                'untracked_polygon'
            ));
    END IF;
END
$migration$;

COMMENT ON COLUMN thuadat.geometry_source IS
    'dgn_polygon, area_estimate, centroid_only, or legacy untracked_polygon';

COMMIT;
