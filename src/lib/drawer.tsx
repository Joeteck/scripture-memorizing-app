// src/lib/drawer.tsx
//
// Single, app-wide source of truth for the side navigation drawer.
//
// Previously DrawerMenu was instantiated locally inside dashboard.tsx —
// the only screen that could open it. Every other screen (Add, Categories,
// History, Profile, About, etc.) had no way to reach Settings, Backup &
// Restore, Feedback, Donate, or About without first navigating back to
// Dashboard. That's exactly the "navigate back and forth" problem we're
// removing.
//
// Now the drawer is rendered once, at the root layout, and any screen can
// open it via useDrawer().open() — including screens that don't know or
// care about each other. AppHeader (src/components/AppHeader.tsx) is the
// standard way screens expose the "open drawer" affordance consistently.
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface DrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function DrawerNavigationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("useDrawer() must be used within a DrawerNavigationProvider.");
  }
  return ctx;
}
