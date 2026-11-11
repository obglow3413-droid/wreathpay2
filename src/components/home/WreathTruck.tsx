import { useId } from "react";

/**
 * 화환을 싣고 달리는 트럭 애니메이션(CSS only, 장식용).
 * 색은 테마 토큰(--forest/--brass/--sage…)을 따라가서 개업(화이트)/근조(블랙) 테마에 자동으로 맞춰진다.
 */
function Wreath({ x, y, tone }: { x: number; y: number; tone: number }) {
  const petals = ["var(--brass)", "var(--sage)", "var(--forest)"][tone % 3];
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="14" x2="0" y2="46" stroke="var(--muted)" strokeWidth="1.6" />
      <circle cx="0" cy="0" r="15" fill={petals} opacity="0.95" />
      <circle cx="-8" cy="-4" r="7" fill="var(--paper)" opacity="0.5" />
      <circle cx="7" cy="5" r="6" fill="var(--paper)" opacity="0.35" />
      <circle cx="0" cy="0" r="4" fill="var(--paper)" />
    </g>
  );
}

export default function WreathTruck() {
  const id = useId().replace(/:/g, "");
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-line bg-paper p-4 md:p-6"
      role="img"
      aria-label="화환을 싣고 이동하는 수거 트럭 애니메이션"
    >
      <svg viewBox="0 0 400 220" className="block h-auto w-full" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-c`}>
            <rect width="400" height="220" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-c)`}>
          {/* 멀리 보이는 도시 실루엣(천천히 흐름) */}
          <g className="truck-city" opacity="0.18" fill="var(--foreground)">
            {[0, 400].map((o) => (
              <g key={o} transform={`translate(${o} 0)`}>
                <rect x="10" y="110" width="34" height="70" />
                <rect x="52" y="86" width="28" height="94" />
                <rect x="88" y="124" width="40" height="56" />
                <rect x="138" y="96" width="30" height="84" />
                <rect x="178" y="118" width="44" height="62" />
                <rect x="232" y="80" width="26" height="100" />
                <rect x="266" y="112" width="38" height="68" />
                <rect x="314" y="100" width="30" height="80" />
                <rect x="352" y="126" width="40" height="54" />
              </g>
            ))}
          </g>

          {/* 도로 */}
          <rect x="0" y="176" width="400" height="44" fill="var(--foreground)" opacity="0.1" />
          <foreignObject x="0" y="196" width="400" height="4">
            <div
              className="truck-road"
              style={{
                height: 3,
                backgroundImage: "linear-gradient(90deg, var(--muted) 0 24px, transparent 24px 48px)",
                backgroundSize: "48px 3px",
                opacity: 0.55,
              }}
            />
          </foreignObject>

          {/* 트럭 */}
          <g className="truck-body">
            {/* 적재함 */}
            <rect x="60" y="82" width="196" height="88" rx="6" fill="var(--paper)" stroke="var(--line)" strokeWidth="2" />
            <rect x="60" y="150" width="196" height="20" fill="var(--forest)" opacity="0.9" />
            <text x="158" y="165" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ivory)" letterSpacing="1.5">
              KKOT PAY
            </text>
            {/* 적재된 화환 */}
            <Wreath x={96} y={104} tone={0} />
            <Wreath x={134} y={104} tone={1} />
            <Wreath x={172} y={104} tone={2} />
            <Wreath x={210} y={104} tone={0} />
            <Wreath x={236} y={112} tone={1} />
            {/* 운전석 */}
            <path d="M262 170 V104 h42 l24 30 v36 z" fill="var(--forest)" />
            <path d="M270 112 h28 l16 20 h-44 z" fill="var(--paper)" opacity="0.85" />
            <rect x="322" y="148" width="8" height="6" rx="2" fill="var(--brass)" />
            {/* 바퀴 */}
            {[104, 292].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="176" r="15" fill="var(--foreground)" />
                <g className="truck-wheel">
                  <circle cx={cx} cy="176" r="8" fill="var(--paper)" />
                  <line x1={cx - 8} y1="176" x2={cx + 8} y2="176" stroke="var(--foreground)" strokeWidth="2" />
                  <line x1={cx} y1="168" x2={cx} y2="184" stroke="var(--foreground)" strokeWidth="2" />
                </g>
              </g>
            ))}
            {/* 배기 연기 */}
            <circle className="truck-puff" cx="56" cy="168" r="5" fill="var(--muted)" />
            <circle className="truck-puff" cx="56" cy="168" r="5" fill="var(--muted)" style={{ animationDelay: "0.7s" }} />
          </g>
        </g>
      </svg>
      <p className="mt-2 text-center text-[12.5px] font-medium text-muted">전담 기사님이 화환을 거두러 갑니다</p>
    </div>
  );
}
