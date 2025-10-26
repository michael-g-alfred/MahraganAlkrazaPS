import React from "react";

export default function SelectBox({ label, value, onChange, options }) {
  return (
    <select
      className="border border-blue-700 rounded-lg p-2 text-blue-700 bg-blue-50"
      value={value}
      onChange={onChange}>
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
