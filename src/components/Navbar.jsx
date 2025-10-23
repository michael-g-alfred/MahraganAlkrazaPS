import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const linkClass = ({ isActive, to }) => {
    const isHomeActive =
      (to === "/" &&
        (location.pathname === "/" ||
          location.pathname === "/single" ||
          location.pathname === "/team")) ||
      isActive;

    return isHomeActive
      ? "text-blue-700 font-semibold"
      : "text-gray-300 hover:text-blue-500 transition-colors duration-200";
  };

  return (
    <nav
      className="border-b-2 border-blue-700 shadow-sm w-full p-6 flex justify-center items-center gap-8"
      dir="rtl">
      {[
        { to: "/", label: "الرئيسية", end: true },
        { to: "players", label: "اللاعبين" },
      ].map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          className={(props) => linkClass({ ...props, to })}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
