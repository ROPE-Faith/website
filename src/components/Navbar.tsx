"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
          ? "bg-ivory/80 backdrop-blur-md border-b border-brown/10 py-3 shadow-sm" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="w-full px-6 md:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center gap-2">
            <svg width="14" height="20" viewBox="0 0 18 26" fill="none" className={`shrink-0 transition-colors ${
              scrolled ? "text-brown/60" : "text-[#f5efe3]/60 md:text-brown/60"
            }`}>
              <rect x="7" y="0" width="4" height="26" rx="1" fill="currentColor" />
              <rect x="0" y="5.5" width="18" height="4" rx="1" fill="currentColor" />
            </svg>
            <div className="flex flex-col items-center">
              <h1 className={`font-serif text-2xl font-bold tracking-tighter transition-colors ${
                scrolled ? "text-brown" : "text-[#f5efe3] md:text-brown"
              }`}>ROPE</h1>
              <div className={`h-0.5 w-0 group-hover:w-full transition-all duration-300 ${
                scrolled ? "bg-brown/40" : "bg-[#f5efe3]/40 md:bg-brown/40"
              }`} />
            </div>
          </div>
        </Link>

        {/* Desktop Auth Actions */}
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="w-8 h-8 rounded-full bg-brown/10 animate-pulse" />
          ) : (
            <>
              {!isSignedIn ? (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/sign-in"
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                      scrolled 
                        ? "text-brown hover:bg-brown/5" 
                        : "text-[#f5efe3] md:text-brown hover:bg-[#f5efe3]/10 md:hover:bg-brown/5"
                    }`}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/sign-up"
                    className="px-5 py-2 bg-brown text-[#f5efe3] text-xs font-bold rounded-full hover:bg-brown-light transition shadow-sm active:scale-95"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link 
                    href="/journal" 
                    className={`text-xs font-serif font-bold tracking-wider uppercase transition-colors ${
                      scrolled ? "text-brown" : "text-[#f5efe3] md:text-brown"
                    }`}
                  >
                    My Journal
                  </Link>
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 ring-2 ring-brown/10"
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
