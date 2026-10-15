import { useTheme } from '../theme'
import { Icon } from './Icon'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
      className="btn-icon rounded-full"
    >
      <Icon name={dark ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
    </button>
  )
}
