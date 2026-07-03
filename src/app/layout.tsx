import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Finance Flow", template: "%s · Finance Flow" },
  description: "Seu dinheiro, com mais clareza e menos planilhas.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A nonce is generated per request by proxy.ts. Dynamic rendering is required
  // so Next.js can attach that nonce to framework and inline scripts.
  await connection();
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
