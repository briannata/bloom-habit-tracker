type Props = {
  avatar: string | null
  size?: number
  className?: string
}

export default function Avatar({ avatar, size = 40, className = '' }: Props) {
  const isImage = !!avatar && (avatar.startsWith('http') || avatar.startsWith('/'))

  return (
    <div
      className={`rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar!} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.55 }}>{avatar || '🌱'}</span>
      )}
    </div>
  )
}
