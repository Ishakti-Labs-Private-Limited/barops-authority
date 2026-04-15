import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarOps Authority",
  description: "Control and accountability dashboard for liquor chains."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
