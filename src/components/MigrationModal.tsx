"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MigrationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeen = localStorage.getItem("rope_migration_notified_v1");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("rope_migration_notified_v1", "true");
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-ivory p-8 shadow-2xl dark:bg-cream-dark border border-brown/10"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent-gold/10 text-accent-gold animate-pulse-gentle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-10 w-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              
              <h2 className="mb-4 font-serif text-3xl font-bold text-dark tracking-tight">
                System Update
              </h2>
              
              <div className="mb-8 space-y-4">
                <p className="text-muted text-lg leading-relaxed">
                  We've migrated our systems to a more robust production environment. 
                </p>
                <div className="p-4 rounded-xl bg-brown/5 border border-brown/10">
                  <p className="text-brown font-medium italic">
                    "We apologize, but user data has been reset from the development instance. Data will remain stable henceforth."
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="btn-primary w-full py-4 text-lg"
              >
                Welcome Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
