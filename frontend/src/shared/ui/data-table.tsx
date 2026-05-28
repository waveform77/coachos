import * as React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { Skeleton } from './skeleton'
import { EmptyState } from './empty-state'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '../lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  page?: number
  totalPages?: number
  onNextPage?: () => void
  onPrevPage?: () => void
  className?: string
  rowClassName?: (row: T) => string
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns, data, loading, emptyTitle = 'No data', emptyDescription,
  page, totalPages, onNextPage, onPrevPage, className, rowClassName, onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}><Skeleton className="h-4 w-24" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={cn('rounded-md border', className)}>
        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={i}
                className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row))}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrevPage} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onNextPage} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
