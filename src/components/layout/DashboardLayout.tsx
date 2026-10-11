import { Suspense, useEffect, useRef } from 'react'
import { Menu, SlidersHorizontal, X } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { Button } from '../ui/Button'
import { PageSkeleton } from '../ui/States'
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary'
import { navigation } from '../../app/navigation'

export function DashboardLayout() {
  const dialog = useRef<HTMLDialogElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const main = useRef<HTMLElement>(null)
  const closingForNavigation = useRef(false)
  const { pathname } = useLocation()
  const title =
    navigation.find(
      (item) =>
        item.path === pathname ||
        (item.path === '/crypto' && /^\/crypto\/[^/]+$/.test(pathname)),
    )?.title ?? 'Page not found'
  const pageTitle =
    (
      {
        Overview: 'Global Intelligence Overview',
        Weather: 'Weather Analytics',
        Currencies: 'Currency Analytics',
        Economy: 'Economic Analytics',
        Crypto: 'Cryptocurrency Analytics',
      } as Record<string, string>
    )[title] ?? title
  useEffect(() => {
    document.title = `${pageTitle} | InsightSphere`
    main.current?.focus({ preventScroll: true })
  }, [pathname, pageTitle])
  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 1024px)')
    const close = () => {
      if (breakpoint.matches && dialog.current?.open) {
        closingForNavigation.current = true
        dialog.current.close()
      }
    }
    breakpoint.addEventListener('change', close)
    return () => {
      breakpoint.removeEventListener('change', close)
      document.body.style.overflow = ''
    }
  }, [])
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-panel p-3 text-ink focus:translate-y-0"
      >
        Skip to main content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-56 lg:block xl:w-60">
        <Sidebar />
      </aside>
      <dialog
        ref={dialog}
        aria-label="Navigation menu"
        onClose={() => {
          document.body.style.overflow = ''
          if (closingForNavigation.current)
            main.current?.focus({ preventScroll: true })
          else menuButton.current?.focus()
          closingForNavigation.current = false
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[90vw] border-0 p-0 backdrop:bg-slate-950/60"
      >
        <button
          aria-label="Close navigation"
          onClick={() => dialog.current?.close()}
          className="absolute right-3 top-2 rounded p-3 text-sidebar-ink focus-visible:outline-sidebar-accent"
        >
          <X aria-hidden="true" size={20} />
        </button>
        <Sidebar
          onNavigate={() => {
            closingForNavigation.current = true
            dialog.current?.close()
          }}
        />
      </dialog>
      <div className="lg:pl-56 xl:pl-60">
        <header className="workspace-header flex h-16 items-center justify-between gap-3 px-4 sm:px-6 xl:px-9">
          <div className="flex items-center gap-3">
            <Button
              ref={menuButton}
              aria-label="Open navigation"
              aria-haspopup="dialog"
              onClick={() => {
                dialog.current?.showModal()
                document.body.style.overflow = 'hidden'
              }}
              className="px-3 lg:hidden"
            >
              <Menu aria-hidden="true" size={20} />
            </Button>
            <span className="text-sm text-muted">
              <span className="hidden sm:inline">
                Workspace{' '}
                <span aria-hidden="true" className="mx-2">
                  /
                </span>{' '}
              </span>
              <span className="font-medium text-ink">{title}</span>
            </span>
          </div>
          <Link
            to="/settings"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs text-muted hover:text-ink"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span className="hidden min-[375px]:inline">Appearance</span>
            <span className="sr-only min-[375px]:hidden">Appearance</span>
          </Link>
        </header>
        <main
          ref={main}
          id="main-content"
          tabIndex={-1}
          className="mx-auto min-w-0 max-w-[1600px] px-4 py-7 outline-none sm:px-6 sm:py-9 xl:px-9 2xl:px-12"
        >
          <FeatureErrorBoundary key={pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </FeatureErrorBoundary>
        </main>
        <footer className="mx-5 flex flex-wrap justify-between gap-2 border-t border-line py-5 text-xs text-muted sm:mx-9 lg:mx-10">
          <span>InsightSphere</span>
          <span>Weather, currencies, economies and digital assets.</span>
        </footer>
      </div>
    </div>
  )
}
