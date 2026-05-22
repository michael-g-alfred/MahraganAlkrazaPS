/**
 * Single.jsx
 * ─────────────────────────────────────────────────────────────────
 * نموذج تسجيل لاعب فردي.
 *
 * يعتمد على:
 * - Card: المكون المشترك لحقول البيانات الأساسية (الاسم، الهاتف، الميلاد، الرقم القومي).
 * - usePlayerSave: hook مخصص لحفظ بيانات اللاعب في Firebase وRedux.
 * - validateBirthdate: التحقق من توافق تاريخ الميلاد مع المرحلة المختارة.
 * - validateNameUnique: التحقق من عدم تكرار الاسم في نفس المرحلة والنوع.
 * - validateQuadName: التحقق من أن الاسم رباعي بالعربية.
 *
 * التحقق يحدث في ثلاث مستويات:
 * 1. الاسم الرباعي — فوري عند الكتابة.
 * 2. عدم تكرار الاسم — بعد 600ms من آخر ضغطة (debounce).
 * 3. توافق تاريخ الميلاد — فوري عند التغيير.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";
import {
  validateBirthdate,
  validateNameUnique,
  validateQuadName,
} from "../utils/validatePlayer";

/**
 * @param {object}   data              - بيانات الاختيار (اللعبة، المرحلة، النوع، الكنيسة، الاستمارة)
 * @param {Function} onUpdateSelection - دالة لتحديث حالة الاختيار في الصفحة الأب (Home)
 */
export default function Single({ data, onUpdateSelection }) {
  // hook الحفظ — يُعيد دالة savePlayer وحالة التحميل
  const { loading, savePlayer } = usePlayerSave(data, onUpdateSelection);

  // ── حالات النموذج ────────────────────────────────────────────

  /** بيانات اللاعب قابلة للتعديل */
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthdate: "",
    nationalId: "",
  });

  /** رسالة خطأ تاريخ الميلاد (null = لا خطأ) */
  const [birthdateError, setBirthdateError] = useState(null);

  /** رسالة خطأ الاسم — تكرار أو غير رباعي (null = لا خطأ) */
  const [nameError, setNameError] = useState(null);

  /** هل الاسم تحت التحقق من عدم التكرار؟ (لمنع الإرسال أثناء الفحص) */
  const [checkingName, setCheckingName] = useState(false);

  /** هل الرقم القومي صحيح وغير مكرر؟ (يأتي من NationalIdInput عبر Card) */
  const [nationalIdValid, setNationalIdValid] = useState(false);

  // ── منطق التحقق التلقائي ─────────────────────────────────────

  /**
   * التحقق من تاريخ الميلاد عند تغييره أو تغيير المرحلة.
   * يُشغَّل فورًا (لا debounce).
   */
  useEffect(() => {
    if (formData.birthdate && data?.stage?.name) {
      setBirthdateError(validateBirthdate(formData.birthdate, data.stage.name));
    } else {
      setBirthdateError(null);
    }
  }, [formData.birthdate, data?.stage?.name]);

  /**
   * التحقق من الاسم بمرحلتين:
   * 1. التحقق الفوري من الصيغة الرباعية.
   * 2. التحقق المؤجل (debounce 600ms) من عدم التكرار في Firebase.
   */
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    // المرحلة الأولى: هل الاسم رباعي؟
    const quadError = validateQuadName(formData.name);
    if (quadError) {
      setNameError(quadError);
      return;
    }

    // المرحلة الثانية: هل الاسم مكرر؟ (بعد 600ms لتجنب طلبات كثيرة)
    const timer = setTimeout(async () => {
      setCheckingName(true);
      setNameError(await validateNameUnique(formData.name, data));
      setCheckingName(false);
    }, 600);

    // تنظيف الـ timer عند تغيير الاسم قبل انتهاء المهلة
    return () => clearTimeout(timer);
  }, [formData.name, data]);

  // ── معالجات الأحداث ──────────────────────────────────────────

  /**
   * يُحدِّث حقل واحد في formData.
   * يُستخدم مع Input component (name, phone, birthdate).
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * يُحدِّث الرقم القومي في formData.
   * يُستدعى من NationalIdInput عبر Card.
   */
  const handleNationalIdChange = (val) => {
    setFormData((prev) => ({ ...prev, nationalId: val }));
  };

  // ── التحقق من صلاحية الإرسال ─────────────────────────────────

  /**
   * هل النموذج صالح للإرسال؟
   * يجب أن تكون جميع الحقول مكتملة وبدون أخطاء.
   */
  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.birthdate &&
    !birthdateError &&
    !nameError &&
    !checkingName &&
    nationalIdValid &&
    !loading;

  /**
   * يُرسل بيانات اللاعب إلى Firebase عبر usePlayerSave.
   * يُجري تحقق نهائي قبل الإرسال للتأكد من عدم تجاوز الفحوصات.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // تحقق نهائي من الاسم الرباعي
    const quadError = validateQuadName(formData.name);
    if (quadError) {
      setNameError(quadError);
      return;
    }

    // تحقق نهائي من تاريخ الميلاد
    const bdError = validateBirthdate(formData.birthdate, data?.stage?.name);
    if (bdError) {
      setBirthdateError(bdError);
      return;
    }

    // تحقق نهائي من عدم تكرار الاسم
    const nameErr = await validateNameUnique(formData.name, data);
    if (nameErr) {
      setNameError(nameErr);
      return;
    }

    // الحفظ في Firebase عبر الـ hook
    await savePlayer({
      name: formData.name,
      phone: formData.phone,
      birthdate: formData.birthdate,
      nationalId: formData.nationalId,
    });

    // تنظيف النموذج بعد الحفظ الناجح
    setFormData({ name: "", phone: "", birthdate: "", nationalId: "" });
    setNationalIdValid(false);
    setNameError(null);
    setBirthdateError(null);
  };

  // ─────────────────────────────────────────────────────────────────
  // العرض
  // ─────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-4xl mx-auto"
      dir="rtl"
      aria-label="استمارة تسجيل لاعب فردي">
      {/* ═══ حاوية النموذج ══════════════════════════════════════════ */}
      <div className="bg-white border-2 border-blue-700 rounded-3xl overflow-hidden shadow-sm">
        {/* رأس النموذج */}
        <div className="bg-blue-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">بيانات اللاعب</h3>
              <p className="text-blue-200 text-xs">استمارة تسجيل فردي</p>
            </div>
          </div>
        </div>

        {/* حقول النموذج */}
        <div className="p-6">
          {/* المكون المشترك للحقول الأساسية */}
          <Card
            formData={formData}
            handleInputChange={handleInputChange}
            handleNationalIdChange={handleNationalIdChange}
            onNationalIdValidation={setNationalIdValid}
          />

          {/* ── رسائل الخطأ ── */}

          {/* خطأ تكرار الاسم (يُعرض فقط إذا لم يكن خطأ الصيغة الرباعية) */}
          {nameError && !validateQuadName(formData.name) && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200
                         text-red-700 text-sm rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{nameError}</span>
            </div>
          )}

          {/* مؤشر التحقق من الاسم */}
          {checkingName && (
            <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm">
              <span
                className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent
                               rounded-full animate-spin flex-shrink-0"
              />
              <span>جارٍ التحقق من الاسم...</span>
            </div>
          )}

          {/* خطأ تاريخ الميلاد */}
          {birthdateError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200
                         text-amber-800 text-sm rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{birthdateError}</span>
            </div>
          )}

          {/* ── زر الإرسال ── */}
          <button
            type="submit"
            disabled={!isFormValid}
            aria-disabled={!isFormValid}
            className={`mt-6 w-full rounded-xl py-3.5 font-bold text-sm transition-all duration-200 ${
              !isFormValid ?
                "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md"
            }`}>
            {loading ?
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جارٍ الحفظ...
              </span>
            : "حفظ اللاعب"}
          </button>
        </div>
      </div>
    </form>
  );
}
