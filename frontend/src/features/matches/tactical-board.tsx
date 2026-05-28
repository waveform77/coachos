import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
  pointerWithin,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type ClientRect,
} from '@dnd-kit/core'
import type { Player, Position, MatchLineup, LineupRole } from '@/shared/types'
import { Button, Badge, Avatar, AvatarFallback, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import { getInitials, capitalize, cn } from '@/shared/lib/utils'
import { FORMATION_TEMPLATES } from './formation-templates'

interface TacticalBoardProps {
  players: Player[]
  lineup: TacticalLineupEntry[]
  onChange?: React.Dispatch<React.SetStateAction<TacticalLineupEntry[]>>
}

export interface TacticalLineupEntry {
  playerID: string
  player: Player
  role: LineupRole
  position?: Position
  fieldX?: number
  fieldY?: number
}

function normalizeLineup(initial: MatchLineup[], allPlayers: Player[]): TacticalLineupEntry[] {
  return initial.map((l) => ({
    playerID: l.playerID,
    player: l.player ?? allPlayers.find((p) => {
      const pid = p.id || (p as any).ID || (p as any).playerId || (p as any).playerID;
      const lid = l.playerID || (l as any).playerId || l.player?.id || (l.player as any)?.ID || (l.player as any)?.playerId || (l.player as any)?.playerID;
      return pid && lid && pid === lid;
    })!,
    role: l.role,
    position: l.position,
    fieldX: l.fieldX,
    fieldY: l.fieldY,
  })).filter((e) => e.player)
}

export function TacticalBoard({ players, lineup, onChange }: TacticalBoardProps) {
  const { t } = useTranslation()
  const [selectedFormation, setSelectedFormation] = React.useState<string>('')
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const pitchRef = React.useRef<HTMLDivElement | null>(null)
  const { setNodeRef: setPitchRefRaw, isOver } = useDroppable({ id: 'pitch' })
  const setPitchRef = React.useCallback((node: HTMLDivElement | null) => {
    pitchRef.current = node
    setPitchRefRaw(node)
  }, [setPitchRefRaw])

  React.useEffect(() => {
    if (activeId) {
      document.body.style.cursor = 'grabbing';
      return () => {
        document.body.style.cursor = '';
      };
    }
  }, [activeId]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const setLineup = React.useCallback((updater: React.SetStateAction<TacticalLineupEntry[]>) => {
    console.log('SET LINEUP CALLED');
    onChange?.(updater)
  }, [onChange])

  const availablePlayers = players.filter((p) => {
    const pId = String(p.id || (p as any).ID || (p as any).playerId || (p as any).playerID)
    return !lineup.find((l) => {
      const lId = String(l.player?.id || l.playerID || (l as any).ID || (l as any).playerId || (l as any).playerID)
      return pId === lId
    })
  })
  const startersOnField = lineup.filter((l) => l.role === 'starter' && l.fieldX != null && l.fieldY != null)
  const startersOffField = lineup.filter((l) => l.role === 'starter' && (l.fieldX == null || l.fieldY == null))
  const subs = lineup.filter((l) => l.role === 'substitute')
  console.log('RENDER startersOnField count:', startersOnField.length, 'entries:', startersOnField.map(e => ({ pid: e.player?.id || e.playerID, x: e.fieldX, y: e.fieldY })))

  const addToLineup = (player: Player, role: LineupRole = 'starter') => {
    const pid = String(player.id || (player as any).ID || (player as any).playerId || (player as any).playerID);
    if (!pid || pid === 'undefined') {
      console.warn('addToLineup: invalid player id', player);
      return;
    }
    setLineup((prev) => {
      if (prev.find((l) => {
        const lid = String(l.player?.id || l.playerID || (l as any).playerId || (l.player as any)?.ID || (l.player as any)?.playerId);
        return lid === pid;
      })) return prev
      return [...prev, { playerID: pid, player, role, position: player.position }]
    })
  }

  const removeFromLineup = (playerId: string) => {
    const targetId = String(playerId)
    setLineup((prev) => prev.filter((l) => {
      const lid = String(l.player?.id || l.playerID || (l as any).ID || (l.player as any)?.ID || (l.player as any)?.playerId || (l.player as any)?.playerID)
      return lid !== targetId
    }))
  }

  const updateEntry = (playerId: string, updates: Partial<TacticalLineupEntry>) => {
    const targetId = String(playerId)
    setLineup((prev) => prev.map((l) => {
      const lid = String(l.player?.id || l.playerID || (l as any).ID || (l.player as any).playerId || (l.player as any).playerID)
      return lid === targetId ? { ...l, ...updates } : l
    }))
  }

  const applyFormation = (formationName: string) => {
    const template = FORMATION_TEMPLATES.find((f) => f.name === formationName)
    if (!template) return
    setLineup((prev) => {
      const starters = prev.filter((l) => l.role === 'starter')
      const subs = prev.filter((l) => l.role === 'substitute')
      const updated = [...subs]
      template.slots.forEach((slot, idx) => {
        const existing = starters[idx]
        if (existing) {
          updated.push({
            ...existing,
            position: slot.position,
            fieldX: slot.x,
            fieldY: slot.y,
          })
        }
      })
      const mappedIds = new Set(template.slots.map((_, i) => starters[i]?.playerID).filter(Boolean))
      starters.forEach((s) => {
        if (!mappedIds.has(s.playerID)) updated.push(s)
      })
      return updated
    })
  }

  const activePlayer = React.useMemo(() => {
    if (!activeId) return null
    const targetId = String(activeId)
    return players.find((p) => {
      const pid = p.id || (p as any).ID || (p as any).playerId || (p as any).playerID;
      return pid && String(pid) === targetId;
    }) ?? lineup.find((l) => {
      const lid = l.player?.id || l.playerID || (l as any).playerId || (l.player as any)?.ID || (l.player as any)?.playerId;
      return lid && String(lid) === targetId;
    })?.player ?? null
  }, [activeId, players, lineup])

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    console.log('handleDragEnd active.id:', active.id, 'over:', over?.id)
    
    const pitchRect = pitchRef.current?.getBoundingClientRect()
    if (!pitchRect) {
      console.log('handleDragEnd: no pitch rect')
      return
    }

    const activeRect = active.rect.current.translated || active.rect.current.initial
    if (!activeRect) {
      console.log('handleDragEnd: no active rect')
      return
    }

    // Check if dropped on pitch (either via over or via rect intersection)
    const droppedOnPitch = over?.id === 'pitch' || !(activeRect.right < pitchRect.left || activeRect.left > pitchRect.right || activeRect.bottom < pitchRect.top || activeRect.top > pitchRect.bottom)
    
    if (!droppedOnPitch) {
      console.log('handleDragEnd: dropped outside pitch')
      return
    }

    // Используем центр перетаскиваемого элемента в момент drop
    const dropCenterX = activeRect.left + activeRect.width / 2
    const dropCenterY = activeRect.top + activeRect.height / 2

    // Рассчитываем проценты относительно поля
    const x = ((dropCenterX - pitchRect.left) / pitchRect.width) * 100
    const y = ((dropCenterY - pitchRect.top) / pitchRect.height) * 100
    
    const clampedX = Math.max(2, Math.min(98, x))
    const clampedY = Math.max(2, Math.min(98, y))
    console.log('handleDragEnd coordinates:', { x, y, clampedX, clampedY })

    const rawId = String(active.id)
    const playerId = rawId.startsWith('bench-') ? rawId.slice(6) : rawId
    console.log('handleDragEnd playerId:', playerId)
    
    setLineup((prev) => {
      const existing = prev.find((l) => {
        const lid = l.player?.id || l.playerID || (l as any).playerId || (l.player as any)?.ID || (l.player as any)?.playerId;
        return lid && String(lid) === playerId;
      })
      if (existing) {
        return prev.map((l) => {
          const lid = l.player?.id || l.playerID || (l as any).playerId || (l.player as any)?.ID || (l.player as any)?.playerId;
          return lid && String(lid) === playerId
            ? { ...l, fieldX: clampedX, fieldY: clampedY, role: 'starter' }
            : l
        })
      }
      const player = players.find((p) => {
        const ppid = p.id || (p as any).ID || (p as any).playerId || (p as any).playerID;
        return ppid && String(ppid) === playerId;
      })
      if (player) {
        // use the unified string variable pid to ensure consistency
        const pid = player.id || (player as any).ID || (player as any).playerId || (player as any).playerID;
        return [...prev, { playerID: pid, player, role: 'starter', position: player.position, fieldX: clampedX, fieldY: clampedY }]
      }
      return prev
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: 0, // MeasuringStrategy.Always
        },
        draggable: {
          strategy: 0, // MeasuringStrategy.Always
        },
      }}
    >
      <div className={cn("space-y-4", activeId ? "dragging-active" : undefined)}>
        <style dangerouslySetInnerHTML={{ __html: `
          .dragging-active, .dragging-active * {
            cursor: grabbing !important;
          }
        `}} />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); applyFormation(v) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('tactics.selectFormation') || 'Схема'} />
            </SelectTrigger>
            <SelectContent>
              {FORMATION_TEMPLATES.map((f) => (
                <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('tactics.dragHint') || 'Перетащите игроков на поле'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Pitch */}
          <div className="flex-1">
            <div
              ref={setPitchRef}
              className={cn(
                'relative w-full aspect-[3/4] rounded-xl border-2 border-white/30 bg-emerald-700 overflow-hidden select-none',
                isOver && 'ring-2 ring-yellow-400'
              )}
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '25% 20%',
              }}
            >
              {/* Field markings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 133.33" preserveAspectRatio="none">
                <line x1="0" y1="66.66" x2="100" y2="66.66" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <circle cx="50" cy="66.66" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <rect x="20" y="0" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <rect x="35" y="0" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <rect x="20" y="113.33" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <rect x="35" y="125.33" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <path d="M 0,5 A 5,5 0 0,0 5,0" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <path d="M 95,0 A 5,5 0 0,0 100,5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <path d="M 0,128.33 A 5,5 0 0,1 5,133.33" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                <path d="M 95,133.33 A 5,5 0 0,1 100,128.33" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
              </svg>

              {/* Formation ghost slots */}
              {selectedFormation && FORMATION_TEMPLATES.find((f) => f.name === selectedFormation)?.slots.map((slot, i) => (
                <div
                  key={`ghost-${i}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-[10px] text-white/60 font-bold">
                    {slot.label}
                  </div>
                </div>
              ))}

              {/* Players on field */}
              {startersOnField.map((entry, i) => (
                <DraggablePitchPlayer
                  key={(entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId) ? `field-${entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId}` : `field-idx-${i}`}
                  entry={entry}
                  onRemove={() => removeFromLineup(entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId)}
                />
              ))}
          </div>
          </div>

          {/* Bench / Lists */}
          <div className="w-full lg:w-64 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('tactics.onField') || 'На поле (вне позиций)'}</h4>
              <div className="space-y-1.5">
                {startersOffField.map((entry, i) => {
                  const pid = entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId;
                  return (
                    <BenchPlayer
                      key={pid ? `bench-${pid}` : `bench-idx-${i}`}
                      entry={entry}
                      onRemove={() => removeFromLineup(pid)}
                      onRoleChange={(role) => updateEntry(pid, { role })}
                    />
                  )
                })}
                {startersOffField.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">—</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">{t('tactics.substitutes') || 'Запасные'}</h4>
              <div className="space-y-1.5">
                {subs.map((entry, i) => {
                  const pid = entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId;
                  return (
                    <BenchPlayer
                      key={pid ? `sub-${pid}` : `sub-idx-${i}`}
                      entry={entry}
                      onRemove={() => removeFromLineup(pid)}
                      onRoleChange={(role) => updateEntry(pid, { role })}
                    />
                  )
                })}
                {subs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">—</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">{t('tactics.available') || 'Доступные'} ({availablePlayers.length})</h4>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {availablePlayers.map((player, i) => {
                  const pid = String(player.id || (player as any).ID || (player as any).playerId || (player as any).playerID || `player-${i}`);
                  return (
                    <div 
                      key={pid ? `av-${pid}` : `av-idx-${i}`} 
                      className="flex items-center gap-2 rounded-lg border p-1.5 hover:bg-muted/50 transition-colors relative"
                    >
                      <div className="flex-1 min-w-0">
                        <DraggableBenchItem id={`bench-${pid}`}>
                          <Avatar className="h-7 w-7 pointer-events-none">
                            <AvatarFallback className="text-[10px]">{getInitials(player.firstName, player.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 pointer-events-none text-left">
                            <p className="text-xs font-medium truncate">{player.firstName} {player.lastName}</p>
                            {player.position && <p className="text-[10px] text-muted-foreground capitalize">{player.position}</p>}
                          </div>
                        </DraggableBenchItem>
                      </div>
                      <button 
                        type="button"
                        className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent text-2xl font-bold flex-shrink-0 relative z-[100] cursor-pointer bg-primary/10 text-primary border-2 border-primary/20" 
                        onClick={(e) => {
                          console.log('(+) click', player.lastName);
                          e.preventDefault();
                          e.stopPropagation();
                          addToLineup(player, 'starter');
                        }}
                        onMouseDown={(e) => {
                          console.log('(+) mousedown');
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          console.log('(+) pointerdown');
                          e.stopPropagation();
                        }}
                        onTouchStart={(e) => {
                          console.log('(+) touchstart');
                          e.stopPropagation();
                        }}
                      >
                        +
                      </button>
                    </div>
                  )
                })}
                {availablePlayers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">{t('common.noData')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    <DragOverlay dropAnimation={null} className="z-[10000]">
      {activePlayer ? (
        <div 
          className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-2xl ring-2 ring-emerald-500 scale-110"
          style={{ 
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Avatar className="h-9 w-9 border-2 border-white">
            <AvatarFallback className="text-xs bg-emerald-900 text-white">
              {getInitials(activePlayer.firstName, activePlayer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-tight">
              {activePlayer.firstName} {activePlayer.lastName}
            </span>
            {activePlayer.position && (
              <span className="text-[10px] text-muted-foreground uppercase">{activePlayer.position}</span>
            )}
          </div>
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  )
}



function DraggablePitchPlayer({
  entry,
  onRemove,
}: {
  entry: TacticalLineupEntry
  onRemove: () => void
}) {
  const pid = entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId;
  console.log('DraggablePitchPlayer render', { pid, fieldX: entry.fieldX, fieldY: entry.fieldY });
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(pid) })
  const { role, ...safeAttributes } = attributes

  const style: React.CSSProperties = {
    left: `${entry.fieldX}%`,
    top: `${entry.fieldY}%`,
    position: 'absolute',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) translate(-50%, -50%)` : 'translate(-50%, -50%)',
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} {...listeners} {...safeAttributes} className="group touch-none pointer-events-auto" style={style}>
      <div className="flex flex-col items-center gap-0.5 pointer-events-none">
        <div className="relative pointer-events-none">
          <Avatar className="h-9 w-9 border-2 border-white shadow-md">
            <AvatarFallback className="text-[10px] bg-emerald-900 text-white">
              {getInitials(entry.player?.firstName || '', entry.player?.lastName || '')}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          >
            ×
          </button>
        </div>
        <span className="text-[10px] text-white font-semibold bg-black/40 px-1 rounded leading-tight whitespace-nowrap max-w-[80px] truncate">
          {entry.player?.firstName}
        </span>
      </div>
    </div>
  )
}

function DraggableBenchItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const { role, ...safeAttributes } = attributes

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} {...listeners} {...safeAttributes} className="flex items-center gap-2 flex-1 min-w-0 touch-none pointer-events-auto cursor-grab active:cursor-grabbing" style={style}>
      <div className="flex-1 flex items-center gap-2 pointer-events-none">
        {children}
      </div>
    </div>
  )
}

function BenchPlayer({
  entry,
  onRemove,
  onRoleChange,
}: {
  entry: TacticalLineupEntry
  onRemove: () => void
  onRoleChange: (role: LineupRole) => void
}) {
  const pid = String(entry.player?.id || entry.playerID || (entry as any).playerId || (entry.player as any)?.ID || (entry.player as any)?.playerId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: pid })
  const { role, ...safeAttributes } = attributes

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-1.5 hover:bg-muted/50 transition-colors pointer-events-auto bg-card",
        isDragging && "opacity-50"
      )}
      style={style}
    >
      <div {...listeners} {...safeAttributes} className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing">
        <Avatar className="h-7 w-7 pointer-events-none">
          <AvatarFallback className="text-[10px]">{getInitials(entry.player?.firstName || '', entry.player?.lastName || '')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 pointer-events-none">
          <p className="text-xs font-medium truncate">{entry.player?.firstName} {entry.player?.lastName}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 z-10">
        <Badge
          variant={entry.role === 'starter' ? 'default' : 'secondary'}
          className="text-[10px] h-5 px-1 cursor-pointer pointer-events-auto"
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            onRoleChange(entry.role === 'starter' ? 'substitute' : 'starter');
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {entry.role === 'starter' ? 'Start' : 'Sub'}
        </Badge>
        <button 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            onRemove();
          }} 
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-destructive text-sm px-1 pointer-events-auto"
        >
          ×
        </button>
      </div>
    </div>
  )
}
