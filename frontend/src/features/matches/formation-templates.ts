import type { Position } from '@/shared/types'

export interface TacticalSlot {
  x: number
  y: number
  label: string
  position: Position
}

export interface FormationTemplate {
  name: string
  slots: TacticalSlot[]
}

export const FORMATION_TEMPLATES: FormationTemplate[] = [
  {
    name: '4-4-2',
    slots: [
      { x: 50, y: 90, label: 'GK', position: 'goalkeeper' },
      { x: 15, y: 70, label: 'LB', position: 'defender' },
      { x: 38, y: 72, label: 'CB', position: 'defender' },
      { x: 62, y: 72, label: 'CB', position: 'defender' },
      { x: 85, y: 70, label: 'RB', position: 'defender' },
      { x: 15, y: 45, label: 'LM', position: 'midfielder' },
      { x: 38, y: 48, label: 'CM', position: 'midfielder' },
      { x: 62, y: 48, label: 'CM', position: 'midfielder' },
      { x: 85, y: 45, label: 'RM', position: 'midfielder' },
      { x: 35, y: 22, label: 'ST', position: 'forward' },
      { x: 65, y: 22, label: 'ST', position: 'forward' },
    ],
  },
  {
    name: '4-3-3',
    slots: [
      { x: 50, y: 90, label: 'GK', position: 'goalkeeper' },
      { x: 15, y: 70, label: 'LB', position: 'defender' },
      { x: 38, y: 72, label: 'CB', position: 'defender' },
      { x: 62, y: 72, label: 'CB', position: 'defender' },
      { x: 85, y: 70, label: 'RB', position: 'defender' },
      { x: 30, y: 48, label: 'CM', position: 'midfielder' },
      { x: 50, y: 52, label: 'CDM', position: 'midfielder' },
      { x: 70, y: 48, label: 'CM', position: 'midfielder' },
      { x: 20, y: 22, label: 'LW', position: 'forward' },
      { x: 50, y: 18, label: 'ST', position: 'forward' },
      { x: 80, y: 22, label: 'RW', position: 'forward' },
    ],
  },
  {
    name: '4-2-3-1',
    slots: [
      { x: 50, y: 90, label: 'GK', position: 'goalkeeper' },
      { x: 15, y: 70, label: 'LB', position: 'defender' },
      { x: 38, y: 72, label: 'CB', position: 'defender' },
      { x: 62, y: 72, label: 'CB', position: 'defender' },
      { x: 85, y: 70, label: 'RB', position: 'defender' },
      { x: 35, y: 55, label: 'CDM', position: 'midfielder' },
      { x: 65, y: 55, label: 'CDM', position: 'midfielder' },
      { x: 20, y: 32, label: 'LAM', position: 'midfielder' },
      { x: 50, y: 35, label: 'CAM', position: 'midfielder' },
      { x: 80, y: 32, label: 'RAM', position: 'midfielder' },
      { x: 50, y: 15, label: 'ST', position: 'forward' },
    ],
  },
  {
    name: '3-5-2',
    slots: [
      { x: 50, y: 90, label: 'GK', position: 'goalkeeper' },
      { x: 30, y: 72, label: 'CB', position: 'defender' },
      { x: 50, y: 74, label: 'CB', position: 'defender' },
      { x: 70, y: 72, label: 'CB', position: 'defender' },
      { x: 10, y: 50, label: 'LWB', position: 'defender' },
      { x: 35, y: 50, label: 'CM', position: 'midfielder' },
      { x: 50, y: 55, label: 'CDM', position: 'midfielder' },
      { x: 65, y: 50, label: 'CM', position: 'midfielder' },
      { x: 90, y: 50, label: 'RWB', position: 'defender' },
      { x: 40, y: 20, label: 'ST', position: 'forward' },
      { x: 60, y: 20, label: 'ST', position: 'forward' },
    ],
  },
  {
    name: '5-4-1',
    slots: [
      { x: 50, y: 90, label: 'GK', position: 'goalkeeper' },
      { x: 10, y: 68, label: 'LWB', position: 'defender' },
      { x: 30, y: 72, label: 'CB', position: 'defender' },
      { x: 50, y: 74, label: 'CB', position: 'defender' },
      { x: 70, y: 72, label: 'CB', position: 'defender' },
      { x: 90, y: 68, label: 'RWB', position: 'defender' },
      { x: 15, y: 42, label: 'LM', position: 'midfielder' },
      { x: 38, y: 45, label: 'CM', position: 'midfielder' },
      { x: 62, y: 45, label: 'CM', position: 'midfielder' },
      { x: 85, y: 42, label: 'RM', position: 'midfielder' },
      { x: 50, y: 18, label: 'ST', position: 'forward' },
    ],
  },
]
