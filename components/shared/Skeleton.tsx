import { cn } from '@/lib/utils'

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-2xl', className)} />
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md h-4', className)} />
}
