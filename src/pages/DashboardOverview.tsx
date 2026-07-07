import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchallplatten } from '@/lib/enrich';
import type { EnrichedSchallplatten } from '@/types/enriched';
import type { Besitzer } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SchallplattenDialog } from '@/components/dialogs/SchallplattenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconSearch, IconDisc,
  IconUsers, IconVinyl, IconMusic, IconFilter,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a4d209963a6df5b60212cbe';
const REPAIR_ENDPOINT = '/claude/build/repair';

const GENRE_COLORS: Record<string, string> = {
  rock: 'bg-red-100 text-red-700 border-red-200',
  pop: 'bg-pink-100 text-pink-700 border-pink-200',
  jazz: 'bg-amber-100 text-amber-700 border-amber-200',
  klassik: 'bg-purple-100 text-purple-700 border-purple-200',
  blues: 'bg-blue-100 text-blue-700 border-blue-200',
  soul: 'bg-orange-100 text-orange-700 border-orange-200',
  electronic: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  hip_hop: 'bg-green-100 text-green-700 border-green-200',
  country: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  sonstige: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ZUSTAND_COLORS: Record<string, string> = {
  neu: 'bg-emerald-100 text-emerald-700',
  sehr_gut: 'bg-green-100 text-green-700',
  gut: 'bg-lime-100 text-lime-700',
  befriedigend: 'bg-yellow-100 text-yellow-700',
  akzeptabel: 'bg-orange-100 text-orange-700',
  schlecht: 'bg-red-100 text-red-700',
};

export default function DashboardOverview() {
  const {
    besitzer, schallplatten,
    besitzerMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedSchallplatten = enrichSchallplatten(schallplatten, { besitzerMap });

  // ALL hooks BEFORE early returns
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('alle');
  const [selectedBesitzer, setSelectedBesitzer] = useState<string>('alle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedSchallplatten | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSchallplatten | null>(null);

  const genres = useMemo(() => {
    return LOOKUP_OPTIONS['schallplatten']?.genre ?? [];
  }, []);

  const filtered = useMemo(() => {
    return enrichedSchallplatten.filter(r => {
      const matchSearch = !search ||
        (r.fields.titel ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.fields.kuenstler ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.fields.label ?? '').toLowerCase().includes(search.toLowerCase()) ||
        r.besitzer_refName.toLowerCase().includes(search.toLowerCase());
      const matchGenre = selectedGenre === 'alle' || r.fields.genre?.key === selectedGenre;
      const matchBesitzer = selectedBesitzer === 'alle' || r.besitzer_refName === selectedBesitzer;
      return matchSearch && matchGenre && matchBesitzer;
    });
  }, [enrichedSchallplatten, search, selectedGenre, selectedBesitzer]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    enrichedSchallplatten.forEach(r => {
      const key = r.fields.genre?.key ?? 'sonstige';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [enrichedSchallplatten]);

  const uniqueBesitzer = useMemo(() => {
    const names = new Set<string>();
    enrichedSchallplatten.forEach(r => { if (r.besitzer_refName) names.add(r.besitzer_refName); });
    return Array.from(names).sort();
  }, [enrichedSchallplatten]);

  const handleCreate = async (fields: Besitzer['fields']) => {
    await LivingAppsService.createSchallplattenEntry(fields as any);
    fetchAll();
  };

  const handleUpdate = async (fields: Besitzer['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateSchallplattenEntry(editRecord.record_id, fields as any);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchallplattenEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header + KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plattensammlung</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{schallplatten.length} Platten · {besitzer.length} Besitzer</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-2 shrink-0" /> Neue Platte
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Platten gesamt"
          value={String(schallplatten.length)}
          description="In der Sammlung"
          icon={<IconVinyl size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Besitzer"
          value={String(besitzer.length)}
          description="Registriert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Genres"
          value={String(Object.keys(genreCounts).length)}
          description="Verschiedene"
          icon={<IconMusic size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Gefunden"
          value={String(filtered.length)}
          description="Aktuell angezeigt"
          icon={<IconDisc size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Titel, Künstler, Label suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedBesitzer}
            onChange={e => setSelectedBesitzer(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="alle">Alle Besitzer</option>
            {uniqueBesitzer.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedGenre('alle')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
            selectedGenre === 'alle'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-input hover:bg-muted'
          }`}
        >
          Alle <span className="ml-1 opacity-70">({schallplatten.length})</span>
        </button>
        {genres.map(g => {
          const count = genreCounts[g.key] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={g.key}
              onClick={() => setSelectedGenre(selectedGenre === g.key ? 'alle' : g.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                selectedGenre === g.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : `${GENRE_COLORS[g.key] ?? 'bg-gray-100 text-gray-600 border-gray-200'} hover:opacity-80`
              }`}
            >
              {g.label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Record Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <IconVinyl size={48} className="text-muted-foreground" stroke={1.5} />
          <div>
            <p className="font-semibold text-foreground">Keine Platten gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">
              {schallplatten.length === 0
                ? 'Füge deine erste Platte zur Sammlung hinzu.'
                : 'Ändere die Suchkriterien oder füge eine neue Platte hinzu.'}
            </p>
          </div>
          <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
            <IconPlus size={16} className="mr-2" /> Neue Platte hinzufügen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(record => (
            <RecordCard
              key={record.record_id}
              record={record}
              onEdit={() => { setEditRecord(record); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <SchallplattenDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) await handleUpdate(fields as any);
          else await handleCreate(fields as any);
        }}
        defaultValues={editRecord?.fields}
        besitzerList={besitzer}
        enablePhotoScan={AI_PHOTO_SCAN['Schallplatten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schallplatten']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Platte löschen"
        description={`Soll "${deleteTarget?.fields.titel ?? 'diese Platte'}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ---- Record Card ----

function RecordCard({
  record,
  onEdit,
  onDelete,
}: {
  record: EnrichedSchallplatten;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const genreKey = record.fields.genre?.key ?? 'sonstige';
  const genreLabel = record.fields.genre?.label;
  const zustandKey = record.fields.zustand?.key ?? '';
  const zustandLabel = record.fields.zustand?.label;
  const genreColor = GENRE_COLORS[genreKey] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const zustandColor = ZUSTAND_COLORS[zustandKey] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Vinyl art header */}
      <div className={`relative h-32 flex items-center justify-center ${getGenreBg(genreKey)}`}>
        <div className="relative">
          {/* Vinyl disc SVG */}
          <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-md">
            <circle cx="40" cy="40" r="38" fill="#1a1a1a" />
            <circle cx="40" cy="40" r="32" fill="#222" />
            <circle cx="40" cy="40" r="26" fill="#2a2a2a" />
            <circle cx="40" cy="40" r="20" fill="#333" />
            <circle cx="40" cy="40" r="12" fill="#111" />
            <circle cx="40" cy="40" r="6" fill={getAccentColor(genreKey)} />
            <circle cx="40" cy="40" r="2.5" fill="#111" />
            {/* Grooves */}
            {[29, 33, 37].map(r => (
              <circle key={r} cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            ))}
          </svg>
        </div>
        {genreLabel && (
          <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full border ${genreColor}`}>
            {genreLabel}
          </span>
        )}
        {record.fields.erscheinungsjahr && (
          <span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full bg-black/40 text-white">
            {record.fields.erscheinungsjahr}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate" title={record.fields.titel ?? ''}>
            {record.fields.titel ?? <span className="text-muted-foreground italic">Kein Titel</span>}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {record.fields.kuenstler ?? '—'}
          </p>
        </div>

        {record.fields.label && (
          <p className="text-xs text-muted-foreground truncate">{record.fields.label}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {zustandLabel && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${zustandColor}`}>
              {zustandLabel}
            </span>
          )}
          {record.besitzer_refName && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground truncate max-w-[120px]" title={record.besitzer_refName}>
              {record.besitzer_refName}
            </span>
          )}
        </div>

        {record.fields.bemerkungen && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{record.fields.bemerkungen}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          <IconPencil size={14} className="mr-1.5 shrink-0" /> Bearbeiten
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={onDelete}>
          <IconTrash size={16} />
        </Button>
      </div>
    </div>
  );
}

function getGenreBg(key: string): string {
  const map: Record<string, string> = {
    rock: 'bg-gradient-to-br from-red-900 to-red-700',
    pop: 'bg-gradient-to-br from-pink-800 to-pink-600',
    jazz: 'bg-gradient-to-br from-amber-900 to-amber-700',
    klassik: 'bg-gradient-to-br from-purple-900 to-purple-700',
    blues: 'bg-gradient-to-br from-blue-900 to-blue-700',
    soul: 'bg-gradient-to-br from-orange-900 to-orange-700',
    electronic: 'bg-gradient-to-br from-cyan-900 to-cyan-700',
    hip_hop: 'bg-gradient-to-br from-green-900 to-green-700',
    country: 'bg-gradient-to-br from-yellow-800 to-yellow-600',
    sonstige: 'bg-gradient-to-br from-gray-800 to-gray-600',
  };
  return map[key] ?? 'bg-gradient-to-br from-gray-800 to-gray-600';
}

function getAccentColor(key: string): string {
  const map: Record<string, string> = {
    rock: '#ef4444',
    pop: '#ec4899',
    jazz: '#f59e0b',
    klassik: '#a855f7',
    blues: '#3b82f6',
    soul: '#f97316',
    electronic: '#06b6d4',
    hip_hop: '#22c55e',
    country: '#eab308',
    sonstige: '#6b7280',
  };
  return map[key] ?? '#6b7280';
}

// ---- Skeleton & Error ----

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
