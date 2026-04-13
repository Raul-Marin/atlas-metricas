import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "@/styles/globals.css";

const fontSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Metric Atlas",
  description:
    "Enciclopedia visual de métricas para Design Systems en la era de la IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-screen font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
