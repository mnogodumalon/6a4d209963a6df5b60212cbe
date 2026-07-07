import type { EnrichedSchallplatten } from '@/types/enriched';
import type { Besitzer, Schallplatten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchallplattenMaps {
  besitzerMap: Map<string, Besitzer>;
}

export function enrichSchallplatten(
  schallplatten: Schallplatten[],
  maps: SchallplattenMaps
): EnrichedSchallplatten[] {
  return schallplatten.map(r => ({
    ...r,
    besitzer_refName: resolveDisplay(r.fields.besitzer_ref, maps.besitzerMap, 'vorname', 'nachname'),
  }));
}
