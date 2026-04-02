import type { Metadata } from "next";
import "./globals.css";
import ClerkThemeWrapper from "@/components/ClerkThemeWrapper";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ROPE — Bible Journaling",
  description: "A daily rhythm of Revelation, Observation, Prayer, and Execution.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkThemeWrapper>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const saved = localStorage.getItem("rope_dark_mode");
                    const theme = saved !== null ? (saved === "true") : window.matchMedia("(prefers-color-scheme: dark)").matches;
                    if (theme) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body className="min-h-screen bg-ivory text-dark antialiased">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkThemeWrapper>
  );
}
