import { Icon } from '@/shared/ui/Icon'
import type { LearnStatus } from '../services/progressRepository'

/** Ký hiệu trạng thái không chỉ dựa vào màu: vòng rỗng / chấm đặc / dấu tích. */
export function StatusDot({ status, className = '' }: { status: LearnStatus; className?: string }) {
  if (status === 'mastered') {
    return (
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full bg-matcha text-surface ${className}`}
      >
        <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3.5} />
      </span>
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`h-2.5 w-2.5 rounded-full ${
        status === 'learning' ? 'bg-indigo' : 'border-[1.5px] border-muted/60'
      } ${className}`}
    />
  )
}
