import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Providers from "@/components/Providers";
import SystemNotificationProvider from "@/components/system/SystemNotificationProvider";
import { MessagingSocketProvider } from "@/contexts/MessagingSocketContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillUp RPG - Level Up Your Real Life",
    template: "%s | SkillUp RPG",
  },
  description:
    "Transform your daily habits into an epic adventure. Earn XP, unlock achievements, and boost your productivity with SkillUp RPG — the gamified habit tracker.",
  keywords: [
    "habit tracker",
    "productivity",
    "gamification",
    "self improvement",
    "daily habits",
    "XP",
    "level up",
    "streaks",
    "achievements",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SkillUp RPG",
    title: "SkillUp RPG - Level Up Your Real Life",
    description:
      "Transform your daily habits into an epic adventure. Earn XP, unlock achievements, and boost your productivity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillUp RPG - Level Up Your Real Life",
    description:
      "Transform your daily habits into an epic adventure. Earn XP, unlock achievements, and boost your productivity.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>
          <SystemNotificationProvider>
            {/* Inside AuthProvider: the socket handshake needs the Firebase
                session, and outside nothing else would guarantee it. Outside
                Providers: it writes into the React Query cache. */}
            <AuthProvider>
              <MessagingSocketProvider>{children}</MessagingSocketProvider>
            </AuthProvider>
          </SystemNotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
