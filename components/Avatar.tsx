interface AvatarProps {
  src?: string | null;
  apelido?: string;
  className?: string;
}

export default function Avatar({
  src,
  apelido,
  className = "h-8 w-8",
}: AvatarProps) {
  const inicial = (apelido ?? "?").trim().charAt(0).toUpperCase() || "?";

  if (src) {
    return (
      <img
        src={src}
        alt={apelido ?? ""}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-pitch-raised font-display text-chalk-muted ${className}`}
    >
      {inicial}
    </div>
  );
}
