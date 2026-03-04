import type { Metadata } from "next";
import { Alegreya, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const headingFont = Alegreya({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Gospel Parallel Reader",
  description: "Read and compare gospel narratives side by side across Matthew, Mark, Luke, and John.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}

