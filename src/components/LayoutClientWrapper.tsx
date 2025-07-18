"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./app-header";
import AppFooter from "./app-footer";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideHeaderFooter = pathname === "/auth";

  return (
    <>
      {!hideHeaderFooter && <AppHeader />}
      <main className="flex-1">{children}</main>
      {!hideHeaderFooter && <AppFooter />}
    </>
  );
}
