import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import type { Player } from '@/shared/types'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from '@/shared/ui'

const eventSchema = z.object({
  playerID: z.string().optional(),
  minute: z.number().min(1).max(120),
  type: z.enum(['goal', 'assist', 'yellow_card', 'red_card', 'sub_in', 'sub_out']),
  notes: z.string().optional(),
})

type EventValues = z.infer<typeof eventSchema>

interface MatchEventsFormProps {
  players: Player[]
  onSubmit: (values: EventValues) => Promise<void>
  loading?: boolean
}

export function MatchEventsForm({ players, onSubmit, loading }: MatchEventsFormProps) {
  const form = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { playerID: '', minute: 1, type: 'goal', notes: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Event Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="goal">⚽ Goal</SelectItem>
                <SelectItem value="assist">🎯 Assist</SelectItem>
                <SelectItem value="yellow_card">🟨 Yellow Card</SelectItem>
                <SelectItem value="red_card">🟥 Red Card</SelectItem>
                <SelectItem value="sub_in">⬆️ Substitution In</SelectItem>
                <SelectItem value="sub_out">⬇️ Substitution Out</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="playerID" render={({ field }) => (
          <FormItem>
            <FormLabel>Player</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select player..." /></SelectTrigger></FormControl>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="minute" render={({ field }) => (
          <FormItem><FormLabel>Minute</FormLabel><FormControl>
            <Input type="number" min={1} max={120} {...field}
              onChange={(e) => field.onChange(Number(e.target.value))} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Notes</FormLabel><FormControl>
            <Textarea placeholder="Additional details..." rows={2} {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Event
        </Button>
      </form>
    </Form>
  )
}
