import React from "react";

export default function SelectCard({ isSelected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-4 text-blue-700 hover:bg-blue-50 transform hover:scale-102 transition-all duration-300 border border-blue-700 w-full ${
        isSelected ? "bg-blue-100 ring-2 ring-blue-700 font-bold" : ""
      }`}>
      <div className="flex flex-col justify-center items-center h-full">
        {children}
      </div>
    </button>
  );
}
