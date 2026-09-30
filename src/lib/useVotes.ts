import { useCallback, useEffect, useState } from 'react'
import { api, describeError } from './api'
import { withVote, type Vote } from '../types'

export type LoadState = 'loading' | 'ready' | 'error'

/** Äänen antaminen optimistisesti: UI päivittyy heti, palvelimen vastaus korvaa arvion. */
async function submitVote(vote: Vote, optionId: string, replace: (v: Vote) => void): Promise<string | null> {
  replace(withVote(vote, optionId))
  try {
    replace(await api.castVote(vote.id, optionId))
    return null
  } catch (err) {
    replace(vote) // palautus
    return describeError(err)
  }
}

/** Kaikki äänestykset (lista-sivu). */
export function useVoteList() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [voteError, setVoteError] = useState<string | null>(null)

  const load = useCallback(() => {
    setState('loading')
    api
      .listVotes()
      .then((list) => {
        setVotes(list)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(load, [load])

  const castVote = useCallback(async (vote: Vote, optionId: string) => {
    const replace = (next: Vote) => setVotes((prev) => prev.map((v) => (v.id === next.id ? next : v)))
    setVoteError(await submitVote(vote, optionId, replace))
  }, [])

  return { votes, state, reload: load, castVote, voteError }
}

/** Yksi äänestys (yksityiskohtasivu). */
export function useVote(id: string | undefined) {
  const [vote, setVote] = useState<Vote | undefined>()
  const [state, setState] = useState<LoadState>('loading')
  const [voteError, setVoteError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    setState('loading')
    api
      .getVote(id)
      .then((v) => {
        setVote(v)
        setState('ready')
      })
      .catch((err) => {
        setVote(undefined)
        setState(err?.status === 404 ? 'ready' : 'error') // 404 → "ei löytynyt", muu → virhe
      })
  }, [id])

  useEffect(load, [load])

  const castVote = useCallback(
    async (optionId: string) => {
      if (!vote) return
      setVoteError(await submitVote(vote, optionId, setVote))
    },
    [vote],
  )

  return { vote, setVote, state, reload: load, castVote, voteError }
}
