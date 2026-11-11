import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SabiLab — Step into the workplace",
    template: "%s · SabiLab",
  },
  description:
    "Step into realistic workplace simulations. Investigate challenges, collaborate with teammates and make decisions that matter with SabiLab.",
  openGraph: {
    siteName: "SabiLab",
    title: "SabiLab — Step into the workplace",
    description:
      "Explore realistic workplace challenges, collaborate with teammates and discover what your decisions can achieve.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E1065",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
