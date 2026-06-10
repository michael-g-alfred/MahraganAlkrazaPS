import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import toast from "react-hot-toast";

function toEnglishDigits(str) {
  return str
    .replace(/[\u0660-\u0669]/g, (c) => c.charCodeAt(0) - 0x0660)
    .replace(/[\u06F0-\u06F9]/g, (c) => c.charCodeAt(0) - 0x06F0);
}

const FIELDS = [
  { key: "name", label: "اسم اللاعب", type: "text", placeholder: "الاسم رباعي بالعربية" },
  { key: "nationalId", label: "الرقم القومى", type: "text", placeholder: "14 رقم", maxLength: 14 },
  { key: "phone", label: "رقم التليفون", type: "tel", placeholder: "01XXXXXXXXX" },
  { key: "birthdate", label: "تاريخ الميلاد", type: "date" },
  { key: "church", label: "الكنيسة", type: "text", placeholder: "اسم الكنيسة" },
  { key: "team", label: "الفريق", type: "text", placeholder: "اسم الفريق (اختياري)" },
];

export default function EditPlayerModal({ player, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: player.name || "",
    nationalId: player.nationalId || "",
    phone: player.phone || "",
    birthdate: player.birthdate || "",
    church: player.church || "",
    team: player.team || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    else if (!/^[\u0600-\u06FF]+([ ][\u0600-\u06FF]+){3}$/.test(form.name.trim()))
      errs.name = "يجب أن يكون الاسم رباعياً بحروف عربية";
    if (form.nationalId && !/^\d{14}$/.test(form.nationalId))
      errs.nationalId = "الرقم القومى 14 رقم بالإنجليزية";
    if (form.phone && !/^01[0-9]{9}$/.test(form.phone))
      errs.phone = "رقم التليفون يبدأ بـ 01 ويكون 11 رقم";
    return errs;
  };

  const handleChange = (key, value) => {
    let val = value;
    if (key === "phone") val = toEnglishDigits(value);
    if (key === "nationalId") val = toEnglishDigits(value).replace(/\D/g, "").slice(0, 14);
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`تعديل بيانات ${player.name}`}
    >
      <div
        dir="rtl"
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "2px solid #1d4ed8",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ background: "#1d4ed8", padding: "1rem 1.25rem", borderRadius: "18px 18px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-edit" style={{ color: "white", fontSize: 16 }} aria-hidden="true" />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>تعديل بيانات اللاعب</p>
              <p style={{ color: "#bfdbfe", fontSize: 12, margin: 0 }}>{player.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="إغلاق"
          >
            <i className="ti ti-x" style={{ color: "white", fontSize: 16 }} aria-hidden="true" />
          </button>
        </div>

        {/* Info badges - read-only */}
        <div style={{ padding: "0.75rem 1.25rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: player.game, icon: "ti-trophy" },
            { label: player.stage, icon: "ti-calendar" },
            { label: player.gender, icon: "ti-user" },
            { label: player.form, icon: "ti-forms" },
          ].filter(b => b.label).map((badge, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", color: "#1e40af", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid #bfdbfe" }}>
              <i className={`ti ${badge.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
              {badge.label}
            </span>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f1f5f9", color: "#64748b", fontSize: 11, padding: "3px 8px", borderRadius: 20 }}>
            <i className="ti ti-lock" style={{ fontSize: 11 }} aria-hidden="true" />
            حقول للقراءة فقط
          </span>
        </div>

        {/* Form fields */}
        <div style={{ padding: "1.25rem" }}>
          <div style={{ display: "grid", gap: 16 }}>
            {FIELDS.map(({ key, label, type, placeholder, maxLength }) => (
              <div key={key}>
                <label style={{ display: "block", marginBottom: 6, color: "#1d4ed8", fontWeight: 600, fontSize: 14 }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  inputMode={type === "tel" || key === "nationalId" ? "numeric" : undefined}
                  style={{
                    width: "100%",
                    border: errors[key] ? "2px solid #ef4444" : "1.5px solid #1d4ed8",
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
                  <p style={{ margin: "4px 0 0", color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 12 }} aria-hidden="true" />
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: saving ? "#93c5fd" : "#1d4ed8", color: "white", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}
            >
              {saving ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <i className="ti ti-check" style={{ fontSize: 16 }} aria-hidden="true" />
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
