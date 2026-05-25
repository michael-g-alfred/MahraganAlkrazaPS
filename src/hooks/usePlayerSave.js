import { useState } from "react";
import toast from "react-hot-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

// ترجمة أكواد خطأ Firebase لرسائل عربية مفهومة
function getFirebaseErrorMessage(err) {
  const code = err?.code || "";
  const message = err?.message || "";

  if (code === "permission-denied" || message.includes("permission-denied"))
    return "❌ ليس لديك صلاحية — تحقق من قواعد Firestore";
  if (code === "unavailable" || message.includes("unavailable"))
    return "❌ الخادم غير متاح حالياً — تحقق من الإنترنت وحاول مرة أخرى";
  if (code === "quota-exceeded" || message.includes("quota"))
    return "❌ تم تجاوز حصة الاستخدام — تواصل مع المسؤول";
  if (code === "unauthenticated" || message.includes("unauthenticated"))
    return "❌ يجب تسجيل الدخول أولاً";
  if (message.includes("offline") || message.includes("network"))
    return "❌ لا يوجد اتصال بالإنترنت";

  // إظهار الخطأ الحرفي إن لم يُعرَّف
  return `❌ خطأ: ${message || code || "غير معروف"}`;
}

export default function usePlayerSave(selectionData, onUpdateSelection) {
  const [loading, setLoading] = useState(false);

  const resetSelection = () => {
    onUpdateSelection?.({
      gender: null,
      game: null,
      stage: null,
      church: null,
      form: null,
    });
  };

  const savePlayer = async ({ name, phone, birthdate, nationalId }) => {
    setLoading(true);
    const player = {
      nationalId: nationalId || "",
      name,
      gender: selectionData?.gender?.name || "",
      game: selectionData?.game?.name || "",
      stage: selectionData?.stage?.name || "",
      church: selectionData?.church?.name || "",
      phone,
      birthdate,
      form: selectionData?.form?.name || "",
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "players"), player);
      toast.success("تم حفظ اللاعب بنجاح 🎉");
      resetSelection();
    } catch (err) {
      console.error("❌ savePlayer error:", err);
      const errorMsg = getFirebaseErrorMessage(err);
      // إظهار رسالة الخطأ الحقيقية للمستخدم
      toast.error(errorMsg, {
        duration: 6000,
        style: { maxWidth: "400px", textAlign: "right", direction: "rtl" },
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTeam = async (players, teamName) => {
    setLoading(true);
    try {
      for (const p of players) {
        const playerData = {
          name: p.name,
          nationalId: p.nationalId || "",
          gender: selectionData?.gender?.name || "",
          game: selectionData?.game?.name || "",
          stage: selectionData?.stage?.name || "",
          church: selectionData?.church?.name || "",
          phone: p.phone,
          birthdate: p.birthdate,
          form: selectionData?.form?.name || "",
          team: teamName,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "players"), playerData);
      }
      toast.success("تم حفظ الفريق بالكامل بنجاح 🎉");
      resetSelection();
    } catch (err) {
      console.error("❌ saveTeam error:", err);
      const errorMsg = getFirebaseErrorMessage(err);
      toast.error(errorMsg, {
        duration: 6000,
        style: { maxWidth: "400px", textAlign: "right", direction: "rtl" },
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, savePlayer, saveTeam };
}
