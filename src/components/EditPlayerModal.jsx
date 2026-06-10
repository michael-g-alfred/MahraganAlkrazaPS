import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import toast from "react-hot-toast";

// ── بيانات الخيارات ────────────────────────────────────────────────
import churches from "../data/churches";
import games from "../data/games";
import genders from "../data/genders";
import forms from "../data/forms";
import stages from "../data/stages";

function toEnglishDigits(str) {
  return str
    .replace(/[\u0660-\u0669]/g, (c) => c.charCodeAt(0) - 0x0660)
    .replace(/[\u06F0-\u06F9]/g, (c) => c.charCodeAt(0) - 0x06f0);
}

// حقول النص العادية
const TEXT_FIELDS = [
  {
    key: "name",
    label: "اسم اللاعب",
    type: "text",
    placeholder: "الاسم رباعي بالعربية",
  },
  {
    key: "nationalId",
    label: "الرقم القومى",
    type: "text",
    placeholder: "14 رقم",
    maxLength: 14,
  },
  {
    key: "phone",
    label: "رقم التليفون",
    type: "tel",
    placeholder: "01XXXXXXXXX",
  },
  { key: "birthdate", label: "تاريخ الميلاد", type: "date" },
];

// حقول الـ picker
const PICKER_FIELDS = [
  {
    key: "gender",
    label: "النوع",
    icon: "ti-user",
    options: genders.map((g) => g.name),
  },
  {
    key: "game",
    label: "اللعبة",
    icon: "ti-trophy",
    options: games.map((g) => g.name),
  },
  {
    key: "stage",
    label: "المرحلة",
    icon: "ti-calendar",
    options: stages.map((s) => s.name),
  },
  {
    key: "church",
    label: "الكنيسة",
    icon: "ti-building-church",
    options: churches.map((c) => c.name),
  },
  {
    key: "form",
    label: "نوع الاستمارة",
    icon: "ti-forms",
    options: forms.map((f) => f.name),
  },
];

// ── مكون الـ Picker داخل الموديل ──────────────────────────────────
function PickerField({ label, icon, options, value, onChange, error }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          color: "#1d4ed8",
          fontWeight: 600,
          fontSize: 14,
        }}>
        <i
          className={`ti ${icon}`}
          style={{ marginLeft: 6, fontSize: 14 }}
          aria-hidden="true"
        />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: error ? "2px solid #ef4444" : "1.5px solid #1d4ed8",
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
          background: error ? "#fef2f2" : "white",
          color: value ? "#0f172a" : "#94a3b8",
          fontFamily: "inherit",
          cursor: "pointer",
          appearance: "auto",
        }}>
        <option value="">-- اختر {label} --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && (
        <p
          style={{
            margin: "4px 0 0",
            color: "#dc2626",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: 12 }}
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}

// ── مكون سطر المقارنة (قبل / بعد) ────────────────────────────────
function DiffRow({ label, before, after }) {
  const changed = String(before || "") !== String(after || "");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px 1fr 1fr",
        gap: 8,
        padding: "8px 0",
        borderBottom: "0.5px solid #e2e8f0",
        alignItems: "start",
      }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: changed ? "#dc2626" : "#475569",
          background: changed ? "#fef2f2" : "transparent",
          borderRadius: 6,
          padding: changed ? "2px 6px" : 0,
          textDecoration: changed ? "line-through" : "none",
          wordBreak: "break-word",
        }}>
        {before || "—"}
      </span>
      <span
        style={{
          fontSize: 12,
          color: changed ? "#16a34a" : "#475569",
          background: changed ? "#f0fdf4" : "transparent",
          borderRadius: 6,
          padding: changed ? "2px 6px" : 0,
          fontWeight: changed ? 700 : 400,
          wordBreak: "break-word",
        }}>
        {after || "—"}
      </span>
    </div>
  );
}

// ── الموديل الرئيسي ───────────────────────────────────────────────
export default function EditPlayerModal({ player, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: player.name || "",
    nationalId: player.nationalId || "",
    phone: player.phone || "",
    birthdate: player.birthdate || "",
    church: player.church || "",
    team: player.team || "",
    gender: player.gender || "",
    game: player.game || "",
    stage: player.stage || "",
    form: player.form || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    else if (
      !/^[\u0600-\u06FF]+([ ][\u0600-\u06FF]+){3}$/.test(form.name.trim())
    )
      errs.name = "يجب أن يكون الاسم رباعياً بحروف عربية";
    if (form.nationalId && !/^\d{14}$/.test(form.nationalId))
      errs.nationalId = "الرقم القومى 14 رقم بالإنجليزية";
    if (form.phone && !/^01[0-9]{9}$/.test(form.phone))
      errs.phone = "رقم التليفون يبدأ بـ 01 ويكون 11 رقم";
    if (!form.gender) errs.gender = "اختر النوع";
    if (!form.game) errs.game = "اختر اللعبة";
    if (!form.stage) errs.stage = "اختر المرحلة";
    if (!form.church) errs.church = "اختر الكنيسة";
    if (!form.form) errs.form = "اختر نوع الاستمارة";
    return errs;
  };

  const handleChange = (key, value) => {
    let val = value;
    if (key === "phone") val = toEnglishDigits(value);
    if (key === "nationalId")
      val = toEnglishDigits(value).replace(/\D/g, "").slice(0, 14);
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const updateData = {
        name: form.name.trim(),
        nationalId: form.nationalId.trim(),
        phone: form.phone.trim(),
        birthdate: form.birthdate,
        church: form.church.trim(),
        gender: form.gender,
        game: form.game,
        stage: form.stage,
        form: form.form,
      };
      if (form.team.trim()) updateData.team = form.team.trim();
      await updateDoc(doc(db, "players", player.id), updateData);
      toast.success("تم تحديث بيانات اللاعب ✅");
      onSaved({ ...player, ...updateData });
      onClose();
    } catch {
      toast.error("فشل التحديث، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  // ── حقول المقارنة (قبل / بعد) ─────────────────────────────────
  const DIFF_FIELDS = [
    { key: "name", label: "الاسم" },
    { key: "nationalId", label: "الرقم القومى" },
    { key: "phone", label: "التليفون" },
    { key: "birthdate", label: "تاريخ الميلاد" },
    { key: "gender", label: "النوع" },
    { key: "game", label: "اللعبة" },
    { key: "stage", label: "المرحلة" },
    { key: "church", label: "الكنيسة" },
    { key: "form", label: "الاستمارة" },
    { key: "team", label: "الفريق" },
  ];

  const hasChanges = DIFF_FIELDS.some(
    ({ key }) => String(player[key] || "") !== String(form[key] || ""),
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`تعديل بيانات ${player.name}`}>
      <div
        dir="rtl"
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          maxHeight: "92vh",
          overflowY: "auto",
          border: "2px solid #1d4ed8",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}>
        {/* ── Header ── */}
        <div
          style={{
            background: "#1d4ed8",
            padding: "1rem 1.25rem",
            borderRadius: "18px 18px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <i
                className="ti ti-edit"
                style={{ color: "white", fontSize: 16 }}
                aria-hidden="true"
              />
            </div>
            <div>
              <p
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                }}>
                تعديل بيانات اللاعب
              </p>
              <p style={{ color: "#bfdbfe", fontSize: 12, margin: 0 }}>
                {player.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="إغلاق">
            <i
              className="ti ti-x"
              style={{ color: "white", fontSize: 16 }}
              aria-hidden="true"
            />
          </button>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* ── حقول النص ── */}
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              fontWeight: 700,
              color: "#1d4ed8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
            البيانات الأساسية
          </p>
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            {TEXT_FIELDS.map(({ key, label, type, placeholder, maxLength }) => (
              <div key={key}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#1d4ed8",
                    fontWeight: 600,
                    fontSize: 14,
                  }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  inputMode={
                    type === "tel" || key === "nationalId" ?
                      "numeric"
                    : undefined
                  }
                  style={{
                    width: "100%",
                    border:
                      errors[key] ? "2px solid #ef4444" : "1.5px solid #1d4ed8",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    background: errors[key] ? "#fef2f2" : "white",
                    color: "#0f172a",
                    fontFamily: "inherit",
                  }}
                />
                {errors[key] && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#dc2626",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                    <i
                      className="ti ti-alert-circle"
                      style={{ fontSize: 12 }}
                      aria-hidden="true"
                    />
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}

            {/* حقل الفريق (اختياري) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#1d4ed8",
                  fontWeight: 600,
                  fontSize: 14,
                }}>
                اسم الفريق{" "}
                <span
                  style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>
                  (اختياري)
                </span>
              </label>
              <input
                type="text"
                value={form.team}
                onChange={(e) => handleChange("team", e.target.value)}
                placeholder="اسم الفريق"
                style={{
                  width: "100%",
                  border: "1.5px solid #1d4ed8",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "white",
                  color: "#0f172a",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* ── حقول الـ Picker ── */}
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              fontWeight: 700,
              color: "#1d4ed8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
            تفاصيل التسجيل
          </p>
          <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
            {PICKER_FIELDS.map(({ key, label, icon, options }) => (
              <PickerField
                key={key}
                label={label}
                icon={icon}
                options={options}
                value={form[key]}
                onChange={(val) => handleChange(key, val)}
                error={errors[key]}
              />
            ))}
          </div>

          {/* ── قسم المقارنة (قبل / بعد) ── */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              marginBottom: 20,
            }}>
            <div
              style={{
                background: hasChanges ? "#eff6ff" : "#f8fafc",
                padding: "10px 14px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i
                  className="ti ti-git-compare"
                  style={{ fontSize: 16, color: "#1d4ed8" }}
                  aria-hidden="true"
                />
                <span
                  style={{ fontWeight: 700, fontSize: 13, color: "#1d4ed8" }}>
                  ملخص التغييرات
                </span>
              </div>
              {hasChanges ?
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#dbeafe",
                    color: "#1e40af",
                    borderRadius: 20,
                    padding: "2px 10px",
                    border: "1px solid #bfdbfe",
                  }}>
                  يوجد تعديلات
                </span>
              : <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  لا يوجد تعديلات
                </span>
              }
            </div>

            {/* رأس الجدول */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr 1fr",
                gap: 8,
                padding: "6px 14px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f1f5f9",
              }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                الحقل
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
                <i
                  className="ti ti-circle-minus"
                  style={{ fontSize: 11, marginLeft: 4 }}
                />
                قبل
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                <i
                  className="ti ti-circle-plus"
                  style={{ fontSize: 11, marginLeft: 4 }}
                />
                بعد
              </span>
            </div>

            <div style={{ padding: "4px 14px" }}>
              {DIFF_FIELDS.map(({ key, label }) => (
                <DiffRow
                  key={key}
                  label={label}
                  before={player[key]}
                  after={form[key]}
                />
              ))}
            </div>
          </div>

          {/* ── أزرار الحفظ / الإلغاء ── */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}>
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{
                flex: 2,
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: saving || !hasChanges ? "#93c5fd" : "#1d4ed8",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
              }}>
              {saving ?
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  جارٍ الحفظ...
                </>
              : <>
                  <i
                    className="ti ti-check"
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  />
                  {hasChanges ? "حفظ التعديلات" : "لا يوجد تعديلات"}
                </>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
