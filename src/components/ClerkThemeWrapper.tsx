"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/**
 * ClerkThemeWrapper
 * Reverts Clerk components to a static, high-visibility light theme (Ivory background, Dark text)
 * regardless of the application's overall dark mode state. 
 * This ensures all auth elements (Manage account, Sign out, etc.) are always readable as dark text on a light "card" island.
 */
export default function ClerkThemeWrapper({ children }: { children: React.ReactNode }) {
  // Keeping theme-awareness available for potential future refinements, 
  // but hardcoding the appearance to light/ivory for reliability.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <ClerkProvider
      appearance={{
        // Force the light theme (islands of ivory on whatever background)
        baseTheme: undefined, 
        layout: {
          shimmer: true,
          socialButtonsVariant: "blockButton",
        },
        variables: {
          colorPrimary: "#5c4327", // ROPE Brown
          colorText: "#2e2418",    // Dark Brown - Guaranteed visibility
          colorBackground: "#f5efe3", // Ivory - Classic ROPE palette
          colorInputBackground: "#ebe4d4",
          colorInputText: "#2e2418",
          borderRadius: "1rem",
        },
        elements: {
          // Explicitly define dark text for all common Clerk elements
          headerTitle: "font-serif text-2xl font-bold text-[#5c4327]",
          headerSubtitle: "text-[#9a8e7a] text-sm",
          card: "w-full shadow-lg border border-[#5c4327]/10 rounded-2xl bg-[#f5efe3]",
          formButtonPrimary: "bg-[#5c4327] hover:bg-[#7d6245] text-[#f5efe3] transition-all font-bold",
          socialButtonsBlockButton: "border-[#5c4327]/10 hover:bg-[#5c4327]/5 text-[#2e2418]",
          footerActionLink: "text-[#5c4327] hover:text-[#7d6245] font-medium",
          formFieldLabel: "text-[#2e2418] font-medium opacity-80",
          dividerText: "text-[#9a8e7a] uppercase tracking-widest text-[10px]",
          userButtonPopoverCard: "bg-[#f5efe3] border border-[#5c4327]/10 shadow-xl",
          userButtonPopoverActionButtonText: "text-[#2e2418]",
          userButtonOuterIdentifier: "text-[#2e2418] font-medium",
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
