import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '../hooks/useTheme'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'

const choices: {
  value: Theme
  label: string
  icon: typeof Sun
  description: string
}[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'A bright, clear workspace',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'A softer view in low light',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow your device appearance',
  },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <PageHeader
        title="Settings"
        description="Make this workspace feel right for you."
      />
      <Card className="max-w-3xl p-6 sm:p-8">
        <fieldset>
          <legend className="text-lg font-semibold">Appearance</legend>
          <p className="mt-2 text-sm text-muted">
            Choose a theme. Your preference is saved in this browser when
            storage is available.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {choices.map(({ value, label, icon: Icon, description }) => (
              <label
                key={value}
                className={`flex cursor-pointer flex-col gap-3 rounded-lg border p-4 ${theme === value ? 'border-accent bg-soft' : 'border-line hover:bg-canvas'}`}
              >
                <span className="flex items-center justify-between">
                  <Icon aria-hidden="true" size={22} />
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                    className="size-4 accent-accent"
                  />
                </span>
                <span className="font-semibold">{label}</span>
                <span className="text-xs leading-5 text-muted">
                  {description}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>
    </>
  )
}
