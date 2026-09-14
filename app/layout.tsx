import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provisioning Activation Portal",
  description: "Portal request aktivasi vendor dan monitoring Team Provisioning.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
