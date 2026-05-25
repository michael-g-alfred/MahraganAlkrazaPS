import React from "react";

// تحويل الأرقام العربية والفارسية إلى إنجليزية
function toEnglishDigits(str) {
  return str
    .replace(/[\u0660-\u0669]/g, (c) => c.charCodeAt(0) - 0x0660) // عربية
    .replace(/[\u06F0-\u06F9]/g, (c) => c.charCodeAt(0) - 0x06F0); // فارسية
}

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
  const handleChange = (e) => {
    // لو الحقل رقم تليفون → حوّل الأرقام العربية لإنجليزية
    if (type === "tel") {
      const converted = toEnglishDigits(e.target.value);
      // نعمل event مصنوع يدوياً بالقيمة المحوّلة
      const syntheticEvent = {
        ...e,
        target: { ...e.target, name: e.target.name, value: converted },
      };
      onChange(syntheticEvent);
    } else {
      onChange(e);
    }
  };

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
        className="w-full border border-blue-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
        value={value}
        onChange={handleChange}
        // لحقل التليفون: نفرض الكيبورد الرقمي على الموبايل
        inputMode={type === "tel" ? "numeric" : undefined}
      />
    </div>
  );
}
