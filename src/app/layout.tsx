import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { HideDevTools } from "@/components/hide-dev-tools";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "METFLIX - Streaming Libre | Films, Séries, Anime & Manga",
  description: "Regardez vos films, séries, anime et manga préférés en streaming gratuit. Nouveautés, tendances et classiques en VOSTFR et VF.",
  keywords: ["streaming", "films", "séries", "anime", "manga", "VOSTFR", "VF", "gratuit", "METFLIX"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="m-0 p-0">
      <body
        className={`${nunito.variable} font-sans antialiased bg-background text-foreground m-0 p-0`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <HideDevTools />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}