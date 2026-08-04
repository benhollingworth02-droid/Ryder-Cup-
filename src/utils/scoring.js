export function getScore(scores, playerId, holeNumber) {
  return scores.find(s => s.player_id === playerId && s.hole_number === holeNumber)?.strokes ?? null
}

export function calcGross(scores, playerId) {
  return scores.filter(s => s.player_id === playerId).reduce((sum, s) => sum + s.strokes, 0)
}

export function holesPlayed(scores, playerId) {
  return scores.filter(s => s.player_id === playerId).length
}

// Net = gross − handicap (applied once at end). Returns null if no holes played.
export function calcNet(scores, playerId, handicap) {
  if (holesPlayed(scores, playerId) === 0) return null
  return calcGross(scores, playerId) - (handicap ?? 0)
}

// Leaderboard for a single round, sorted by net ascending (lowest wins).
export function buildRoundLeaderboard(scores, players) {
  return players
    .map(player => {
      const played = holesPlayed(scores, player.id)
      const gross  = calcGross(scores, player.id)
      const net    = played > 0 ? gross - player.handicap : null
      return { player, gross, net, played }
    })
    .sort((a, b) => {
      if (a.net === null && b.net === null) return 0
      if (a.net === null) return 1
      if (b.net === null) return -1
      return a.net - b.net
    })
}

// Trip-wide leaderboard across all rounds, sorted by total net ascending.
export function buildTripLeaderboard(allScores, rounds, players) {
  return players
    .map(player => {
      const roundEntries = rounds.map(round => {
        const rs = allScores.filter(s => s.round_id === round.id && s.player_id === player.id)
        if (rs.length === 0) return null
        const gross = rs.reduce((sum, s) => sum + s.strokes, 0)
        const net   = gross - player.handicap
        return { round, gross, net, played: rs.length }
      }).filter(Boolean)

      const roundsPlayed = roundEntries.length
      const totalGross   = roundEntries.reduce((sum, r) => sum + r.gross, 0)
      const totalNet     = roundEntries.reduce((sum, r) => sum + r.net, 0)
      const avgNet       = roundsPlayed > 0 ? totalNet / roundsPlayed : null

      return { player, roundEntries, roundsPlayed, totalGross, totalNet, avgNet }
    })
    .sort((a, b) => {
      if (a.roundsPlayed === 0 && b.roundsPlayed === 0) return 0
      if (a.roundsPlayed === 0) return 1
      if (b.roundsPlayed === 0) return -1
      return a.totalNet - b.totalNet
    })
}
