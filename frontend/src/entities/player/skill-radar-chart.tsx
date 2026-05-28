import * as React from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { PlayerAssessment } from '@/shared/types'

interface SkillRadarChartProps {
  assessment: PlayerAssessment
  previous?: PlayerAssessment
  height?: number
}

export function SkillRadarChart({ assessment, previous, height = 280 }: SkillRadarChartProps) {
  const data = [
    { subject: 'Technical', current: assessment.technical, previous: previous?.technical },
    { subject: 'Physical', current: assessment.physical, previous: previous?.physical },
    { subject: 'Tactical', current: assessment.tactical, previous: previous?.tactical },
    { subject: 'Discipline', current: assessment.discipline, previous: previous?.discipline },
    { subject: 'Teamwork', current: assessment.teamwork, previous: previous?.teamwork },
  ]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        {previous && (
          <Radar
            name="Previous"
            dataKey="previous"
            stroke="#94a3b8"
            fill="#94a3b8"
            fillOpacity={0.15}
            strokeDasharray="4 4"
          />
        )}
        <Radar
          name="Current"
          dataKey="current"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.3}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        {previous && <Legend />}
      </RadarChart>
    </ResponsiveContainer>
  )
}
