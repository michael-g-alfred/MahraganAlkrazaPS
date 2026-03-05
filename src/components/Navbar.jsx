import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "الرئيسية", end: true },
  { to: "/players", label: "اللاعبين", end: false },
  { to: "/maps", label: "الخريطة", end: false },
];

export default function Navbar() {
  return (
    <nav
      className="border-b-2 border-blue-700 shadow-sm w-full p-6 flex justify-center items-center gap-8"
      dir="rtl"
      aria-label="القائمة الرئيسية"
    >
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive
              ? "text-blue-700 font-semibold"
              : "text-gray-500 hover:text-blue-500 transition-colors duration-200"
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
