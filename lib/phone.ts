/**
 * Formata dígitos de telefone no padrão (xx) x xxxx-xxxx enquanto o usuário digita.
 * Aceita tanto celular (11 dígitos, com o 9 na frente) quanto entradas parciais.
 */
export function formatPhone(rawValue: string): string {
  const digits = onlyDigits(rawValue).slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(
    3,
    7
  )}-${digits.slice(7, 11)}`;
}

/** Remove tudo que não for dígito. É esse valor que deve ir para a API. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Telefone válido no padrão brasileiro de celular: DDD (2) + 9 dígitos. */
export function isValidPhone(value: string): boolean {
  return onlyDigits(value).length === 11;
}
