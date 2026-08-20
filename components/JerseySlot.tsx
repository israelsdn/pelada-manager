interface JerseySlotProps {
  numero: number;
  apelido?: string;
  destaque?: boolean; // true quando é o próprio usuário logado
}

export default function JerseySlot({ numero, apelido, destaque }: JerseySlotProps) {
  const preenchido = !!apelido;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={[
          "flex h-12 w-12 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold sm:h-14 sm:w-14 sm:text-base",
          preenchido
            ? destaque
              ? "border-card-yellow bg-card-yellow/10 text-card-yellow"
              : "border-grass bg-grass/10 text-grass"
            : "border-dashed border-pitch-line text-chalk-muted",
        ].join(" ")}
      >
        {numero}
      </div>
      <span
        className={[
          "max-w-[4.5rem] truncate text-center text-xs",
          preenchido ? "text-chalk" : "text-chalk-muted/60",
        ].join(" ")}
      >
        {apelido ?? "vago"}
      </span>
    </div>
  );
}
