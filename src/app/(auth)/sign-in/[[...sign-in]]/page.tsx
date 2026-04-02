import { SignIn } from "@clerk/nextjs";
import { OliveBranch } from "@/components/Accents";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-ivory p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-10 text-center">
        {/* Branding Header */}
        <Link href="/" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brown/20 rounded-lg p-2">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-brown tracking-tighter mb-2 transition-transform group-hover:scale-105">ROPE</h1>
          <div className="flex items-center justify-center gap-2 px-4 italic">
            <div className="h-px flex-1 bg-brown/20" />
            <p className="text-muted text-[10px] uppercase tracking-[0.25em] font-medium whitespace-nowrap">Spiritual Journaling</p>
            <div className="h-px flex-1 bg-brown/20" />
          </div>
        </Link>

        {/* Main Login Card */}
        <div className="w-full flex justify-center">
          <SignIn />
        </div>

        {/* Decorative Footer */}
        <div className="pt-4 opacity-30">
          <OliveBranch />
        </div>
      </div>
    </div>
  );
}
