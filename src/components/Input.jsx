import React from "react";
import { validateQuadName } from "../utils/validatePlayer";

export default function Input({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
  required,
  pattern,
  maxLength,
}) {
  const nameError =
    name === "name" && value.length > 0 ? validateQuadName(value) : null;

  return (
    <div>
      <label className="block mb-2 text-blue-700 font-semibold">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        pattern={pattern}
        maxLength={maxLength}
        className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 transition ${
          nameError ?
            "border-red-400 focus:ring-red-300"
          : "border-blue-700 focus:ring-blue-700"
        }`}
        value={value}
        onChange={onChange}
      />
      {nameError && (
        <p
          role="alert"
          className="mt-1 text-red-600 text-xs flex items-center gap-1">
          <span>⚠️</span>
          <span>{nameError}</span>
        </p>
      )}
    </div>
  );
}
