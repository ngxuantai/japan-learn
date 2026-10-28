import { useReviewStore } from '../store/reviewStore'
import { ReviewSession } from './ReviewSession'
import { ReviewSetup } from './ReviewSetup'
import { ReviewSummary } from './ReviewSummary'

/** Trang ôn tập: chọn phạm vi → trả lời từng câu → tổng kết. */
export function ReviewPage() {
  const session = useReviewStore((s) => s.session)
  if (!session) return <ReviewSetup />
  if (session.finishedAt !== null) return <ReviewSummary session={session} />
  return <ReviewSession session={session} />
}
