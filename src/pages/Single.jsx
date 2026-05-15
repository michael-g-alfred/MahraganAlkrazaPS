import React, { useState, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import { validateBirthdate, validateNameUnique } from "../utils/validatePlayer";

export default function Single({ data, onUpdateSelection }) {
  const { loading, savePlayer } = usePlayerSave(data, onUpdateSelection);

  const [formData, setFormData] = useState({ name: "", phone: "", birthdate: "" });
  const [imageUrl, setImageUrl] = useState(null);

  // أخطاء الـ validation
  const [birthdateError, setBirthdateError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [checkingName, setCheckingName] = useState(false);

  // ── التحقق من تاريخ الميلاد فور تغييره ──
  useEffect(() => {
    if (formData.birthdate && data?.stage?.name) {
      const error = validateBirthdate(formData.birthdate, data.stage.name);
      setBirthdateError(error);
    } else {
      setBirthdateError(null);
    }
  }, [formData.birthdate, data?.stage?.name]);

  // ── التحقق من تكرار الاسم (debounce 600ms) ──
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingName(true);
      const error = await validateNameUnique(formData.name, data);
      setNameError(error);
      setCheckingName(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.name, data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const hasErrors = !!birthdateError || !!nameError || checkingName;

  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.birthdate &&
    imageUrl &&
    !hasErrors &&
    !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // تحقق نهائي قبل الحفظ
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

    await savePlayer({ ...formData, imageUrl });

    // reset بعد الحفظ
    setFormData({ name: "", phone: "", birthdate: "" });
    setImageUrl(null);
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
        handleImageChange={setImageUrl}
      />

      {/* خطأ الاسم */}
      {nameError && (
        <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3">
          <span>⚠️</span>
          <span>{nameError}</span>
        </div>
      )}
      {checkingName && (
        <p className="text-blue-500 text-sm text-center animate-pulse">
          جارٍ التحقق من الاسم...
        </p>
      )}

      {/* خطأ تاريخ الميلاد */}
      {birthdateError && (
        <div role="alert" className="flex items-center gap-2 bg-orange-50 border border-orange-300 text-orange-700 text-sm rounded-xl px-4 py-3">
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
