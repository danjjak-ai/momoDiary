import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Momo Diary | Danjjak",
  description: "Your pixel art AI diary companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pressStart2P.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f0f0f0] flex items-center justify-center overflow-hidden">
        <main className="w-full max-w-[500px] h-full max-h-[900px] p-4 flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  );
}
