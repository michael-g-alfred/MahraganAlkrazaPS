import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-[var(--color-primary-base)] font-semibold"
      : "text-[var(--color-primary-disabled)] hover:text-[var(--color-primary-hover)] transition-colors duration-200";

  return (
    <nav className="bg-[var(--color-bg-base)] border-b-2 border-[var(--color-bg-divider)] shadow-sm w-full px-6 py-4 flex justify-between items-center">
      {/* Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="w-8 h-8 p-2 flex justify-between items-center rounded-full border border-[var(--color-primary-base)] transition-colors">
        {darkMode ? "🌙" : "☀️"}
      </button>

      <div className="flex items-center gap-4">
        {[
          { to: "/", label: "Home", end: true },
          { to: "movies", label: "Movies" },
          { to: "tv-shows", label: "TV Shows" },
          { to: "people", label: "People" },
        ].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            className={linkClass}
            {...(end ? { end: true } : {})}>
            {label}
          </NavLink>
        ))}
        <Link
          to={"/"}
          className="text-2xl font-bold text-[var(--color-primary-base)] transform transition-transform duration-300 hover:scale-110"
        >
    ⚽️
        </Link>
      </div>
    </nav>
  );
}
