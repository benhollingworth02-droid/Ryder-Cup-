// Pure scoring utilities — no React imports, no side effects

// ─── ID / Date helpers ───────────────────────────────────────────────────────

export function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export function generateHoles(count) {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    par: 4,
    strokeIndex: i + 1,
    yardage: null,
  }))
}

// ─── PIN security (Web Crypto API) ───────────────────────────────────────────

export async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + ':golf-day-salt-v1')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPin(pin, hash) {
  return (await hashPin(pin)) === hash
}

// ─── Score display helpers ────────────────────────────────────────────────────

export function scoreDiff(gross, par) {
  if (gross == null) return null
  return gross - par
}

export function diffLabel(diff) {
  if (diff == null) return '—'
  if (diff === 0) return 'E'
  if (diff > 0) return `+${diff}`
  return String(diff)
}

export function scoreName(diff) {
  if (diff == null) return ''
  if (diff <= -3) return 'Albatross'
  if (diff === -2) return 'Eagle'
  if (diff === -1) return 'Birdie'
  if (diff === 0) return 'Par'
  if (diff === 1) return 'Bogey'
  if (diff === 2) return 'Double'
  return `+${diff}`
}

// Tailwind classes for score badge
export function scoreBadgeClass(diff) {
  if (diff == null) return 'bg-gray-700 text-gray-400'
  if (diff <= -2) return 'bg-yellow-400 text-yellow-900 font-black'
  if (diff === -1) return 'bg-red-500 text-white font-bold'
  if (diff === 0) return 'bg-gray-600 text-white'
  if (diff === 1) return 'bg-blue-700 text-white'
  return 'bg-gray-800 text-gray-500'
}

export function fmtPts(n) {
  if (n == null) return '0'
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

// ─── Handicap ────────────────────────────────────────────────────────────────

// Returns extra strokes a player receives on this hole
export function handicapStrokesOnHole(playerHandicap, holeStrokeIndex, numHoles) {
  if (!playerHandicap || !holeStrokeIndex) return 0
  const effective = numHoles === 9 ? Math.round(playerHandicap / 2) : playerHandicap
  // Base strokes (e.g., 24 handicap on 18 holes → 1 base stroke on every hole)
  const base = Math.floor(effective / numHoles)
  // Extra stroke if strokeIndex ≤ remainder
  const remainder = effective % numHoles
  const extra = holeStrokeIndex <= remainder ? 1 : 0
  return base + extra
}

// ─── Stableford ──────────────────────────────────────────────────────────────

export function stablefordPoints(gross, par, extraStrokes = 0) {
  if (gross == null) return null
  const netDiff = (gross - extraStrokes) - par
  if (netDiff >= 2) return 0
  if (netDiff === 1) return 1
  if (netDiff === 0) return 2
  if (netDiff === -1) return 3
  if (netDiff === -2) return 4
  return 5
}

// ─── Stroke play leaderboard ─────────────────────────────────────────────────

export function strokeTotals(playerScores, holes) {
  let strokes = 0, parSum = 0, completed = 0
  for (const hole of holes) {
    const s = playerScores?.[hole.number]
    if (s && s.gross != null && !s.pickedUp) {
      strokes += s.gross
      parSum += hole.par
      completed++
    }
  }
  return { strokes, parSum, diff: strokes - parSum, completed }
}

export function calcStrokeLeaderboard(players, scores, holes) {
  return players
    .map(p => ({ player: p, ...strokeTotals(scores[p.id], holes) }))
    .sort((a, b) => {
      if (a.completed === 0 && b.completed === 0) return 0
      if (a.completed === 0) return 1
      if (b.completed === 0) return -1
      return a.strokes - b.strokes
    })
    .map((r, i) => ({ ...r, position: i + 1 }))
}

// ─── Stableford leaderboard ──────────────────────────────────────────────────

export function stablefordTotals(playerScores, player, holes) {
  let points = 0, completed = 0
  for (const hole of holes) {
    const s = playerScores?.[hole.number]
    if (s && s.gross != null && !s.pickedUp) {
      const extra = handicapStrokesOnHole(player.handicap, hole.strokeIndex, holes.length)
      const pts = stablefordPoints(s.gross, hole.par, extra)
      if (pts != null) { points += pts; completed++ }
    }
  }
  return { points, completed }
}

export function calcStablefordLeaderboard(players, scores, holes) {
  return players
    .map(p => ({ player: p, ...stablefordTotals(scores[p.id], p, holes) }))
    .sort((a, b) => b.points - a.points)
    .map((r, i) => ({ ...r, position: i + 1 }))
}

// ─── Match play (hole-by-hole from scores) ───────────────────────────────────

// Returns the winner of a single hole for a match
export function holeWinner(holeNumber, match, scores) {
  const { type, teamAPlayerIds, teamBPlayerIds } = match
  let aScore, bScore

  if (type === 'fourballs') {
    const aArr = teamAPlayerIds.map(id => scores?.[id]?.[holeNumber]?.gross).filter(v => v != null)
    const bArr = teamBPlayerIds.map(id => scores?.[id]?.[holeNumber]?.gross).filter(v => v != null)
    if (!aArr.length || !bArr.length) return null
    aScore = Math.min(...aArr)
    bScore = Math.min(...bArr)
  } else {
    aScore = scores?.[teamAPlayerIds[0]]?.[holeNumber]?.gross
    bScore = scores?.[teamBPlayerIds[0]]?.[holeNumber]?.gross
    if (aScore == null || bScore == null) return null
  }

  if (aScore < bScore) return 'a'
  if (bScore < aScore) return 'b'
  return 'halved'
}

// Full match play status from scores (1v1 or fourball)
export function calcMatchPlayStatus(match, holes, scores) {
  const holeRange = match.holeRange || [1, holes[holes.length - 1]?.number || 18]
  const matchHoles = holes.filter(h => h.number >= holeRange[0] && h.number <= holeRange[1])

  let aUp = 0
  let holesPlayed = 0

  for (const hole of matchHoles) {
    const winner = holeWinner(hole.number, match, scores)
    if (winner === null) break
    if (winner === 'a') aUp++
    else if (winner === 'b') aUp--
    holesPlayed++
  }

  const holesRemaining = matchHoles.length - holesPlayed
  const absUp = Math.abs(aUp)
  const matchOver = holesPlayed > 0 && absUp > holesRemaining

  let statusText
  if (holesPlayed === 0) {
    statusText = 'Not started'
  } else if (matchOver) {
    statusText = holesRemaining === 0 ? `${absUp} Up` : `${absUp}&${holesRemaining}`
  } else if (aUp === 0) {
    statusText = 'All Square'
  } else if (absUp === holesRemaining && holesRemaining > 0) {
    statusText = `Dormie ${absUp}`
  } else {
    statusText = `${absUp} Up`
  }

  return {
    aUp,
    holesPlayed,
    holesRemaining,
    matchOver,
    winner: matchOver ? (aUp > 0 ? 'a' : 'b') : null,
    statusText,
    leadingSide: aUp > 0 ? 'a' : aUp < 0 ? 'b' : null,
  }
}

// ─── Ryder Cup / hole-by-hole match scoring ───────────────────────────────────

// Points for a single match using hole-by-hole method
export function calcMatchHoleByHoleScore(match, holes, scores) {
  const holeRange = match.holeRange || [1, holes[holes.length - 1]?.number || 18]
  const matchHoles = holes.filter(h => h.number >= holeRange[0] && h.number <= holeRange[1])

  let aPoints = 0, bPoints = 0
  const holeResults = {}

  for (const hole of matchHoles) {
    const winner = holeWinner(hole.number, match, scores)
    if (winner === null) { holeResults[hole.number] = null; continue }
    if (winner === 'a') { aPoints += 1; holeResults[hole.number] = 'a' }
    else if (winner === 'b') { bPoints += 1; holeResults[hole.number] = 'b' }
    else { aPoints += 0.5; bPoints += 0.5; holeResults[hole.number] = 'halved' }
  }

  const totalHoles = matchHoles.length
  const playedHoles = Object.values(holeResults).filter(v => v !== null).length

  return { aPoints, bPoints, holeResults, totalHoles, playedHoles }
}

// Team totals for a Ryder Cup round
export function calcRyderCupTotals(matches, holes, scores, scoringMethod) {
  let aTotal = 0, bTotal = 0

  for (const match of matches) {
    if (scoringMethod === 'holeByHole') {
      const { aPoints, bPoints } = calcMatchHoleByHoleScore(match, holes, scores)
      aTotal += aPoints
      bTotal += bPoints
    } else {
      if (match.result === 'teamAWin') aTotal += 1
      else if (match.result === 'teamBWin') bTotal += 1
      else if (match.result === 'halved') { aTotal += 0.5; bTotal += 0.5 }
    }
  }

  return { aTotal, bTotal }
}

// Max possible points for a Ryder Cup round
export function calcMaxRyderPoints(matches, holes, scoringMethod) {
  if (scoringMethod === 'matchResult') return matches.length
  return matches.reduce((sum, match) => {
    const holeRange = match.holeRange || [1, holes[holes.length - 1]?.number || 18]
    return sum + holes.filter(h => h.number >= holeRange[0] && h.number <= holeRange[1]).length
  }, 0)
}

// Ryder Cup status message
export function ryderStatusMsg(aTotal, bTotal, pointsToWin, teamAName, teamBName) {
  if (aTotal >= pointsToWin && aTotal > bTotal) return { msg: `${teamAName} win!`, winner: 'a' }
  if (bTotal >= pointsToWin && bTotal > aTotal) return { msg: `${teamBName} win!`, winner: 'b' }
  if (aTotal > bTotal) return { msg: `${teamAName} lead ${fmtPts(aTotal)}–${fmtPts(bTotal)}`, winner: null }
  if (bTotal > aTotal) return { msg: `${teamBName} lead ${fmtPts(bTotal)}–${fmtPts(aTotal)}`, winner: null }
  if (aTotal === 0) return { msg: 'No results yet', winner: null }
  return { msg: `Tied ${fmtPts(aTotal)}–${fmtPts(bTotal)}`, winner: null }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportRoundText(round) {
  const { roundName, courseName, date, format, players, holes, scores, teams, matches, ryderCupSettings } = round
  const lines = [
    roundName || 'Golf Round',
    courseName ? `Course: ${courseName}` : null,
    date ? `Date: ${date}` : null,
    `Format: ${format}`,
    '',
  ].filter(Boolean)

  if (format === 'strokePlay') {
    const lb = calcStrokeLeaderboard(players, scores, holes)
    lines.push('Leaderboard:')
    lb.forEach(r => lines.push(`${r.position}. ${r.player.name} — ${r.strokes} (${diffLabel(r.diff)})`))
  } else if (format === 'stableford') {
    const lb = calcStablefordLeaderboard(players, scores, holes)
    lines.push('Stableford Leaderboard:')
    lb.forEach(r => lines.push(`${r.position}. ${r.player.name} — ${r.points} pts`))
  } else if (format === 'ryderCup') {
    const teamA = teams[0]
    const teamB = teams[1]
    const { aTotal, bTotal } = calcRyderCupTotals(matches, holes, scores, ryderCupSettings?.scoringMethod)
    lines.push(`${teamA?.name || 'Team A'}: ${fmtPts(aTotal)}`)
    lines.push(`${teamB?.name || 'Team B'}: ${fmtPts(bTotal)}`)
    lines.push('')
    matches.forEach(m => {
      const aNames = m.teamAPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' & ')
      const bNames = m.teamBPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' & ')
      const resultMap = { teamAWin: `${teamA?.name} win`, teamBWin: `${teamB?.name} win`, halved: 'Halved' }
      lines.push(`${m.name}: ${aNames} vs ${bNames} — ${resultMap[m.result] || 'Not played'}`)
    })
  }

  return lines.join('\n')
}
