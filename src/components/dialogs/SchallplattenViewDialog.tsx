import type { Schallplatten, Besitzer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface SchallplattenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schallplatten | null;
  onEdit: (record: Schallplatten) => void;
  besitzerList: Besitzer[];
}

export function SchallplattenViewDialog({ open, onClose, record, onEdit, besitzerList }: SchallplattenViewDialogProps) {
  function getBesitzerDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return besitzerList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schallplatten anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Titel</Label>
            <p className="text-sm">{record.fields.titel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Künstler / Band</Label>
            <p className="text-sm">{record.fields.kuenstler ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Genre</Label>
            <Badge variant="secondary">{record.fields.genre?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erscheinungsjahr</Label>
            <p className="text-sm">{record.fields.erscheinungsjahr ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <p className="text-sm">{record.fields.label ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zustand</Label>
            <Badge variant="secondary">{record.fields.zustand?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besitzer</Label>
            <p className="text-sm">{getBesitzerDisplayName(record.fields.besitzer_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkungen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}