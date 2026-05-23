import React, { useState } from "react";
import NationalIdInput from "./NationalIdInput";
import Input from "./Input";
import AlertMessage from "./AlertMessage";

export default function Card({
  formData,
  handleInputChange,
  handleNationalIdChange,
  onNationalIdValidation,
  nameError,
  checkingName,
}) {
  const [nationalIdError, setNationalIdError] = useState(null);
  const [isNationalIdChecking, setIsNationalIdChecking] = useState(false);
  const [nationalIdSuccess, setNationalIdSuccess] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full">
      <NationalIdInput
        value={formData.nationalId || ""}
        onChange={handleNationalIdChange}
        onValidationChange={(isValid) => {
          onNationalIdValidation?.(isValid);
        }}
        onError={setNationalIdError}
        onChecking={setIsNationalIdChecking}
        onSuccess={setNationalIdSuccess}
        required
      />

      {/* رسائل National ID */}
      {isNationalIdChecking && (
        <AlertMessage
          type="checking"
          message="جارٍ التحقق من الرقم القومى..."
        />
      )}
      {nationalIdError && !isNationalIdChecking && (
        <AlertMessage type="error" message={nationalIdError} />
      )}
      {nationalIdSuccess && !isNationalIdChecking && !nationalIdError && (
        <AlertMessage type="success" message="الرقم القومى صحيح ومتاح" />
      )}

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

      {/* رسائل الاسم */}
      {checkingName && (
        <AlertMessage type="checking" message="جارٍ التحقق من الاسم..." />
      )}
      {nameError && !checkingName && (
        <AlertMessage type="error" message={nameError} />
      )}

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
