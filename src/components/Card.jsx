import React from "react";
import NationalIdInput from "./NationalIdInput";
import Input from "./Input";

export default function Card({
  formData,
  handleInputChange,
  handleNationalIdChange,
  onNationalIdValidation, // (isValid: boolean) → للـ parent
}) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <NationalIdInput
        value={formData.nationalId || ""}
        onChange={handleNationalIdChange}
        onValidationChange={onNationalIdValidation}
        required
      />
      <Input
        label="اسم اللاعب"
        type="text"
        name="name"
        placeholder="اكتب الاسم رباعي (حروف عربية فقط)"
        required
        pattern="^[\u0600-\u06FF\s]+$"
        value={formData.name}
        onChange={handleInputChange}
      />
      <Input
        label="رقم تليفون اللاعب (بالإنجليزية)"
        type="tel"
        name="phone"
        placeholder="01XXXXXXXXX"
        pattern="^01[0-9]{9}$"
        maxLength="11"
        required
        value={formData.phone}
        onChange={handleInputChange}
      />
      <Input
        label="تاريخ ميلاد اللاعب"
        type="date"
        name="birthdate"
        required
        value={formData.birthdate}
        onChange={handleInputChange}
      />
    </div>
  );
}
