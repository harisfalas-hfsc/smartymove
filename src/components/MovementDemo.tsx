/**
 * MovementDemo — minimalist animated stick-figure SVG that shows the user
 * what each Movement Screen test looks like. Pure CSS keyframes; one figure
 * per test id.
 */

type Props = { testId: string; className?: string };

const STYLE = `
@keyframes mv-squat { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(18px) scaleY(0.85); } }
@keyframes mv-hinge { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(38deg); } }
@keyframes mv-balance { 0%,100% { transform: translateX(-2px); } 50% { transform: translateX(2px); } }
@keyframes mv-balance-leg { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-25deg); } }
@keyframes mv-overhead { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-150deg); } }
@keyframes mv-lunge-leg { 0%,100% { transform: translateX(0) translateY(0) rotate(0deg); } 50% { transform: translateX(22px) translateY(8px) rotate(45deg); } }
@keyframes mv-ankle { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(28deg); } }
@keyframes mv-step { 0%,100% { transform: translateY(0); } 50% { transform: translateY(14px); } }
@keyframes mv-hipabd { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(35deg); } }
@keyframes mv-bridge { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes mv-wallslide { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-50deg); } }
@keyframes mv-elbow { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-110deg); } }
@keyframes mv-wrist { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-45deg); } }
`;

function Body({ children, viewBox = "0 0 200 220" }: { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className="h-full w-full" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {children}
    </svg>
  );
}

export function MovementDemo({ testId, className }: Props) {
  return (
    <div className={className ?? "h-44 w-full text-primary"}>
      <style>{STYLE}</style>
      {render(testId)}
    </div>
  );
}

function render(id: string) {
  switch (id) {
    case "squat": return (
      <Body>
        <g style={{ animation: "mv-squat 1.8s ease-in-out infinite", transformOrigin: "100px 110px" }}>
          <circle cx="100" cy="40" r="14" />
          <line x1="100" y1="54" x2="100" y2="120" />
          <line x1="100" y1="70" x2="68" y2="90" />
          <line x1="100" y1="70" x2="132" y2="90" />
          <line x1="100" y1="120" x2="80" y2="170" />
          <line x1="100" y1="120" x2="120" y2="170" />
          <line x1="80" y1="170" x2="74" y2="200" />
          <line x1="120" y1="170" x2="126" y2="200" />
        </g>
        <line x1="40" y1="200" x2="160" y2="200" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "hinge": return (
      <Body>
        <g style={{ animation: "mv-hinge 2s ease-in-out infinite", transformOrigin: "100px 130px" }}>
          <circle cx="100" cy="40" r="14" />
          <line x1="100" y1="54" x2="100" y2="130" />
          <line x1="100" y1="70" x2="70" y2="100" />
          <line x1="100" y1="70" x2="130" y2="100" />
        </g>
        <line x1="100" y1="130" x2="100" y2="200" />
        <line x1="80" y1="200" x2="120" y2="200" />
        <line x1="40" y1="208" x2="160" y2="208" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "balance": return (
      <Body>
        <g style={{ animation: "mv-balance 1.4s ease-in-out infinite", transformOrigin: "100px 200px" }}>
          <circle cx="100" cy="40" r="14" />
          <line x1="100" y1="54" x2="100" y2="130" />
          <line x1="100" y1="70" x2="74" y2="100" />
          <line x1="100" y1="70" x2="126" y2="100" />
          <line x1="100" y1="130" x2="100" y2="200" />
          <g style={{ animation: "mv-balance-leg 1.4s ease-in-out infinite", transformOrigin: "100px 130px" }}>
            <line x1="100" y1="130" x2="120" y2="190" />
          </g>
        </g>
        <line x1="40" y1="200" x2="160" y2="200" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "lunge": return (
      <Body>
        <circle cx="100" cy="40" r="14" />
        <line x1="100" y1="54" x2="100" y2="120" />
        <line x1="100" y1="70" x2="78" y2="100" />
        <line x1="100" y1="70" x2="122" y2="100" />
        <line x1="100" y1="120" x2="90" y2="170" />
        <line x1="90" y1="170" x2="92" y2="200" />
        <g style={{ animation: "mv-lunge-leg 2s ease-in-out infinite", transformOrigin: "100px 120px" }}>
          <line x1="100" y1="120" x2="120" y2="170" />
          <line x1="120" y1="170" x2="140" y2="200" />
        </g>
        <line x1="40" y1="200" x2="170" y2="200" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "overhead": return (
      <Body>
        <circle cx="100" cy="55" r="14" />
        <line x1="100" y1="69" x2="100" y2="140" />
        <g style={{ animation: "mv-overhead 2s ease-in-out infinite", transformOrigin: "100px 80px" }}>
          <line x1="100" y1="80" x2="68" y2="120" />
        </g>
        <g style={{ animation: "mv-overhead 2s ease-in-out infinite", transformOrigin: "100px 80px" }}>
          <line x1="100" y1="80" x2="132" y2="120" />
        </g>
        <line x1="100" y1="140" x2="82" y2="200" />
        <line x1="100" y1="140" x2="118" y2="200" />
        <line x1="40" y1="205" x2="160" y2="205" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "ankle_df": return (
      <Body>
        <circle cx="80" cy="60" r="12" />
        <line x1="80" y1="72" x2="80" y2="120" />
        <line x1="80" y1="120" x2="60" y2="180" />
        <line x1="60" y1="180" x2="50" y2="205" />
        <g style={{ animation: "mv-ankle 1.8s ease-in-out infinite", transformOrigin: "120px 205px" }}>
          <line x1="80" y1="120" x2="120" y2="160" />
          <line x1="120" y1="160" x2="120" y2="205" />
        </g>
        <line x1="20" y1="210" x2="180" y2="210" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "knee_sld": return (
      <Body>
        <g style={{ animation: "mv-step 2s ease-in-out infinite", transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="40" r="14" />
          <line x1="100" y1="54" x2="100" y2="120" />
          <line x1="100" y1="120" x2="100" y2="170" />
        </g>
        <rect x="60" y="170" width="50" height="30" stroke="currentColor" opacity="0.5" />
        <line x1="140" y1="200" x2="160" y2="200" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "hip_abd": return (
      <Body>
        <circle cx="100" cy="40" r="14" />
        <line x1="100" y1="54" x2="100" y2="130" />
        <line x1="100" y1="130" x2="100" y2="200" />
        <g style={{ animation: "mv-hipabd 1.8s ease-in-out infinite", transformOrigin: "100px 130px" }}>
          <line x1="100" y1="130" x2="100" y2="200" />
        </g>
        <line x1="40" y1="205" x2="160" y2="205" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "bridge_hold": return (
      <Body viewBox="0 0 220 160">
        <g style={{ animation: "mv-bridge 1.6s ease-in-out infinite", transformOrigin: "110px 110px" }}>
          <circle cx="50" cy="120" r="12" />
          <line x1="62" y1="120" x2="110" y2="100" />
          <line x1="110" y1="100" x2="150" y2="130" />
          <line x1="150" y1="130" x2="150" y2="140" />
        </g>
        <line x1="20" y1="145" x2="200" y2="145" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "wall_slide": return (
      <Body>
        <line x1="60" y1="20" x2="60" y2="210" stroke="currentColor" opacity="0.4" />
        <circle cx="80" cy="50" r="12" />
        <line x1="80" y1="62" x2="80" y2="140" />
        <g style={{ animation: "mv-wallslide 2s ease-in-out infinite", transformOrigin: "80px 80px" }}>
          <line x1="80" y1="80" x2="120" y2="100" />
          <line x1="120" y1="100" x2="120" y2="60" />
        </g>
        <line x1="80" y1="140" x2="80" y2="200" />
        <line x1="60" y1="210" x2="160" y2="210" stroke="currentColor" opacity="0.4" />
      </Body>
    );
    case "elbow_rom": return (
      <Body>
        <circle cx="100" cy="50" r="14" />
        <line x1="100" y1="64" x2="100" y2="140" />
        <line x1="100" y1="80" x2="60" y2="120" />
        <g style={{ animation: "mv-elbow 1.6s ease-in-out infinite", transformOrigin: "60px 120px" }}>
          <line x1="60" y1="120" x2="60" y2="170" />
        </g>
        <line x1="100" y1="80" x2="140" y2="120" />
        <g style={{ animation: "mv-elbow 1.6s ease-in-out infinite", transformOrigin: "140px 120px" }}>
          <line x1="140" y1="120" x2="140" y2="170" />
        </g>
      </Body>
    );
    case "wrist_rom": return (
      <Body>
        <line x1="40" y1="120" x2="120" y2="120" />
        <g style={{ animation: "mv-wrist 1.4s ease-in-out infinite", transformOrigin: "120px 120px" }}>
          <line x1="120" y1="120" x2="160" y2="120" />
          <line x1="160" y1="120" x2="170" y2="110" />
          <line x1="160" y1="120" x2="170" y2="130" />
        </g>
      </Body>
    );
    default: return (
      <Body>
        <circle cx="100" cy="50" r="14" />
        <line x1="100" y1="64" x2="100" y2="150" />
        <line x1="100" y1="80" x2="70" y2="120" />
        <line x1="100" y1="80" x2="130" y2="120" />
        <line x1="100" y1="150" x2="80" y2="200" />
        <line x1="100" y1="150" x2="120" y2="200" />
      </Body>
    );
  }
}