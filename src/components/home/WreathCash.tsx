/**
 * 화환이 현금으로 바뀌는 루프 애니메이션(CSS only, 장식용).
 * 숫자는 보여주지 않고 ₩ 기호만 사용 — 실제 금액이 아니라 "화환 → 페이백"의 이미지.
 * 색은 테마 토큰을 따라가므로 개업(밝음)/근조(어두움) 테마에 자동으로 맞춰진다.
 */
const PETALS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { x: Math.cos(a) * 34, y: Math.sin(a) * 34, c: ["var(--brass)", "var(--sage)", "var(--paper)"][i % 3] };
});

// 쌓이는 현금 더미(좌표는 viewBox 기준). 아래쪽부터 쌓이도록 뒤쪽 delay일수록 위로.
const BILLS = [
  { dx: 214, dy: 150, delay: 0.0, rot: -6 },
  { dx: 262, dy: 154, delay: 0.1, rot: 5 },
  { dx: 310, dy: 150, delay: 0.2, rot: -4 },
  { dx: 236, dy: 134, delay: 0.35, rot: 8 },
  { dx: 286, dy: 136, delay: 0.45, rot: -9 },
  { dx: 262, dy: 118, delay: 0.6, rot: 3 },
];
const COINS = [
  { dx: 200, dy: 172, delay: 0.05 },
  { dx: 232, dy: 170, delay: 0.15 },
  { dx: 300, dy: 172, delay: 0.25 },
  { dx: 334, dy: 168, delay: 0.3 },
  { dx: 218, dy: 112, delay: 0.5 },
  { dx: 252, dy: 98, delay: 0.65 },
  { dx: 290, dy: 106, delay: 0.7 },
  { dx: 322, dy: 126, delay: 0.55 },
  { dx: 270, dy: 82, delay: 0.85 },
  { dx: 240, dy: 80, delay: 0.95 },
];

export default function WreathCash() {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-line bg-paper p-4 md:p-6"
      role="img"
      aria-label="화환이 현금으로 바뀌는 애니메이션"
    >
      <svg viewBox="0 0 400 220" className="block h-auto w-full" aria-hidden="true">
        {/* 바닥 그림자 */}
        <ellipse cx="268" cy="188" rx="104" ry="9" fill="var(--foreground)" opacity="0.08" />

        {/* 화환 + 스탠드 */}
        <g className="cw-wreath" style={{ transformOrigin: "110px 98px" }}>
          <line x1="110" y1="134" x2="110" y2="190" stroke="var(--muted)" strokeWidth="2.2" />
          <line x1="110" y1="190" x2="92" y2="190" stroke="var(--muted)" strokeWidth="2.2" />
          <line x1="110" y1="190" x2="128" y2="190" stroke="var(--muted)" strokeWidth="2.2" />
          <g transform="translate(110 98)">
            <circle r="44" fill="none" stroke="var(--forest)" strokeWidth="9" opacity="0.9" />
            {PETALS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="9" fill={p.c} stroke="var(--line)" strokeWidth="1" />
            ))}
            <circle r="9" fill="var(--brass)" />
          </g>
        </g>

        {/* 화살표 */}
        <g className="cw-arrow" opacity="0.5">
          <path d="M168 98 H196" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 7" />
          <path d="M190 91 L198 98 L190 105" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 지폐 */}
        {BILLS.map((b, i) => (
          <g
            key={`b${i}`}
            className="cw-item"
            style={{ ["--dx" as string]: `${b.dx - 110}px`, ["--dy" as string]: `${b.dy - 98}px`, animationDelay: `${b.delay}s`, transformOrigin: "110px 98px" }}
          >
            <g transform={`translate(110 98) rotate(${b.rot})`}>
              <rect x="-22" y="-12" width="44" height="24" rx="3" fill="var(--sage)" stroke="var(--forest)" strokeWidth="1.5" />
              <circle r="6" fill="none" stroke="var(--forest)" strokeWidth="1.5" />
              <text y="3.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--forest)">₩</text>
            </g>
          </g>
        ))}

        {/* 동전 */}
        {COINS.map((c, i) => (
          <g
            key={`c${i}`}
            className="cw-item"
            style={{ ["--dx" as string]: `${c.dx - 110}px`, ["--dy" as string]: `${c.dy - 98}px`, animationDelay: `${c.delay}s`, transformOrigin: "110px 98px" }}
          >
            <g transform="translate(110 98)">
              <circle r="13" fill="var(--brass)" stroke="var(--forest)" strokeWidth="1.5" />
              <circle r="9" fill="none" stroke="var(--paper)" strokeWidth="1" opacity="0.7" />
              <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--forest)">₩</text>
            </g>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-[12.5px] font-medium text-muted">화환은 현금이 되어 돌아옵니다</p>
    </div>
  );
}
