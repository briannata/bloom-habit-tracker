type Props = { streak: number; size?: number }

export default function Plant({ streak, size = 160 }: Props) {
  const stage =
    streak === 0 ? 0 : streak <= 3 ? 1 : streak <= 7 ? 2 : streak <= 30 ? 3 : 4

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Plant stage ${stage}, streak ${streak} days`}
    >
      <ellipse cx="100" cy="175" rx="70" ry="10" fill="#92400e" opacity="0.25" />
      <path d="M30 170 Q100 145 170 170 L170 185 Q100 195 30 185 Z" fill="#7c4a1e" />

      {stage === 0 && (
        <circle cx="100" cy="170" r="4" fill="#3f2a14" />
      )}

      {stage >= 1 && (
        <>
          <path d="M100 170 Q100 150 100 135" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="92" cy="142" rx="8" ry="4" fill="#22c55e" transform="rotate(-30 92 142)" />
          <ellipse cx="108" cy="142" rx="8" ry="4" fill="#22c55e" transform="rotate(30 108 142)" />
        </>
      )}

      {stage >= 2 && (
        <>
          <path d="M100 135 Q100 115 100 100" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="85" cy="115" rx="14" ry="6" fill="#22c55e" transform="rotate(-25 85 115)" />
          <ellipse cx="115" cy="115" rx="14" ry="6" fill="#22c55e" transform="rotate(25 115 115)" />
        </>
      )}

      {stage >= 3 && (
        <>
          <ellipse cx="78" cy="90" rx="16" ry="8" fill="#16a34a" transform="rotate(-20 78 90)" />
          <ellipse cx="122" cy="90" rx="16" ry="8" fill="#16a34a" transform="rotate(20 122 90)" />
          <circle cx="100" cy="80" r="10" fill="#f472b6" />
          <circle cx="85" cy="88" r="9" fill="#f472b6" />
          <circle cx="115" cy="88" r="9" fill="#f472b6" />
          <circle cx="100" cy="95" r="9" fill="#f472b6" />
          <circle cx="100" cy="86" r="4" fill="#fde047" />
        </>
      )}

      {stage >= 4 && (
        <>
          <circle cx="70" cy="70" r="9" fill="#ec4899" />
          <circle cx="130" cy="70" r="9" fill="#ec4899" />
          <circle cx="60" cy="100" r="8" fill="#f472b6" />
          <circle cx="140" cy="100" r="8" fill="#f472b6" />
          <ellipse cx="60" cy="125" rx="14" ry="7" fill="#16a34a" transform="rotate(-30 60 125)" />
          <ellipse cx="140" cy="125" rx="14" ry="7" fill="#16a34a" transform="rotate(30 140 125)" />
        </>
      )}
    </svg>
  )
}
