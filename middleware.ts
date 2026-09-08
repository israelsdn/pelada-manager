export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ranking/:path*",
    "/usuarios/:path*",
    "/gols/:path*",
    "/votacao/:path*",
    "/notas/:path*",
  ],
};
