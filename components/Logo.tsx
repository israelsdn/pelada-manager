interface LogoProps {
  className?: string;
}

/**
 * Logo da pelada. Para trocar pela logo de verdade, basta substituir o
 * arquivo `public/logo.svg` (aceita .svg, .png ou .jpg - só ajustar a
 * extensão no `src` abaixo se não for .svg).
 *
 * O ícone da aba do navegador (favicon) é outro arquivo: `app/icon.svg`.
 */
export default function Logo({ className = "h-16 w-16" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt="Logo da pelada" className={className} />
  );
}
