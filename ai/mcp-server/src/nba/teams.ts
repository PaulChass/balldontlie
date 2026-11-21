/**
 * Static table of the 30 NBA franchises.
 *
 * Team IDs are the stable `teamId` values used across every stats.nba.com and
 * cdn.nba.com endpoint; they do not change between seasons. Keeping them here
 * lets name->id resolution happen locally, with no extra network round-trip.
 */

export interface NbaTeam {
  /** stats.nba.com team id, e.g. 1610612744. */
  id: number;
  /** Three-letter tricode, e.g. "GSW". */
  tricode: string;
  /** City / region, e.g. "Golden State". */
  city: string;
  /** Nickname, e.g. "Warriors". */
  name: string;
}

export const TEAMS: readonly NbaTeam[] = [
  { id: 1610612737, tricode: "ATL", city: "Atlanta", name: "Hawks" },
  { id: 1610612738, tricode: "BOS", city: "Boston", name: "Celtics" },
  { id: 1610612751, tricode: "BKN", city: "Brooklyn", name: "Nets" },
  { id: 1610612766, tricode: "CHA", city: "Charlotte", name: "Hornets" },
  { id: 1610612741, tricode: "CHI", city: "Chicago", name: "Bulls" },
  { id: 1610612739, tricode: "CLE", city: "Cleveland", name: "Cavaliers" },
  { id: 1610612742, tricode: "DAL", city: "Dallas", name: "Mavericks" },
  { id: 1610612743, tricode: "DEN", city: "Denver", name: "Nuggets" },
  { id: 1610612765, tricode: "DET", city: "Detroit", name: "Pistons" },
  { id: 1610612744, tricode: "GSW", city: "Golden State", name: "Warriors" },
  { id: 1610612745, tricode: "HOU", city: "Houston", name: "Rockets" },
  { id: 1610612754, tricode: "IND", city: "Indiana", name: "Pacers" },
  { id: 1610612746, tricode: "LAC", city: "Los Angeles", name: "Clippers" },
  { id: 1610612747, tricode: "LAL", city: "Los Angeles", name: "Lakers" },
  { id: 1610612763, tricode: "MEM", city: "Memphis", name: "Grizzlies" },
  { id: 1610612748, tricode: "MIA", city: "Miami", name: "Heat" },
  { id: 1610612749, tricode: "MIL", city: "Milwaukee", name: "Bucks" },
  { id: 1610612750, tricode: "MIN", city: "Minnesota", name: "Timberwolves" },
  { id: 1610612740, tricode: "NOP", city: "New Orleans", name: "Pelicans" },
  { id: 1610612752, tricode: "NYK", city: "New York", name: "Knicks" },
  { id: 1610612760, tricode: "OKC", city: "Oklahoma City", name: "Thunder" },
  { id: 1610612753, tricode: "ORL", city: "Orlando", name: "Magic" },
  { id: 1610612755, tricode: "PHI", city: "Philadelphia", name: "76ers" },
  { id: 1610612756, tricode: "PHX", city: "Phoenix", name: "Suns" },
  { id: 1610612757, tricode: "POR", city: "Portland", name: "Trail Blazers" },
  { id: 1610612758, tricode: "SAC", city: "Sacramento", name: "Kings" },
  { id: 1610612759, tricode: "SAS", city: "San Antonio", name: "Spurs" },
  { id: 1610612761, tricode: "TOR", city: "Toronto", name: "Raptors" },
  { id: 1610612762, tricode: "UTA", city: "Utah", name: "Jazz" },
  { id: 1610612764, tricode: "WAS", city: "Washington", name: "Wizards" },
];

const BY_ID = new Map<number, NbaTeam>(TEAMS.map((t) => [t.id, t]));

/** Look up a team by its stats.nba.com id, or undefined if unknown. */
export function teamById(id: number): NbaTeam | undefined {
  return BY_ID.get(id);
}

/** Human label for a team id, falling back to the raw id when unknown. */
export function teamLabel(id: number): string {
  const team = BY_ID.get(id);
  return team ? `${team.city} ${team.name} (${team.tricode})` : `Team ${id}`;
}
