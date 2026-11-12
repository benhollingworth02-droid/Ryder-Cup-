// ── Basic helpers ─────────────────────────────────────────────────────────────

export function getScore(scores, playerId, holeNumber) {
  return scores.find(s => s.player_id === playerId && s.hole_number === holeNumber)?.strokes ?? null
}

export function calcGross(scores, playerId) {
  return scores.filter(s => s.player_id === playerId).reduce((sum, s) => sum + s.strokes, 0)
}

export function holesPlayed(scores, playerId) {
  return scores.filter(s => s.player_id === playerId).length
}

// ── Course helpers ────────────────────────────────────────────────────────────

export function getHolePar(courseHoles, holeNumber) {
  return courseHoles?.find(h => h.number === holeNumber)?.par ?? 4
}

export function getHoleSI(courseHoles, holeNumber) {
  return courseHoles?.find(h => h.number === holeNumber)?.stroke_index ?? holeNumber
}

// ── Handicap allocation ───────────────────────────────────────────────────────

// Shots received on a hole given its stroke index and playing handicap
export function shotsReceived(strokeIndex, playingHandicap) {
  if (!playingHandicap || playingHandicap <= 0) return 0
  const base  = Math.floor(playingHandicap / 18)
  const extra = playingHandicap % 18
  return base + (strokeIndex <= extra ? 1 : 0)
}

// ── Stableford ────────────────────────────────────────────────────────────────

export function stablefordPoints(gross, par, shots) {
  if (gross === null || gross === undefined) return null
  return Math.max(0, par + 2 - (gross - shots))
}

export function calcPlayerStableford(scores, playerId, courseHoles, roundPlayer) {
  const playerScores = scores.filter(s => s.player_id === playerId)
  if (playerScores.length === 0) return 0
  return playerScores.reduce((sum, s) => {
    const par  = getHolePar(courseHoles, s.hole_number)
    const si   = getHoleSI(courseHoles, s.hole_number)
    const shots = shotsReceived(si, roundPlayer?.playing_handicap ?? 0)
    return sum + Math.max(0, par + 2 - (s.strokes - shots))
  }, 0)
}

// ── Match play ────────────────────────────────────────────────────────────────

function holeNet(gross, si, playingHandicap) {
  if (gross === null || gross === undefined) return null
  return gross - shotsReceived(si, playingHandicap ?? 0)
}

// Returns 'a' | 'b' | 'halved' | null (not all players have scored this hole)
export function calcHoleMatchResult(holeNum, scores, roundPlayers, courseHoles) {
  const teamA = roundPlayers.filter(rp => rp.team === 1)
  const teamB = roundPlayers.filter(rp => rp.team === 2)
  if (teamA.length === 0 || teamB.length === 0) return null

  const si = getHoleSI(courseHoles, holeNum)

  const bestNet = (team) => {
    const nets = team
      .map(rp => {
        const gross = scores.find(s => s.player_id === rp.player_id && s.hole_number === holeNum)?.strokes ?? null
        return holeNet(gross, si, rp.playing_handicap)
      })
      .filter(n => n !== null)
    return nets.length === team.length ? Math.min(...nets) : null
  }

  const netA = bestNet(teamA)
  const netB = bestNet(teamB)
  if (netA === null || netB === null) return null

  if (netA < netB) return 'a'
  if (netB < netA) return 'b'
  return 'halved'
}

export function calcMatchStatus(holeResults, totalHoles) {
  let aUp = 0, played = 0
  for (const r of holeResults) {
    if (r !== null && r !== undefined) {
      played++
      if (r === 'a') aUp++
      else if (r === 'b') aUp--
    }
  }
  const remaining = totalHoles - played
  const finished  = played > 0 && (played === totalHoles || Math.abs(aUp) > remaining)
  return { aUp, played, remaining, finished }
}

export function matchStatusText(status, sideAName, sideBName) {
  const { aUp, played, remaining, finished } = status
  if (played === 0) return 'All Square'

  if (finished) {
    if (aUp === 0) return 'All Square after 18 (play-off)'
    const winner = aUp > 0 ? sideAName : sideBName
    const margin = Math.abs(aUp)
    if (remaining === 0) return `${winner} wins ${margin} Up`
    return `${winner} wins ${margin}&${remaining}`
  }

  if (aUp === 0) return `All Square · ${remaining} to play`
  const leader = aUp > 0 ? sideAName : sideBName
  return `${leader} ${Math.abs(aUp)} Up · ${remaining} to play`
}

// ── Leaderboards ──────────────────────────────────────────────────────────────

export function buildRoundLeaderboard(scores, players, roundPlayers) {
  const rp = roundPlayers ?? []
  return players
    .map(player => {
      const rpEntry = rp.find(r => r.player_id === player.id)
      const hcp     = rpEntry?.playing_handicap ?? player.handicap
      const played  = holesPlayed(scores, player.id)
      const gross   = calcGross(scores, player.id)
      const net     = played > 0 ? gross - hcp : null
      return { player, gross, net, played, playingHandicap: hcp }
    })
    .sort((a, b) => {
      if (a.net === null && b.net === null) return 0
      if (a.net === null) return 1
      if (b.net === null) return -1
      return a.net - b.net
    })
}

export function buildStablefordLeaderboard(scores, players, roundPlayers, courseHoles) {
  const rp = roundPlayers ?? []
  return players
    .map(player => {
      const rpEntry = rp.find(r => r.player_id === player.id)
      const hcp    = rpEntry?.playing_handicap ?? player.handicap
      const played = holesPlayed(scores, player.id)
      const pts    = played > 0
        ? calcPlayerStableford(scores, player.id, courseHoles ?? [], rpEntry)
        : null
      return { player, points: pts, played, playingHandicap: hcp }
    })
    .sort((a, b) => {
      if (a.points === null && b.points === null) return 0
      if (a.points === null) return 1
      if (b.points === null) return -1
      return b.points - a.points
    })
}

export function buildTripLeaderboard(allScores, rounds, players, allRoundPlayers) {
  const rp = allRoundPlayers ?? []
  const eligibleRounds = rounds.filter(r => r.format === 'stroke' || r.format === 'stableford' || !r.format)
  return players
    .map(player => {
      const roundEntries = eligibleRounds
        .map(round => {
          const rs = allScores.filter(s => s.round_id === round.id && s.player_id === player.id)
          if (rs.length === 0) return null
          const rpEntry = rp.find(r => r.round_id === round.id && r.player_id === player.id)
          const hcp     = rpEntry?.playing_handicap ?? player.handicap
          const gross   = rs.reduce((sum, s) => sum + s.strokes, 0)
          return { round, gross, net: gross - hcp, played: rs.length }
        })
        .filter(Boolean)

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
