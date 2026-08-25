import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { VoteListPage } from './pages/VoteListPage'
import { VoteDetailPage } from './pages/VoteDetailPage'
import { VoteCreatePage } from './pages/VoteCreatePage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<VoteListPage />} />
        <Route path="/aanestys/:id" element={<VoteDetailPage />} />
        <Route path="/uusi" element={<VoteCreatePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
