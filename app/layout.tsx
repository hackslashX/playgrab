import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playgrab | Google Play assets",
  description: "Download app icons, feature graphics, and screenshots from Google Play.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
