import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

/**
 * Visual System v2 (ver design/SYNTEX-UI.md): Manrope substitui Inter *e*
 * a serifa — não há mais fonte de display separada, `font-serif` é um
 * alias CSS para `font-sans` (globals.css) para não exigir tocar em quem
 * ainda usa a classe. JetBrains Mono substitui IBM Plex Mono só nos
 * identificadores; formatters não mudam.
 */
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Syntex",
  description: "Plataforma de gestão sindical",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
