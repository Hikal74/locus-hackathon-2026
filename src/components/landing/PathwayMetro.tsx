const LINES = [
  { key: "academics", label: "Academics", color: "#4C8DFF" },
  { key: "testprep", label: "Test Prep", color: "#F0B400" },
  { key: "passion", label: "Passion Project", color: "#FF5C46" },
  { key: "volunteering", label: "Volunteering", color: "#4CC26A" },
  { key: "leadership", label: "Leadership", color: "#B37CF2" },
  { key: "applications", label: "Applications", color: "#FF9645" },
] as const;

const INK = "var(--color-ink)";
const INK_FAINT = "var(--color-ink-faint)";

/**
 * Decorative, non-functional Mini-Metro-style map of the road to university —
 * six colored "lines" (Academics, Test Prep, Passion Project, Volunteering,
 * Leadership, Applications) running through grade-level milestone stations,
 * converging at two interchange hubs, and merging into one terminus. Purely
 * illustrative: no data behind it, nothing here is wired to the real engine.
 */
export function PathwayMetro() {
  return (
    <div className="overflow-x-auto">
      <svg
        width={2400}
        height={1000}
        viewBox="0 0 2400 1000"
        role="img"
        aria-label="A subway-map style diagram of six routes — academics, test prep, passion project, volunteering, leadership, and applications — converging on a university acceptance terminus"
        className="block min-w-[1400px]"
      >
        {/* zone labels */}
        <text x={270} y={95} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={2} fill={INK_FAINT}>9TH GRADE</text>
        <text x={640} y={95} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={2} fill={INK_FAINT}>10TH GRADE</text>
        <text x={1160} y={95} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={2} fill={INK_FAINT}>11TH GRADE</text>
        <text x={1680} y={95} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={2} fill={INK_FAINT}>12TH GRADE</text>

        {/* lines */}
        <path d="M160,180 L380,180 L680,480 L900,470 L1120,470 L1420,180 L1720,480 L1940,470 L2200,480" fill="none" stroke={LINES[0].color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M160,300 L380,300 L560,480 L900,474 L1240,474 L1420,300 L1600,480 L1940,474 L2200,480" fill="none" stroke={LINES[1].color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M160,420 L380,420 L440,480 L900,478 L1360,478 L1420,420 L1480,480 L1940,478 L2200,480" fill="none" stroke={LINES[2].color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M160,540 L380,540 L440,480 L900,482 L1360,482 L1420,540 L1480,480 L1940,482 L2200,480" fill="none" stroke={LINES[3].color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M160,660 L380,660 L560,480 L900,486 L1240,486 L1420,660 L1600,480 L1940,486 L2200,480" fill="none" stroke={LINES[4].color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M160,780 L380,780 L680,480 L900,490 L1120,490 L1420,780 L1720,480 L1940,490 L2200,480" fill="none" stroke={LINES[5].color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />

        {/* decorative trains */}
        <g>
          <rect x={255} y={173} width={32} height={14} rx={5} fill={LINES[0].color} />
          <circle cx={264} cy={180} r={2} fill="var(--color-paper)" />
          <circle cx={278} cy={180} r={2} fill="var(--color-paper)" />
        </g>
        <g>
          <rect x={255} y={773} width={32} height={14} rx={5} fill={LINES[5].color} />
          <circle cx={264} cy={780} r={2} fill="var(--color-paper)" />
          <circle cx={278} cy={780} r={2} fill="var(--color-paper)" />
        </g>
        <g>
          <rect x={2100} y={473} width={32} height={14} rx={5} fill={LINES[4].color} />
          <circle cx={2109} cy={480} r={2} fill="var(--color-paper)" />
          <circle cx={2123} cy={480} r={2} fill="var(--color-paper)" />
        </g>

        {/* interchange hub 1 */}
        <circle cx={900} cy={480} r={30} fill="var(--color-ink)" />
        <circle cx={900} cy={480} r={13} fill="none" stroke="var(--color-paper)" strokeWidth={3} />
        <line x1={900} y1={390} x2={900} y2={450} stroke={INK_FAINT} strokeWidth={3} />
        <rect x={780} y={336} width={240} height={54} rx={10} fill="var(--color-ink)" />
        <text x={900} y={358} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={1} fill="var(--color-paper)">JUNIOR YEAR</text>
        <text x={900} y={378} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={1} fill="var(--color-paper)">CRUNCH</text>

        {/* overcrowding warning */}
        <path d="M1045,316 L1061,346 L1029,346 Z" fill="#FF5C46" stroke="var(--color-paper)" strokeWidth={2} strokeLinejoin="round" />
        <line x1={1045} y1={326} x2={1045} y2={336} stroke="var(--color-paper)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={1045} cy={341} r={1.6} fill="var(--color-paper)" />

        {/* interchange hub 2 */}
        <circle cx={1940} cy={480} r={30} fill="var(--color-ink)" />
        <circle cx={1940} cy={480} r={13} fill="none" stroke="var(--color-paper)" strokeWidth={3} />
        <line x1={1940} y1={390} x2={1940} y2={450} stroke={INK_FAINT} strokeWidth={3} />
        <rect x={1820} y={336} width={240} height={54} rx={10} fill="var(--color-ink)" />
        <text x={1940} y={358} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={1} fill="var(--color-paper)">APPLICATION</text>
        <text x={1940} y={378} textAnchor="middle" fontSize={16} fontWeight={700} letterSpacing={1} fill="var(--color-paper)">SEASON</text>

        {/* terminus: University */}
        <path
          d="M2200,434 L2211.76,463.82 L2243.75,465.79 L2219.02,486.18 L2227.04,517.21 L2200,500 L2172.96,517.21 L2180.98,486.18 L2156.25,465.79 L2188.24,463.82 Z"
          fill="#F0B400"
          stroke="var(--color-ink)"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <text x={2200} y={558} textAnchor="middle" fontSize={20} fontWeight={800} letterSpacing={1} fill={INK}>UNIVERSITY</text>
        <text x={2200} y={581} textAnchor="middle" fontSize={20} fontWeight={800} letterSpacing={1} fill={INK}>ACCEPTANCE</text>
        <text x={2200} y={602} textAnchor="middle" fontSize={14} fontStyle="italic" fontWeight={500} fill={INK_FAINT}>you made it.</text>

        {/* Academics stations (above) */}
        <circle cx={160} cy={180} r={15} fill="var(--color-ink)" />
        <text x={160} y={154} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Build Study Habits</text>
        <circle cx={380} cy={180} r={15} fill="var(--color-ink)" />
        <text x={380} y={154} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Honors &amp; AP Classes</text>
        <circle cx={1420} cy={180} r={15} fill="var(--color-ink)" />
        <text x={1420} y={154} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Keep Grades Up</text>

        {/* Test Prep stations (above) */}
        <circle cx={160} cy={300} r={15} fill="var(--color-ink)" />
        <text x={160} y={274} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Take the PSAT</text>
        <circle cx={380} cy={300} r={15} fill="var(--color-ink)" />
        <text x={380} y={274} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Practice Consistently</text>
        <circle cx={1420} cy={300} r={15} fill="var(--color-ink)" />
        <text x={1420} y={274} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>SAT / ACT Test Day</text>

        {/* Passion Project stations (above) */}
        <circle cx={160} cy={420} r={15} fill="var(--color-ink)" />
        <text x={160} y={394} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Explore Interests</text>
        <circle cx={380} cy={420} r={15} fill="var(--color-ink)" />
        <text x={380} y={394} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Start a Real Project</text>
        <circle cx={1420} cy={420} r={15} fill="var(--color-ink)" />
        <text x={1420} y={394} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Show Results &amp; Impact</text>

        {/* Volunteering stations (below) */}
        <circle cx={160} cy={540} r={15} fill="var(--color-ink)" />
        <text x={160} y={574} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>First Volunteer Hours</text>
        <circle cx={380} cy={540} r={15} fill="var(--color-ink)" />
        <text x={380} y={574} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Commit Regularly</text>
        <circle cx={1420} cy={540} r={15} fill="var(--color-ink)" />
        <text x={1420} y={574} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Lead a Service Project</text>

        {/* Leadership stations (below) */}
        <circle cx={160} cy={660} r={15} fill="var(--color-ink)" />
        <text x={160} y={694} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Join a Club or Team</text>
        <circle cx={380} cy={660} r={15} fill="var(--color-ink)" />
        <text x={380} y={694} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Take on Responsibility</text>
        <circle cx={1420} cy={660} r={15} fill="var(--color-ink)" />
        <text x={1420} y={694} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Earn an Officer Role</text>

        {/* Applications stations (below) */}
        <circle cx={160} cy={780} r={15} fill="var(--color-ink)" />
        <text x={160} y={814} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Research Target Schools</text>
        <circle cx={380} cy={780} r={15} fill="var(--color-ink)" />
        <text x={380} y={814} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Build Your College List</text>
        <circle cx={1420} cy={780} r={15} fill="var(--color-ink)" />
        <text x={1420} y={814} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>Finalize Essays &amp; Recs</text>
      </svg>
    </div>
  );
}

export { LINES as PATHWAY_METRO_LINES };
