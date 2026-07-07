import type { Schallplatten } from './app';

export type EnrichedSchallplatten = Schallplatten & {
  besitzer_refName: string;
};
