import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/lib/store/profile-context";
import { NavBar } from "@/components/layout/NavBar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pathlight — Your university path, without the guesswork",
  description:
    "Tell us what you want to study, where you want to go, and what matters to you. Pathlight turns it into a personalized university application route.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-base text-ink">
        <ProfileProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </ProfileProvider>
      </body>
    </html>
  );
}
