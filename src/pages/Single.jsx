import React, { useState, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import {
  validateBirthdate,
  validateNameUnique,
  validateQuadName,
} from "../utils/validatePlayer";

export default function Single({ data, onUpdateSelection }) {
  const { loading, savePlayer } = usePlayerSave(data, onUpdateSelection);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthdate: "",
    nationalId: "",
  });

  const [birthdateError, setBirthdateError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [checkingName, setCheckingName] = useState(false);
  const [nationalIdValid, setNationalIdValid] = useState(false);

  // ── التحقق من تاريخ الميلاد ──
  useEffect(() => {
    if (formData.birthdate && data?.stage?.name) {
      setBirthdateError(validateBirthdate(formData.birthdate, data.stage.name));
    } else {
      setBirthdateError(null);
    }
  }, [formData.birthdate, data?.stage?.name]);

  // ── التحقق من الاسم: رباعي أولاً، ثم تكرار (debounce 600ms) ──
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    // التحقق الفوري من الاسم الرباعي
    const quadError = validateQuadName(formData.name);
    if (quadError) {
      setNameError(quadError);
      return;
    }

    // لو الاسم رباعي صح → نتحقق من التكرار
    const timer = setTimeout(async () => {
      setCheckingName(true);
      setNameError(await validateNameUnique(formData.name, data));
      setCheckingName(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.name, data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNationalIdChange = (val) => {
    setFormData((prev) => ({ ...prev, nationalId: val }));
  };

  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.birthdate &&
    !birthdateError &&
    !nameError &&
    !checkingName &&
    nationalIdValid &&
    !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const quadError = validateQuadName(formData.name);
    if (quadError) {
      setNameError(quadError);
      return;
    }

    const bdError = validateBirthdate(formData.birthdate, data?.stage?.name);
    if (bdError) {
      setBirthdateError(bdError);
      return;
    }

    const nameErr = await validateNameUnique(formData.name, data);
    if (nameErr) {
      setNameError(nameErr);
      return;
    }

    await savePlayer({
      name: formData.name,
      phone: formData.phone,
      birthdate: formData.birthdate,
      nationalId: formData.nationalId,
    });

    setFormData({ name: "", phone: "", birthdate: "", nationalId: "" });
    setNationalIdValid(false);
    setNameError(null);
    setBirthdateError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 max-w-4xl mx-auto border-2 border-blue-700 p-6 rounded-3xl bg-white/80 backdrop-blur-lg"
      dir="rtl"
      aria-label="استمارة تسجيل لاعب فردي"
    >
      <Card
        formData={formData}
        handleInputChange={handleInputChange}
        handleNationalIdChange={handleNationalIdChange}
        onNationalIdValidation={setNationalIdValid}
      />

      {/* رسالة خطأ الاسم (التكرار فقط — الرباعي بيظهر داخل Input) */}
      {nameError && !validateQuadName(formData.name) && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3"
        >
          <span>⚠️</span>
          <span>{nameError}</span>
        </div>
      )}

      {checkingName && (
        <p className="text-blue-500 text-sm text-center animate-pulse">
          جارٍ التحقق من الاسم...
        </p>
      )}

      {birthdateError && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-orange-50 border border-orange-300 text-orange-700 text-sm rounded-xl px-4 py-3"
        >
          <span>📅</span>
          <span>{birthdateError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormValid}
        aria-disabled={!isFormValid}
        className={`rounded-lg p-4 font-semibold transition ${
          !isFormValid
            ? "bg-gray-300 text-gray-400 cursor-not-allowed"
            : "bg-blue-700 text-white hover:bg-blue-800"
        }`}
      >
        {loading ? "جارٍ الحفظ..." : "حفظ اللاعب"}
      </button>
    </form>
  );
}
