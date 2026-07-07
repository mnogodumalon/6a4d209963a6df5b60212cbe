// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Besitzer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    stadt?: string;
  };
}

export interface Schallplatten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    kuenstler?: string;
    genre?: LookupValue;
    erscheinungsjahr?: number;
    label?: string;
    zustand?: LookupValue;
    besitzer_ref?: string; // applookup -> URL zu 'Besitzer' Record
    bemerkungen?: string;
  };
}

export const APP_IDS = {
  BESITZER: '6a4d20889264e3560fc79890',
  SCHALLPLATTEN: '6a4d208b79777fe4a25678b0',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'schallplatten': {
    genre: [{ key: "rock", label: "Rock" }, { key: "pop", label: "Pop" }, { key: "jazz", label: "Jazz" }, { key: "klassik", label: "Klassik" }, { key: "blues", label: "Blues" }, { key: "soul", label: "Soul" }, { key: "electronic", label: "Electronic" }, { key: "hip_hop", label: "Hip-Hop" }, { key: "country", label: "Country" }, { key: "sonstige", label: "Sonstige" }],
    zustand: [{ key: "neu", label: "Neu" }, { key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "befriedigend", label: "Befriedigend" }, { key: "akzeptabel", label: "Akzeptabel" }, { key: "schlecht", label: "Schlecht" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'besitzer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'stadt': 'string/text',
  },
  'schallplatten': {
    'titel': 'string/text',
    'kuenstler': 'string/text',
    'genre': 'lookup/select',
    'erscheinungsjahr': 'number',
    'label': 'string/text',
    'zustand': 'lookup/select',
    'besitzer_ref': 'applookup/select',
    'bemerkungen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateBesitzer = StripLookup<Besitzer['fields']>;
export type CreateSchallplatten = StripLookup<Schallplatten['fields']>;