"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <Link href="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
        <span className="nav-icon">👥</span>
        <span className="nav-label">Patients</span>
      </Link>
      <Link href="/encounter/new" className="nav-item">
        <div className="nav-new">
          <span className="nav-icon">＋</span>
          <span className="nav-label">New</span>
        </div>
      </Link>
      <Link
        href="/search"
        className={`nav-item ${pathname === "/search" ? "active" : ""}`}
      >
        <span className="nav-icon">🔍</span>
        <span className="nav-label">Search</span>
      </Link>
    </nav>
  );
}
