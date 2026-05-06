import { generateHoles, generateId } from '../utils/scoring.js'

// Ryder Cup Golf Day preset — fully editable after loading
export const RYDER_CUP_PRESET = {
  roundName: 'Ryder Cup Golf Day',
  courseName: '',
  date: new Date().toISOString().split('T')[0],
  format: 'ryderCup',
  numHoles: 18,
  holes: generateHoles(18),
  roundStarted: false,
  teams: [
    { id: 'team-h', name: 'Team Hollingworth', color: 'blue' },
    { id: 'team-w', name: 'Team Wagstaff', color: 'red' },
  ],
  players: [
    { id: 'h1', name: 'Nick Jacobsen',      handicap: null, teamId: 'team-h' },
    { id: 'h2', name: 'Pearce Childs',       handicap: null, teamId: 'team-h' },
    { id: 'h3', name: 'Joe Colebrook',       handicap: null, teamId: 'team-h' },
    { id: 'h4', name: 'Ben Hollingworth',    handicap: null, teamId: 'team-h' },
    { id: 'h5', name: 'Fin Morgan',          handicap: null, teamId: 'team-h' },
    { id: 'h6', name: 'Seb Mehjoo',         handicap: null, teamId: 'team-h' },
    { id: 'w1', name: 'Alex Griffiths',      handicap: null, teamId: 'team-w' },
    { id: 'w2', name: 'Will Upton',          handicap: null, teamId: 'team-w' },
    { id: 'w3', name: 'Max Campbell',        handicap: null, teamId: 'team-w' },
    { id: 'w4', name: 'Euan Vaugh-Hawkins', handicap: null, teamId: 'team-w' },
    { id: 'w5', name: 'Ed Wagstaff',         handicap: null, teamId: 'team-w' },
    { id: 'w6', name: 'Tom Reynolds',        handicap: null, teamId: 'team-w' },
  ],
  matches: [
    // Front 9 — Fourballs (holes 1–9)
    {
      id: 'm1', name: 'Fourball 1', type: 'fourballs', section: 'Front 9 — Fourballs',
      holeRange: [1, 9],
      teamAPlayerIds: ['h1', 'h6'], teamBPlayerIds: ['w1', 'w6'], result: null,
    },
    {
      id: 'm2', name: 'Fourball 2', type: 'fourballs', section: 'Front 9 — Fourballs',
      holeRange: [1, 9],
      teamAPlayerIds: ['h2', 'h5'], teamBPlayerIds: ['w2', 'w5'], result: null,
    },
    {
      id: 'm3', name: 'Fourball 3', type: 'fourballs', section: 'Front 9 — Fourballs',
      holeRange: [1, 9],
      teamAPlayerIds: ['h3', 'h4'], teamBPlayerIds: ['w3', 'w4'], result: null,
    },
    // Back 9 — Singles (holes 10–18)
    {
      id: 'm4', name: 'Singles 1', type: 'singles', section: 'Back 9 — Singles',
      holeRange: [10, 18],
      teamAPlayerIds: ['h1'], teamBPlayerIds: ['w1'], result: null,
    },
    {
      id: 'm5', name: 'Singles 2', type: 'singles', section: 'Back 9 — Singles',
      holeRange: [10, 18],
      teamAPlayerIds: ['h2'], teamBPlayerIds: ['w2'], result: null,
    },
    {
      id: 'm6', name: 'Singles 3', type: 'singles', section: 'Back 9 — Singles',
      holeRange: [10, 18],
      teamAPlayerIds: ['h3'], teamBPlayerIds: ['w3'], result: null,
    },
    {
      id: 'm7', name: 'Singles 4', type: 'singles', section: 'Back 9 — Singles',
      holeRange: [10, 18],
      teamAPlayerIds: ['h4'], teamBPlayerIds: ['w4'], result: null,
    },
    {
      id: 'm8', name: 'Singles 5', type: 'singles', section: 'Back 9 — Singles',
      holeRange: [10, 18],
      teamAPlayerIds: ['h5'], teamBPlayerIds: ['w5'], result: null,
    },
    {
      id: 'm9', name: 'Singles 6', type: 'singles', section: 'Back 9 — Singles',
      holeRange: [10, 18],
      teamAPlayerIds: ['h6'], teamBPlayerIds: ['w6'], result: null,
    },
  ],
  ryderCupSettings: {
    scoringMethod: 'holeByHole', // 'matchResult' | 'holeByHole'
    pointsToWin: 41,
    totalPoints: 81,
  },
  scores: {
    h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, h6: {},
    w1: {}, w2: {}, w3: {}, w4: {}, w5: {}, w6: {},
  },
}
