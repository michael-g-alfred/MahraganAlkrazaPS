import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addPlayer } from "../redux/features/PlayerSlice";
import toast from "react-hot-toast";
import Card from "../components/Card";

export default function Single({ data, onUpdateSelection }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthdate: "",
  });
  const [imageUrl, setImageUrl] = useState(null);

  const handleImageChange = (url) => {
    setImageUrl(url);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid =
    formData.name &&
    formData.phone &&
    formData.birthdate &&
    imageUrl &&
    !loading;

  async function savePlayer(formDataObj) {
    setLoading(true);
    const player = {
      name: formDataObj.get("name"),
      phone: formDataObj.get("phone"),
      birthdate: formDataObj.get("birthdate"),
      church: data?.church?.name || "",
      game: data?.game?.name || "",
      stage: data?.stage?.name || "",
      image: imageUrl || "",
      form: data?.form?.name || "",
    };

    try {
      const response = await fetch(
        "https://mahragan-alkraza-ps-default-rtdb.firebaseio.com/players.json",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(player),
        }
      );

      if (!response.ok) throw new Error("Failed to save player data");

      dispatch(addPlayer(player));
      toast.success("تم حفظ اللاعب بنجاح 🎉");
      if (onUpdateSelection) {
        onUpdateSelection({
          stage: null,
          game: null,
          church: null,
          form: null,
        });
      }
    } catch {
      toast.error("حدث خطأ أثناء الحفظ ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await savePlayer(new FormData(e.target));
      }}
      className="grid grid-cols-1 gap-4 max-w-4xl mx-auto border-2 border-blue-700 p-6 rounded-3xl bg-white/80 backdrop-blur-lg"
      dir="rtl">
      <Card
        formData={formData}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
      />

      <button
        type="submit"
        disabled={!isFormValid}
        className={`rounded-lg p-4 font-semibold transition ${
          !isFormValid
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-700 text-white hover:bg-blue-800"
        }`}>
        {loading ? "جارٍ الحفظ..." : "حفظ اللاعب"}
      </button>
    </form>
  );
}
