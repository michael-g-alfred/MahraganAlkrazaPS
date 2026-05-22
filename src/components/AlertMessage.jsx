import React from "react";
import Loader from "./Loader";

const ICONS = {
  error: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.34 17c-.77 1.333.192 3 1.732 3z"
    />
  ),
  warning: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.34 17c-.77 1.333.192 3 1.732 3z"
    />
  ),
  success: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  ),
  info: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01"
    />
  ),
};

const STYLE = {
  error: {
    wrapper: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
  },
  warning: {
    wrapper: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-500",
  },
  success: {
    wrapper: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
  },
  info: {
    wrapper: "bg-sky-50 text-sky-700 border-sky-200",
    bar: "bg-sky-500",
  },
};

export default function AlertMessage({
  type = "error",
  message,
  className = "",
}) {
  if (!message) return null;

  if (type === "checking") {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-slate-600 font-medium ${className}`}
        role="status">
        <Loader />
        <span>{message}</span>
      </div>
    );
  }

  if (type === "hint") {
    return (
      <p className={`text-xs text-zinc-500 leading-relaxed ${className}`}>
        {message}
      </p>
    );
  }

  const style = STYLE[type] || STYLE.info;
  const icon = ICONS[type] || ICONS.info;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`
        relative flex items-start gap-2
        px-3 py-2
        rounded-lg
        border
        ${style.wrapper}
        ${className}
      `}>
      {/* left accent bar */}
      <span
        className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${style.bar}`}
      />

      <svg
        className="w-4 h-4 mt-0.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true">
        {icon}
      </svg>

      <span className="text-sm leading-snug font-medium">{message}</span>
    </div>
  );
}
