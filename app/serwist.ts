"use client";
// Re-export SerwistProvider as a client component for use in app/layout.tsx.
// This thin wrapper is required because layout.tsx is a server component.
export { SerwistProvider } from "@serwist/next/react";
