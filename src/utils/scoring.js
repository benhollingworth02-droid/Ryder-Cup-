export function fmtPts(n) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

export function calcHoleWinner(holeNumber, match, scores) {
  const { type, teamAPlayerIds, teamBPlayerIds } = match
  let aScore, bScore
  if (type === 'fourballs') {
    const aArr = teamAPlayerIds.map(id => scores[id]?.[holeNumber]?.gross).filter(v => v != null)
    const bArr = teamBPlayerIds.map(id => scores[id]?.[holeNumber]?.gross).filter(v => v != null)
    if (!aArr.length || !bArr.length) return null
    aScore = Math.min(...aArr)
    bScore = Math.min(...bArr)
  } else {
    aScore = scores[teamAPlayerIds[0]]?.[holeNumber]?.gross
    bScore = scores[teamBPlayerIds[0]]?.[holeNumber]?.gross
    if (aScore == null || bScore == null) return null
  }
  if (aScore < bScore) return 'a'
  if (bScore < aScore) return 'b'
  return 'halved'
}

export function calcMatchPoints(match, holes, scores) {
  const [start, end] = match.holeRange
  let a = 0, b = 0
  for (let h = start; h <= end; h++) {
    const winner = calcHoleWinner(h, match, scores)
    if (winner === 'a') a += 1
    else if (winner === 'b') b += 1
    else if (winner === 'halved') { a += 0.5; b += 0.5 }
  }
  return { a, b }
}

export function calcTotalPoints(matches, holes, scores) {
  let a = 0, b = 0
  for (const match of matches) {
    const pts = calcMatchPoints(match, holes, scores)
    a += pts.a
    b += pts.b
  }
  return { a, b }
}

export function calcTotalHolesPlayed(matches, holes, scores) {
  let total = 0
  for (const match of matches) {
    const [start, end] = match.holeRange
    for (let h = start; h <= end; h++) {
      if (calcHoleWinner(h, match, scores) !== null) total++
    }
  }
  return total
}

export function getStatusMsg(a, b, pointsToWin, nameA, nameB) {
  if (a >= pointsToWin) return { msg: `${nameA} win! 🏆`, winner: 'a' }
  if (b >= pointsToWin) return { msg: `${nameB} win! 🏆`, winner: 'b' }
  const diff = Math.abs(a - b)
  if (a === b) return { msg: 'All square', winner: null }
  const leader = a > b ? nameA : nameB
  return { msg: `${leader} lead by ${fmtPts(diff)}`, winner: null }
}
