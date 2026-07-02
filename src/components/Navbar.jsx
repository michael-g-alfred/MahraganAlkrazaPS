import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPrivileges } from "../utils/permissions";

export default function Navbar() {
  const { user } = useAuth();
  const privileges = getPrivileges(user?.email);

  return (
    <nav
      className="border-b-2 border-blue-700 shadow-sm w-full p-4 flex flex-wrap justify-center items-center gap-6"
      dir="rtl"
      aria-label="القائمة الرئيسية">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ?
            "text-blue-700 font-semibold"
          : "text-gray-500 hover:text-blue-500 transition-colors duration-200"
        }>
        الرئيسية
      </NavLink>

      {user && (
        <>
          <NavLink
            to="/players"
            className={({ isActive }) =>
              isActive ?
                "text-blue-700 font-semibold"
              : "text-gray-500 hover:text-blue-500 transition-colors duration-200"
            }>
            اللاعبين
          </NavLink>
          <NavLink
            to="/brackets"
            className={({ isActive }) =>
              isActive ?
                "text-blue-700 font-semibold"
              : "text-gray-500 hover:text-blue-500 transition-colors duration-200"
            }>
            القرعات
          </NavLink>
          {privileges.fullAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ?
                  "bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-bold"
                : "border border-blue-700 text-blue-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-50 transition"
              }>
              الأدمن
            </NavLink>
          )}
        </>
      )}

      {!user && (
        <NavLink
          to="/login"
          className={({ isActive }) =>
            isActive ?
              "bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-bold"
            : "border border-blue-700 text-blue-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-50 transition"
          }>
          دخول الأدمن
        </NavLink>
      )}
    </nav>
  );
}
