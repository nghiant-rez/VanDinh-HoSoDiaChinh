export const GIS_IMPORT_CONFIRMATION = 'NHAP LAI TOAN BO';

export function isGisImportConfirmed(value: string | null | undefined): boolean {
  return value?.trim().toUpperCase() === GIS_IMPORT_CONFIRMATION;
}
