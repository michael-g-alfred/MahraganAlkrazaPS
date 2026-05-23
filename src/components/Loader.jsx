import React from "react";

export default function Loader({ size = 4 }) {
  return (
    <div
      className={`w-${size} h-${size} border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin`}></div>
  );
}
