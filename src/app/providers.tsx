import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '@/shared/theme'

/**
 * Provider cấp ứng dụng. Hiện chỉ có theme (sáng/tối) — mặc định theo cài đặt hệ thống,
 * không lưu vào storage. State của phân hệ kana nằm trong Zustand nên không cần Provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#171512' : '#FAF7F2')
  }, [theme])

  const value = useMemo(
    () => ({ theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
