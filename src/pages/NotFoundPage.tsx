import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <p className="text-muted mb-4">Sivua ei löytynyt.</p>
      <Link to="/">
        <Button variant="secondary">Takaisin etusivulle</Button>
      </Link>
    </div>
  )
}
