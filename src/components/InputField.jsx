import React from "react";
import ArrowBadgeDownIcon from "../icons/ArrowBadgeDownIcon"

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  maxLength,
}) {
  return (
    <div className="relative group w-full flex items-center gap-2">
      <label className="w-32 text-sm font-semibold text-gray-700 flex items-center gap-2 flex-shrink-0">
        {/* {label.icon && <label.icon className="w-4 h-4 text-blue-700" />} */}
        {label.text}
      </label>

      {type === "select" ? (
        <div className="relative w-full">
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="appearance-none w-full px-4 py-2 border-2 border-blue-700 rounded-xl focus:border-blue-700 transition-all duration-300 outline-none hover:border-blue-700 text-blue-700 placeholder-gray-400"
            required={required}>
            <option value="">اختر الكنيسة</option>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-blue-700">
            <ArrowBadgeDownIcon/>
          </span>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border-2 border-blue-700 rounded-xl focus:border-blue-700 transition-all duration-300 outline-none hover:border-blue-700 text-blue-700 placeholder-gray-400"
          required={required}
          maxLength={maxLength}
        />
      )}
    </div>
  );
}
