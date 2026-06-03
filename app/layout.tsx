import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";

import "./globals.css";

import AppNav from "@/components/ui/AppNav";

const pixelFont = Press_Start_2P({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-pixel",
});

export const metadata: Metadata = {
    title: "Side Quests",
    description: "Retro mini-games, streaks, and leaderboards.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={pixelFont.variable}>
                {children}

                <AppNav />
            </body>
        </html>
    );
}