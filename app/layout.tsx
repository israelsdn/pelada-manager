import type { Metadata } from "next";
import { Bebas_Neue, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PELADA AQS",
  description: "Organize a lista da sua pelada com os amigos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-court min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
