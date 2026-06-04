import * as React from 'react'
import type { MatchLineup } from '@/shared/types'

export function TacticalBoardView({ lineup }: { lineup: MatchLineup[] }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">Tactical board ({lineup.length} players)</p>
    </div>
  )
}
