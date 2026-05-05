import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FOAM — The Operating System for Auto Detailing",
  description:
    "Customers book trusted mobile detailers and local shops. Operators manage bookings, payments, customers, crews, routes, bays, and business operations from one app.",
  metadataBase: new URL("https://foamauto.com"),
  openGraph: {
    title: "FOAM — The Operating System for Auto Detailing",
    description:
      "Customers book trusted mobile detailers and local shops. Operators manage bookings, payments, crews, and bays from one place.",
    url: "https://foamauto.com",
    siteName: "FOAM",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-body bg-foam-bg text-foam-text antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
