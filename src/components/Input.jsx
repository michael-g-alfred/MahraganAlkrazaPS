import React from "react";
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
        className="w-full border border-blue-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-700"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
