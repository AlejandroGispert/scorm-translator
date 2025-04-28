import { Html, Head, Main, NextScript } from 'next/document';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
