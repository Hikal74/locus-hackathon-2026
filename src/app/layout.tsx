import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/lib/store/profile-context";
import { NavBar } from "@/components/layout/NavBar";
import { AdvisorUiProvider } from "@/components/advisor/advisor-context";
import { AdvisorLauncher } from "@/components/advisor/AdvisorLauncher";
import { AdvisorDrawer } from "@/components/advisor/AdvisorDrawer";

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
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ProfileProvider>
          <AdvisorUiProvider>
            <NavBar />
            <main className="flex-1">{children}</main>
            <AdvisorLauncher />
            <AdvisorDrawer />
          </AdvisorUiProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
