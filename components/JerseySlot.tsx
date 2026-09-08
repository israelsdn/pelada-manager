interface JerseySlotProps {
  numero: number;
  apelido?: string;
  foto?: string | null;
  destaque?: boolean; // true quando é o próprio usuário logado
  onVagoClick?: () => void;
  onRemover?: () => void;
  removendo?: boolean;
}

export default function JerseySlot({
  numero,
  apelido,
  foto,
  destaque,
  onVagoClick,
  onRemover,
  removendo,
}: JerseySlotProps) {
  const preenchido = !!apelido;
  const vagoClicavel = !preenchido && !!onVagoClick;

  const circulo = (
    <div
      className={[
        "flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 font-mono text-sm font-semibold sm:h-14 sm:w-14 sm:text-base",
        preenchido
          ? destaque
            ? "border-card-yellow bg-card-yellow/10 text-card-yellow"
            : "border-grass bg-grass/10 text-grass"
          : vagoClicavel
            ? "border-dashed border-card-yellow/50 text-card-yellow"
            : "border-dashed border-pitch-line text-chalk-muted",
      ].join(" ")}
    >
      {foto ? (
        <img
          src={foto}
          alt={apelido ?? ""}
          className="h-full w-full object-cover"
        />
      ) : preenchido ? (
        numero
      ) : vagoClicavel ? (
        "+"
      ) : (
        numero
      )}
    </div>
  );

  return (
    <div className="relative flex flex-col items-center gap-1.5">
      {vagoClicavel ? (
        <button
          type="button"
          onClick={onVagoClick}
          className="rounded-full hover:opacity-90"
        >
          {circulo}
        </button>
      ) : (
        circulo
      )}
      <span
        className={[
          "max-w-[4.5rem] truncate text-center text-xs",
          preenchido ? "text-chalk" : "text-chalk-muted/60",
        ].join(" ")}
      >
        {apelido ?? (vagoClicavel ? "adicionar" : "vago")}
      </span>
      {preenchido && onRemover && (
        <button
          type="button"
          onClick={onRemover}
          disabled={removendo}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-card-red/40 bg-pitch-surface text-[10px] leading-none text-card-red hover:bg-card-red/15 disabled:opacity-60"
          aria-label={`Remover ${apelido}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
