export const TAMANHO_MAX_FOTO = 45_000;
const LADO_FOTO = 192;

export function validarFotoBase64(foto: unknown): string | null {
  if (foto === null) return null;
  if (typeof foto !== "string") {
    throw new Error("Foto inválida.");
  }
  if (!foto.startsWith("data:image/jpeg;base64,")) {
    throw new Error("Envie a foto no formato JPEG compactado.");
  }
  if (foto.length > TAMANHO_MAX_FOTO) {
    throw new Error("A foto ficou grande demais. Tente outra imagem.");
  }
  return foto;
}

/** Redimensiona e comprime no cliente para um JPEG pequeno (data URL). */
export function compactarFoto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem."));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = LADO_FOTO;
      canvas.height = LADO_FOTO;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }
      const escala = Math.max(LADO_FOTO / img.width, LADO_FOTO / img.height);
      const largura = img.width * escala;
      const altura = img.height * escala;
      ctx.drawImage(
        img,
        (LADO_FOTO - largura) / 2,
        (LADO_FOTO - altura) / 2,
        largura,
        altura,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}
