import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "TLL Academy — Certification Franchisé",
  description:
    "Programme de certification du Manuel de Franchise The Landlord — Édition 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans font-light">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
