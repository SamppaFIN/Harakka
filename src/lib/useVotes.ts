import { useCallback, useEffect, useState } from 'react'
import { MOCK_VOTES } from '../mocks/votes'
import { readJSON, writeJSON, STORAGE_KEYS } from './storage'
import type { Vote, VoteMedia } from '../types'

type MyVotes = Record<string, string> // voteId -> optionId

/**
 * Keskitetty hook äänestysten tilaan. Lataa mock-datan localStorageen
 * ensimmäisellä käynnistyksellä ja pitää sen jälkeen synkassa.
 */
export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>(() => readJSON(STORAGE_KEYS.votes, MOCK_VOTES))
  const [myVotes, setMyVotes] = useState<MyVotes>(() => readJSON(STORAGE_KEYS.myVotes, {}))
  const [storageFull, setStorageFull] = useState(false)

  // Synkronointi ulkoiseen järjestelmään (localStorage). Tila päivitetään vain jos
  // onnistumistila oikeasti muuttui, jotta turhia uudelleenrenderöintejä ei synny.
  useEffect(() => {
    const ok = writeJSON(STORAGE_KEYS.votes, votes)
    setStorageFull((prev) => (prev === !ok ? prev : !ok))
  }, [votes])

  useEffect(() => {
    writeJSON(STORAGE_KEYS.myVotes, myVotes)
  }, [myVotes])

  const getVote = useCallback((id: string) => votes.find((v) => v.id === id), [votes])

  const castVote = useCallback((voteId: string, optionId: string) => {
    setVotes((prev) =>
      prev.map((vote) => {
        if (vote.id !== voteId) return vote
        const previousOptionId = myVotes[voteId]
        if (previousOptionId === optionId) return vote // ei muutosta

        return {
          ...vote,
          options: vote.options.map((opt) => {
            if (opt.id === previousOptionId) return { ...opt, votes: Math.max(0, opt.votes - 1) }
            if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 }
            return opt
          }),
        }
      }),
    )
    setMyVotes((prev) => ({ ...prev, [voteId]: optionId }))
  }, [myVotes])

  const createVote = useCallback(
    (input: {
      title: string
      description: string
      options: { text: string; color?: string }[]
      closesAt: string
      media?: VoteMedia
    }) => {
      const id = `v_${Date.now().toString(36)}`
      const newVote: Vote = {
        id,
        title: input.title.trim(),
        description: input.description.trim(),
        media: input.media,
        options: input.options.map((opt, i) => ({
          id: `${id}-${i}`,
          text: opt.text.trim(),
          color: opt.color,
          votes: 0,
        })),
        closesAt: input.closesAt,
        createdAt: new Date().toISOString(),
      }
      setVotes((prev) => [newVote, ...prev])
      return id
    },
    [],
  )

  return {
    votes,
    myVotes,
    storageFull,
    getVote,
    myVoteFor: (voteId: string) => myVotes[voteId],
    castVote,
    createVote,
  }
}
