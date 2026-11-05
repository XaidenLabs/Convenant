import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Covenant — the promise is enforced by the chain",
  description:
    "Bonded solver marketplace for NEAR Intents. Quotes lock collateral. Chain Signatures deliver Bitcoin. Failed settlement slashes on-chain.",
  openGraph: {
    title: "Covenant",
    description:
      "The promise is enforced by the chain — bonded settlement for remittances on NEAR.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased bg-navy-deep text-mist">
        {children}
      </body>
    </html>
  );
}
