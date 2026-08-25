import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from './ui/Button'

export function Layout() {
  const location = useLocation()
  const isCreatePage = location.pathname === '/uusi'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-canvas/75 backdrop-blur-md border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-ink min-h-11 -ml-1 px-1">
            <span aria-hidden>🗳️</span>
            <span>Äänestys</span>
          </Link>
          {!isCreatePage && (
            <Link to="/uusi">
              <Button variant="primary" className="text-sm">
                + Uusi äänestys
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-muted py-6">
        Mock-demo — data tallentuu vain tähän selaimeen.
      </footer>
    </div>
  )
}
