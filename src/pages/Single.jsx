import React, { useState } from "react";
import usePlayerSave from "../hooks/usePlayerSave";
import Card from "../components/Card";

export default function Single({ data, onUpdateSelection }) {
  const { loading, savePlayer } = usePlayerSave(data, onUpdateSelection);

  const [formData, setFormData] = useState({ name: "", phone: "", birthdate: "" });
  const [imageUrl, setImageUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.birthdate &&
    imageUrl &&
    !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await savePlayer({ ...formData, imageUrl });
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
