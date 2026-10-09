import { Suspense, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { Outlet, useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { Button } from '../ui/Button'
import { PageSkeleton } from '../ui/States'
import { navigation } from '../../app/navigation'

export function DashboardLayout() {
  const dialog = useRef<HTMLDialogElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const title =
    navigation.find(
      (item) =>
        item.path === pathname ||
        (item.path === '/crypto' && /^\/crypto\/[^/]+$/.test(pathname)),
    )?.title ?? 'Page not found'
  useEffect(() => {
    document.title = `${title} | InsightSphere`
    main.current?.focus({ preventScroll: true })
  }, [pathname, title])
  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 1024px)')
    const close = () => {
      if (breakpoint.matches) dialog.current?.close()
    }
    breakpoint.addEventListener('change', close)
    return () => breakpoint.removeEventListener('change', close)
  }, [])
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-panel p-3 text-ink focus:translate-y-0"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      <dialog
        ref={dialog}
        aria-label="Navigation menu"
        onClose={() => {
          document.body.style.overflow = ''
          menuButton.current?.focus()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[90vw] border-0 p-0 backdrop:bg-slate-950/60"
      >
        <button
          aria-label="Close navigation"
          onClick={() => dialog.current?.close()}
          className="absolute right-3 top-2 rounded p-2 text-white"
        >
          <X size={20} />
        </button>
        <Sidebar onNavigate={() => dialog.current?.close()} />
      </dialog>
      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between gap-3 border-b border-line bg-panel px-5 sm:px-9">
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
              <Menu size={20} />
            </Button>
            <span className="text-sm text-muted">
              Workspace{' '}
              <span aria-hidden="true" className="mx-2 text-muted">
                /
              </span>{' '}
              <span className="font-medium text-ink">{title}</span>
            </span>
          </div>
          <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">
            Preview workspace
          </span>
        </header>
        <main
          ref={main}
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1600px] p-5 outline-none sm:p-9 lg:p-10"
        >
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="mx-5 flex flex-wrap justify-between gap-2 border-t border-line py-5 text-xs text-muted sm:mx-9 lg:mx-10">
          <span>InsightSphere</span>
          <span>Public data. Connected perspectives.</span>
        </footer>
      </div>
    </div>
  )
}
