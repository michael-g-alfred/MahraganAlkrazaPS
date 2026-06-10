import React, { useState, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import ReviewModal from "../components/ReviewModal";
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

  // ── حالة مودال المراجعة ─────────────────────────────────────
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (formData.birthdate && data?.stage?.name) {
      setBirthdateError(validateBirthdate(formData.birthdate, data.stage.name));
    } else {
      setBirthdateError(null);
    }
  }, [formData.birthdate, data?.stage?.name]);

  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }
    const quadError = validateQuadName(formData.name);
    if (quadError) {
      setNameError(quadError);
      return;
    }
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

  // ── فتح المراجعة بدلاً من الإرسال المباشر ───────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const quadError = validateQuadName(formData.name);
    if (quadError) { setNameError(quadError); return; }

    const bdError = validateBirthdate(formData.birthdate, data?.stage?.name);
    if (bdError) { setBirthdateError(bdError); return; }

    const nameErr = await validateNameUnique(formData.name, data);
    if (nameErr) { setNameError(nameErr); return; }

    // فتح مودال المراجعة
    setShowReview(true);
  };

  // ── تأكيد التسجيل الفعلي من المودال ─────────────────────────
  const handleConfirmSave = async () => {
    await savePlayer({
      name: formData.name,
      phone: formData.phone,
      birthdate: formData.birthdate,
      nationalId: formData.nationalId,
    });
    setShowReview(false);
    setFormData({ name: "", phone: "", birthdate: "", nationalId: "" });
    setNationalIdValid(false);
    setNameError(null);
    setBirthdateError(null);
  };

  return (
    <>
      {/* مودال المراجعة */}
      {showReview && (
        <ReviewModal
          selectionData={data}
          players={formData}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowReview(false)}
          loading={loading}
        />
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-4xl mx-auto"
        dir="rtl"
        aria-label="استمارة تسجيل لاعب فردي">
        <div className="bg-white border-2 border-blue-700 rounded-3xl overflow-hidden shadow-sm">
          {/* رأس النموذج */}
          <div className="bg-blue-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">بيانات اللاعب</h3>
                <p className="text-blue-200 text-xs">استمارة تسجيل فردي</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Card
              formData={formData}
              handleInputChange={handleInputChange}
              handleNationalIdChange={handleNationalIdChange}
              onNationalIdValidation={setNationalIdValid}
              nameError={nameError}
              checkingName={checkingName}
            />

            {birthdateError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200
                           text-amber-800 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{birthdateError}</span>
              </div>
            )}

            {/* زر المراجعة قبل التسجيل */}
            <button
              type="submit"
              disabled={!isFormValid}
              aria-disabled={!isFormValid}
              className={`mt-6 w-full rounded-xl py-3.5 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !isFormValid ?
                  "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md"
              }`}>
              {loading ?
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جارٍ الحفظ...
                </>
              : <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  مراجعة وتسجيل
                </>
              }
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
