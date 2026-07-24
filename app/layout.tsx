import type { Metadata, Viewport } from "next";
import "react-phone-number-input/style.css";
import "./globals.css";
import { Providers } from "@/src/components/providers";
import { AppShell } from "@/src/components/AppShell";

export const metadata: Metadata = {
  title: "INHAYAT Marketer",
  description:
    "INHAYAT mahsulotlarini ulashing, natijalarni kuzating va bonus oling.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f5f7fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
