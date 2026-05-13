import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hache IA — Tu Asistente Inteligente",
  description: "Asistente de programacion con IA en tu navegador. Escribe, depura y entiende codigo con Hache IA.",
  keywords: ["Hache IA", "IA", "asistente codigo", "programacion", "TypeScript", "chat"],
  authors: [{ name: "HacheJotaDev" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Hache IA — Tu Asistente Inteligente",
    description: "Asistente de programacion con IA en tu navegador.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
