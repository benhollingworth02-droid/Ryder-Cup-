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

// ── Tournament helpers ────────────────────────────────────────────────────────

function buildFourballGroupMatchStatus(scores, groupRPs, players, courseHoles, totalHoles) {
  const team1RPs = groupRPs.filter(rp => rp.team === 1)
  const team2RPs = groupRPs.filter(rp => rp.team === 2)
  if (!team1RPs.length || !team2RPs.length) return null

  const holeResults = []
  for (let h = 1; h <= totalHoles; h++) {
    const si = getHoleSI(courseHoles, h)
    const bestNet = (teamRPs) => {
      const nets = teamRPs.map(rp => {
        const s = scores.find(sc => sc.player_id === rp.player_id && sc.hole_number === h)
        return s ? s.strokes - shotsReceived(si, rp.playing_handicap) : null
      }).filter(n => n !== null)
      return nets.length === teamRPs.length ? Math.min(...nets) : null
    }
    const nA = bestNet(team1RPs)
    const nB = bestNet(team2RPs)
    if (nA === null || nB === null) { holeResults.push(null); continue }
    holeResults.push(nA < nB ? 'a' : nA > nB ? 'b' : 'halved')
  }
  return calcMatchStatus(holeResults, totalHoles)
}

// Match status for one fourball group — used by Scoring.jsx
export function getFourballGroupMatchStatus(scores, roundPlayers, players, courseHoles, groupNum, totalHoles) {
  const groupRPs = roundPlayers.filter(rp => rp.group_num === groupNum)
  return buildFourballGroupMatchStatus(scores, groupRPs, players, courseHoles, totalHoles)
}

// Ryder Cup: aggregate points across all fourball groups
export function buildRydercupResult(scores, roundPlayers, players, courseHoles, round) {
  const groups = [...new Set(roundPlayers.map(rp => rp.group_num).filter(Boolean))].sort((a, b) => a - b)
  let team1Points = 0, team2Points = 0
  const fourballs = []

  for (const groupNum of groups) {
    const groupRPs = roundPlayers.filter(rp => rp.group_num === groupNum)
    const matchResult = buildFourballGroupMatchStatus(scores, groupRPs, players, courseHoles, round?.holes ?? 18)

    let pts1 = 0, pts2 = 0
    if (matchResult) {
      const { aUp, played, remaining, finished } = matchResult
      const concluded = finished || played === (round?.holes ?? 18)
      if (concluded) {
        if (aUp > 0)      { pts1 = 1 }
        else if (aUp < 0) { pts2 = 1 }
        else              { pts1 = 0.5; pts2 = 0.5 }
      }
    }

    team1Points += pts1
    team2Points += pts2
    fourballs.push({ groupNum, matchResult, pts1, pts2 })
  }

  return { team1Points, team2Points, fourballs }
}

// Team stroke: aggregate net scores by team
export function buildTeamStrokeResult(scores, roundPlayers, players) {
  const getNet = (rp) => {
    const ps = scores.filter(s => s.player_id === rp.player_id)
    if (!ps.length) return null
    return ps.reduce((sum, s) => sum + s.strokes, 0) - rp.playing_handicap
  }

  const team1RPs = roundPlayers.filter(rp => rp.team === 1)
  const team2RPs = roundPlayers.filter(rp => rp.team === 2)

  const team1Entries = team1RPs.map(rp => ({
    player: players.find(p => p.id === rp.player_id),
    net: getNet(rp), hcp: rp.playing_handicap,
  })).filter(e => e.player).sort((a, b) => (a.net ?? 999) - (b.net ?? 999))

  const team2Entries = team2RPs.map(rp => ({
    player: players.find(p => p.id === rp.player_id),
    net: getNet(rp), hcp: rp.playing_handicap,
  })).filter(e => e.player).sort((a, b) => (a.net ?? 999) - (b.net ?? 999))

  const team1Total = team1Entries.filter(e => e.net !== null).reduce((s, e) => s + e.net, 0)
  const team2Total = team2Entries.filter(e => e.net !== null).reduce((s, e) => s + e.net, 0)

  return { team1Total, team2Total, team1Entries, team2Entries }
}

// Scramble team handicap: 0.6 × lower + 0.4 × higher
export function scrambleTeamHcp(hcpA, hcpB) {
  const lo = Math.min(hcpA, hcpB)
  const hi = Math.max(hcpA, hcpB)
  return Math.round(0.6 * lo + 0.4 * hi)
}

// Pairs Competition: each pair's combined net (gross1−hcp1 + gross2−hcp2), ranked ascending
export function buildPairsLeaderboard(scores, roundPlayers, players) {
  const groups = [...new Set(roundPlayers.map(rp => rp.group_num).filter(Boolean))].sort((a, b) => a - b)
  const entries = groups.flatMap(groupNum => {
    const groupRPs = roundPlayers.filter(rp => rp.group_num === groupNum)
    return [1, 2].map(teamNum => {
      const teamRPs = groupRPs.filter(rp => rp.team === teamNum)
      if (!teamRPs.length) return null
      const members = teamRPs
        .map(rp => ({ player: players.find(p => p.id === rp.player_id), hcp: rp.playing_handicap }))
        .filter(m => m.player)
      const hasScores = members.some(m => scores.some(s => s.player_id === m.player.id))
      const combinedNet = hasScores
        ? members.reduce((sum, m) => {
            const gross = scores.filter(s => s.player_id === m.player.id).reduce((a, s) => a + s.strokes, 0)
            return sum + gross - m.hcp
          }, 0)
        : null
      return { members, combinedNet, groupNum, teamNum }
    }).filter(Boolean)
  })
  return entries.sort((a, b) => {
    if (a.combinedNet === null && b.combinedNet === null) return 0
    if (a.combinedNet === null) return 1
    if (b.combinedNet === null) return -1
    return a.combinedNet - b.combinedNet
  })
}

// Scramble: team gross (from first player's scores) minus team handicap, ranked ascending
export function buildScrambleLeaderboard(scores, roundPlayers, players) {
  const groups = [...new Set(roundPlayers.map(rp => rp.group_num).filter(Boolean))].sort((a, b) => a - b)
  const entries = groups.flatMap(groupNum => {
    const groupRPs = roundPlayers.filter(rp => rp.group_num === groupNum)
    return [1, 2].map(teamNum => {
      const teamRPs = groupRPs.filter(rp => rp.team === teamNum)
      if (!teamRPs.length) return null
      const members = teamRPs
        .map(rp => ({ player: players.find(p => p.id === rp.player_id), hcp: rp.playing_handicap }))
        .filter(m => m.player)
      const hcps = members.map(m => m.hcp)
      const teamHcp = hcps.length >= 2 ? scrambleTeamHcp(hcps[0], hcps[1]) : (hcps[0] ?? 0)
      const firstRpId = teamRPs[0]?.player_id
      const teamScores = firstRpId ? scores.filter(s => s.player_id === firstRpId) : []
      const gross = teamScores.reduce((sum, s) => sum + s.strokes, 0)
      const played = teamScores.length
      const net = played > 0 ? gross - teamHcp : null
      return { members, gross, teamHcp, net, played, groupNum, teamNum }
    }).filter(Boolean)
  })
  return entries.sort((a, b) => {
    if (a.net === null && b.net === null) return 0
    if (a.net === null) return 1
    if (b.net === null) return -1
    return a.net - b.net
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
