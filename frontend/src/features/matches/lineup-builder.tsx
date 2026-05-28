import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Star, LayoutGrid, List } from 'lucide-react'
import type { Player, MatchLineup, LineupRole, Position } from '@/shared/types'
import { Button, Badge, Avatar, AvatarFallback, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import { getInitials, capitalize } from '@/shared/lib/utils'
import { matchesApi } from '@/shared/api/matches.api'
import { TacticalBoard, type TacticalLineupEntry } from './tactical-board'

interface LineupBuilderProps {
  matchId: string
  players: Player[]
  initialLineup?: MatchLineup[]
  onSaved?: () => void
}

const POSITIONS: Position[] = ['goalkeeper', 'defender', 'midfielder', 'forward', 'universal']

export function LineupBuilder({ matchId, players, initialLineup = [], onSaved }: LineupBuilderProps) {
  const { t } = useTranslation()
  const [view, setView] = React.useState<'board' | 'list'>('board')
  
  // Создаем функцию нормализации данных
  const getNormalizedLineup = React.useCallback((raw: MatchLineup[], availablePlayers: Player[]) => {
    return raw.map((l) => {
      const lid = String(l.playerID || (l as any).playerId || l.player?.id || (l.player as any)?.ID);
      const playerObj = l.player ?? availablePlayers.find((p) => {
        const pid = String(p.id || (p as any).ID || (p as any).playerId || (p as any).playerID);
        return pid === lid;
      });
      return {
        playerID: lid,
        player: playerObj!,
        role: l.role,
        position: l.position,
        fieldX: l.fieldX,
        fieldY: l.fieldY,
      }
    }).filter((l) => l.player && l.playerID && l.playerID !== 'undefined')
      .filter((l, i, arr) => arr.findIndex((x) => x.playerID === l.playerID) === i);
  }, []);

  const safeInitialLineup = (initialLineup ?? []) as MatchLineup[]
  const [lineup, setLineup] = React.useState<TacticalLineupEntry[]>(() => 
    getNormalizedLineup(safeInitialLineup, players)
  )
  
  const [saving, setSaving] = React.useState(false)

  // Обновляем состояние только если оно пустое и пришли новые данные
  // Или если initialLineup изменился по количеству элементов (внешнее обновление)
  const lastInitialRef = React.useRef(JSON.stringify(initialLineup.map(l => l.playerID || (l as any).playerId)));
  
  React.useEffect(() => {
    const raw = (initialLineup ?? []) as MatchLineup[]
    const currentInitialStr = JSON.stringify(raw.map(l => l.playerID || (l as any).playerId));
    if (players.length > 0 && (lineup.length === 0 || currentInitialStr !== lastInitialRef.current)) {
      console.log('SYNCING LINEUP FROM PROPS', raw.length);
      setLineup(getNormalizedLineup(raw, players));
      lastInitialRef.current = currentInitialStr;
    }
  }, [initialLineup, players, getNormalizedLineup]);

  const handleSave = async () => {
    console.log('SAVING LINEUP:', lineup.length);
    setSaving(true)
    try {
      await matchesApi.setLineup(matchId, lineup.map((l) => ({
        playerID: l.player.id || l.playerID || (l.player as any).ID || (l.player as any).playerId || (l.player as any).playerID,
        playerId: l.player.id || l.playerID || (l.player as any).ID || (l.player as any).playerId || (l.player as any).playerID,
        role: l.role,
        position: l.position,
        fieldX: l.fieldX,
        fieldY: l.fieldY,
      })) as any)
      toast.success(t('tactics.lineupSaved') || 'Состав сохранён')
      onSaved?.()
    } catch {
      toast.error(t('tactics.lineupSaveError') || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const starters = lineup.filter((l) => l.role === 'starter')
  const subs = lineup.filter((l) => l.role === 'substitute')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant={view === 'board' ? 'default' : 'outline'} onClick={() => setView('board')} className="gap-1">
            <LayoutGrid className="h-4 w-4" />{t('tactics.board') || 'Доска'}
          </Button>
          <Button size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')} className="gap-1">
            <List className="h-4 w-4" />{t('tactics.list') || 'Список'}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('tactics.startersCount', { count: starters.length }) || `Старт: ${starters.length}`}
        </span>
      </div>

      {view === 'board' ? (
        <TacticalBoard players={players} lineup={lineup} onChange={setLineup} />
      ) : (
        <ListView players={players} lineup={lineup} onChange={setLineup} />
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('tactics.saveLineup') || 'Сохранить состав'}
      </Button>
    </div>
  )
}

function ListView({
  players,
  lineup,
  onChange,
}: {
  players: Player[]
  lineup: TacticalLineupEntry[]
  onChange: (lineup: TacticalLineupEntry[]) => void
}) {
  const availablePlayers = React.useMemo(() => players.filter((p) => {
    const pid = String(p.id || (p as any).ID || (p as any).playerId || (p as any).playerID);
    return !lineup.find((l) => {
      const lid = String(l.playerID || l.player?.id || (l as any).playerId || (l.player as any).ID);
      return pid === lid;
    })
  }), [players, lineup]);

  const addPlayer = (player: Player, role: LineupRole) => {
    const pid = String(player.id || (player as any).ID || (player as any).playerId || (player as any).playerID);
    onChange([...lineup, { playerID: pid, player, role, position: player.position || 'universal' }])
  }

  const removePlayer = (playerId: string) => {
    const targetId = String(playerId);
    onChange(lineup.filter((l) => {
      const lid = String(l.playerID || l.player?.id || (l as any).playerId || (l as any).ID);
      return lid !== targetId;
    }))
  }

  const updateEntry = (playerId: string, updates: Partial<TacticalLineupEntry>) => {
    const targetId = String(playerId);
    onChange(lineup.map((l) => {
      const lid = String(l.playerID || l.player?.id || (l as any).playerId || (l as any).ID);
      return lid === targetId ? { ...l, ...updates } : l;
    }))
  }

  const starters = lineup.filter((l) => l.role === 'starter')
  const subs = lineup.filter((l) => l.role === 'substitute')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold text-sm">Starters ({starters.length}/11)</h3>
          <div className="space-y-2">
            {starters.map((entry, i) => {
              const pid = entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId || (entry.player as any)?.playerID;
              return (
              <LineupRow key={pid ? String(pid) : `starter-${i}`} entry={entry}
                onRemove={() => removePlayer(pid)}
                onRoleChange={(role) => updateEntry(pid, { role })}
                onPositionChange={(position) => updateEntry(pid, { position })}
              />
            )})}
            {starters.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No starters added</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-sm">Substitutes ({subs.length})</h3>
          <div className="space-y-2">
            {subs.map((entry, i) => {
              const pid = entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId || (entry.player as any)?.playerID;
              return (
              <LineupRow key={pid ? String(pid) : `sub-${i}`} entry={entry}
                onRemove={() => removePlayer(pid)}
                onRoleChange={(role) => updateEntry(pid, { role })}
                onPositionChange={(position) => updateEntry(pid, { position })}
              />
            )})}
            {subs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No substitutes added</p>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-sm">Available Players ({availablePlayers.length})</h3>
        <div className="space-y-2">
          {availablePlayers.map((player, i) => {
            const pid = player.id || (player as any).ID || (player as any).playerId || (player as any).playerID;
            return (
            <div key={pid ? String(pid) : `avail-${i}`} className="flex items-center gap-2 rounded-lg border p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials(player.firstName, player.lastName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.firstName} {player.lastName}</p>
                {player.position && <p className="text-xs text-muted-foreground capitalize">{player.position}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => addPlayer(player, 'starter')} className="h-7 px-2 text-xs">
                  <Star className="mr-1 h-3 w-3" />Start
                </Button>
                <Button size="sm" variant="ghost" onClick={() => addPlayer(player, 'substitute')} className="h-7 px-2 text-xs">Sub</Button>
              </div>
            </div>
            )
          })}
          {availablePlayers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">All players added</p>}
        </div>
      </div>
    </div>
  )
}

function LineupRow({
  entry, onRemove, onRoleChange, onPositionChange,
}: {
  entry: TacticalLineupEntry
  onRemove: () => void
  onRoleChange: (role: LineupRole) => void
  onPositionChange: (pos: Position) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">{getInitials(entry.player.firstName, entry.player.lastName)}</AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium truncate">{entry.player.firstName} {entry.player.lastName}</span>
      <Select value={entry.position || ''} onValueChange={(v) => onPositionChange(v as Position)}>
        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Позиция" /></SelectTrigger>
        <SelectContent>
          {POSITIONS.map((p) => (
            <SelectItem key={p} value={p} className="capitalize text-xs">{capitalize(p)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge variant={entry.role === 'starter' ? 'default' : 'secondary'} className="text-xs cursor-pointer" onClick={() => onRoleChange(entry.role === 'starter' ? 'substitute' : 'starter')}>
        {entry.role}
      </Badge>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
    </div>
  )
}
