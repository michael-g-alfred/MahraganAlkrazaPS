import React from "react";

export default function SelectCard({ isSelected, onClick, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-2
        p-4 rounded-2xl border-2 w-full text-center
        transition-all duration-200 cursor-pointer
        ${
          isSelected ?
            "border-blue-700 bg-blue-700 text-white shadow-md"
          : "border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50"
        }
      `}>
      <span className="font-bold text-sm leading-tight">{title}</span>
      {subtitle && (
        <span
          className={`text-xs leading-tight ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
          {subtitle}
        </span>
      )}
    </button>
  );
}
