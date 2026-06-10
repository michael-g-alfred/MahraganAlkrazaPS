import React from "react";

const LABEL_MAP = {
  gender: "النوع",
  game: "اللعبة",
  stage: "المرحلة",
  church: "الكنيسة",
  form: "نوع الاستمارة",
};

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #e2e8f0" }}>
      <span style={{ minWidth: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: "#1d4ed8" }} aria-hidden="true" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 500 }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 14, color: "#0f172a", fontWeight: 600, wordBreak: "break-word" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function PlayerCard({ player, index }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1d4ed8", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {index + 1}
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a" }}>{player.name}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 12 }}>
        <div style={{ color: "#475569" }}>
          <span style={{ color: "#94a3b8" }}>رقم قومى: </span>
          <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{player.nationalId || "—"}</span>
        </div>
        <div style={{ color: "#475569" }}>
          <span style={{ color: "#94a3b8" }}>تليفون: </span>
          <span style={{ fontFamily: "monospace" }}>{player.phone || "—"}</span>
        </div>
        <div style={{ color: "#475569" }}>
          <span style={{ color: "#94a3b8" }}>ميلاد: </span>
          <span>{player.birthdate || "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewModal({ selectionData, players, teamName, onConfirm, onCancel, loading }) {
  const isTeam = selectionData?.form?.name === "جماعى";
  const playerList = isTeam ? players : [players];

  const selectionItems = [
    { icon: "ti-user", label: "النوع", value: selectionData?.gender?.name },
    { icon: "ti-trophy", label: "اللعبة", value: selectionData?.game?.name },
    { icon: "ti-calendar", label: "المرحلة", value: selectionData?.stage?.name },
    { icon: "ti-building-church", label: "الكنيسة", value: selectionData?.church?.name },
    { icon: "ti-forms", label: "نوع الاستمارة", value: selectionData?.form?.name },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-label="مراجعة بيانات التسجيل"
    >
      <div
        dir="rtl"
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "2px solid #1d4ed8",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{ background: "#1d4ed8", padding: "1rem 1.25rem", borderRadius: "18px 18px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-clipboard-check" style={{ color: "white", fontSize: 18 }} aria-hidden="true" />
          </div>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>مراجعة قبل التسجيل</p>
            <p style={{ color: "#bfdbfe", fontSize: 12, margin: 0 }}>تأكد من صحة البيانات قبل الإرسال</p>
          </div>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* Selection summary */}
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            بيانات التسجيل
          </p>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "4px 12px", marginBottom: 20, border: "1px solid #e2e8f0" }}>
            {selectionItems.map(({ icon, label, value }) => (
              <InfoRow key={label} icon={icon} label={label} value={value} />
            ))}
          </div>

          {/* Team name if applicable */}
          {isTeam && teamName && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ecfdf5", borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: "1px solid #a7f3d0" }}>
              <i className="ti ti-users" style={{ color: "#059669", fontSize: 18 }} aria-hidden="true" />
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>اسم الفريق</p>
                <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: "#065f46" }}>{teamName}</p>
              </div>
            </div>
          )}

          {/* Players */}
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isTeam ? `اللاعبون (${playerList.length})` : "بيانات اللاعب"}
          </p>
          <div>
            {playerList.map((p, i) => (
              <PlayerCard key={i} player={p} index={i} />
            ))}
          </div>

          {/* Warning note */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fffbeb", borderRadius: 10, padding: "10px 12px", marginTop: 12, border: "1px solid #fde68a" }}>
            <i className="ti ti-info-circle" style={{ color: "#d97706", fontSize: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
              بعد الضغط على "تأكيد التسجيل" لن تتمكن من التراجع. تأكد من صحة جميع البيانات.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              <i className="ti ti-arrow-right" style={{ fontSize: 14, marginLeft: 4 }} aria-hidden="true" />
              تعديل
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: loading ? "#93c5fd" : "#1d4ed8", color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  جارٍ التسجيل...
                </>
              ) : (
                <>
                  <i className="ti ti-check" style={{ fontSize: 16 }} aria-hidden="true" />
                  تأكيد التسجيل
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
