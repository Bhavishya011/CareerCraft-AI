"use client";
import Link from "next/link";
import { History } from "lucide-react";

export default function GoToHistory({ userId }: { userId: string }) {
  return (
    <Link
      href={`/user/${userId}/profile`}
      className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg ring-offset-background transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <History className="h-6 w-6" />
      <span>See Message History</span>
    </Link>
  );
}
