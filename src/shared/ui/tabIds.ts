/** Quy ước id để liên kết tab ↔ tabpanel (aria-controls / aria-labelledby). */
export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`
export const tabPanelId = (prefix: string) => `${prefix}-panel`

/** Props gắn lên phần tử chứa nội dung của tab đang chọn. */
export const tabPanelProps = (prefix: string, activeId: string) => ({
  role: 'tabpanel' as const,
  id: tabPanelId(prefix),
  'aria-labelledby': tabId(prefix, activeId),
})
