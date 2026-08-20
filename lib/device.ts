import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const DEVICE_COOKIE_NAME = "pelada_device_id";

// Cookie de longa duração (5 anos) - não tem relação com a sessão de login,
// serve só para identificar o navegador/aparelho ao longo do tempo.
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5;

/**
 * Lê o id do dispositivo do cookie da requisição. Se ainda não existir,
 * gera um novo (não grava sozinho - quem chama deve setar o cookie na
 * resposta usando `gravarDeviceIdNaResposta`).
 */
export function obterOuCriarDeviceId(req: NextRequest): {
  deviceId: string;
  novo: boolean;
} {
  const existente = req.cookies.get(DEVICE_COOKIE_NAME)?.value;
  if (existente) {
    return { deviceId: existente, novo: false };
  }
  return { deviceId: randomUUID(), novo: true };
}

export function gravarDeviceIdNaResposta(res: NextResponse, deviceId: string) {
  res.cookies.set(DEVICE_COOKIE_NAME, deviceId, {
    maxAge: DEVICE_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
