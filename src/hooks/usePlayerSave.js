import { useState } from "react";
import { useDispatch } from "react-redux";
import { addPlayer } from "../redux/features/PlayerSlice";
import toast from "react-hot-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

export default function usePlayerSave(selectionData, onUpdateSelection) {
  const dispatch = useDispatch();
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
      dispatch(addPlayer(player));
      toast.success("تم حفظ اللاعب بنجاح 🎉");
      resetSelection();
    } catch (err) {
      console.error("❌ savePlayer error:", err);
      toast.error("حدث خطأ أثناء الحفظ ❌");
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
        dispatch(addPlayer(playerData));
      }
      toast.success("تم حفظ الفريق بالكامل بنجاح 🎉");
      resetSelection();
    } catch (err) {
      console.error("❌ saveTeam error:", err);
      toast.error("حدث خطأ أثناء حفظ الفريق ❌");
    } finally {
      setLoading(false);
    }
  };

  return { loading, savePlayer, saveTeam };
}
