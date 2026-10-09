import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useTheme, type Theme } from '../hooks/useTheme'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { resetPreferences } from '../lib/preferences/resetPreferences'

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
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState('')
  const cancelButton = useRef<HTMLButtonElement>(null)
  const resetButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (confirming) cancelButton.current?.focus()
  }, [confirming])
  function closeConfirmation() {
    setConfirming(false)
    resetButton.current?.focus()
  }
  function reset() {
    const cleared = resetPreferences()
    setTheme('system')
    setFeedback(
      cleared
        ? 'Preferences reset. System appearance and default analytics selections are restored.'
        : 'Appearance reset for this view. Some browser preferences could not be cleared because storage is unavailable. Check your browser storage settings before trying again.',
    )
    closeConfirmation()
  }
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
      <Card className="mt-6 max-w-3xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Analytics preferences</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your last selection in each domain becomes its default and appears on
          the overview. Selections are saved for this browser tab, including
          reloads, when storage is available. Appearance is saved across browser
          visits.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ['/weather', 'Manage weather location'],
            ['/currencies', 'Manage currency pair and period'],
            ['/economy', 'Manage country, indicator and comparisons'],
            ['/crypto', 'Manage crypto asset and period'],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center rounded text-sm font-medium text-accent underline"
            >
              {label}
            </Link>
          ))}
        </div>
        <h3 className="mt-6 font-semibold">Data refresh</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use each view's refresh control to request an update. Recently
          retrieved data may be reused to respect provider limits. There is no
          background polling; observation dates identify when the source
          measured or published the data.
        </p>
      </Card>
      <Card className="mt-6 max-w-3xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Restore defaults</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Reset InsightSphere appearance and saved analytics selections: Abuja
          weather, USD/NGN with one month of history, Nigeria GDP over ten years
          with no comparisons, and Bitcoin over seven days. Provider-supported
          alternatives apply if a default is unavailable. Other browser storage
          and cached data are kept.
        </p>
        <Button
          ref={resetButton}
          className="mt-4"
          onClick={() => {
            setFeedback('')
            setConfirming(true)
          }}
          aria-expanded={confirming}
          aria-controls="reset-confirmation"
        >
          Reset preferences
        </Button>
        {confirming && (
          <div
            id="reset-confirmation"
            role="group"
            aria-labelledby="reset-question"
            className="mt-4 rounded-lg border border-line bg-soft p-4"
          >
            <p id="reset-question" className="text-sm font-medium">
              Restore these defaults?
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button ref={cancelButton} onClick={closeConfirmation}>
                Cancel
              </Button>
              <Button onClick={reset}>Confirm reset</Button>
            </div>
          </div>
        )}
        <p role="status" className="mt-4 text-sm text-muted">
          {feedback}
        </p>
      </Card>
    </>
  )
}
