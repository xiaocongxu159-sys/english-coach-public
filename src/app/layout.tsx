import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Coach",
  description: "Systematic English learning for real communication and IELTS readiness.",
  applicationName: "English Coach",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "English Coach",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
