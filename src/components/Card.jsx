import React, { useState } from "react";
import uploadImageToCloudinary from "../utils/cloudinary";
import { User, Calendar, Phone, MapPin, Camera, Save } from "lucide-react";
import InputField from "./InputField";

export default function Card({ onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    church: "",
    phone: "",
  });
  const [imageUrl, setImageUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function convertArabicToEnglishNumbers(input) {
    if (typeof input !== "string") return input;
    return input.replace(/[\u0660-\u0669]/g, (d) =>
      String(d.charCodeAt(0) - 0x0660)
    );
  }

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = convertArabicToEnglishNumbers(value);
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadImageToCloudinary(file);
    setImageUrl(url);
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.birthdate ||
      !formData.church ||
      !formData.phone ||
      !imageUrl
    ) {
      alert("الرجاء ملء جميع البيانات قبل الحفظ");
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Form Data:", formData);
    console.log("Image URL:", imageUrl);

    if (onSave) {
      onSave(formData, imageUrl);
    }

    setFormData({ name: "", birthdate: "", church: "", phone: "" });
    setImageUrl(null);
    setIsSubmitting(false);
  };

  const churches = [
    "كنيسة القديس العظيم الأنبا بيشوى",
    "كنيسة السيدة العذراء مريم",
    "كنيسة العذراء والملاك ميخائيل ( الكاتدرال)",
    "كنيسة الشهيد العظيم مارجرجس ببورسعيد",
    "كنيسة الشهيد العظيم مارمينا",
    "كنيسة الشهيد أبي سيفين و الشهيدة العفيفة دميانة",
    "كنيسة القديسين الأنبا أنطونيوس والأنبا بولا",
    "كنيسة السيدة العذراء مريم والبابا كيرلس",
    "كنيسة الشهيد العظيم مارجرجس ببورفؤاد",
    "كنيسة الشهيد العظيم مارمرقص بورفؤاد",
    "كنيسة الشهيدات القديسات بربارة و يوليانة و دميانة",
  ];

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto bg-white/80 backdrop-blur-lg shadow-sm rounded-3xl p-6 border border-blue-700">
          <div className="flex flex-col md:flex-row gap-8 mb-4">
            <div className="w-full md:w-32 flex-shrink-0 flex items-center justify-center">
              <div
                className={`relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-700 transition-all duration-300 group bg-white ${
                  isUploading ? "animate-pulse ring-2 ring-blue-400" : ""
                }`}
                onClick={() => document.getElementById("imageUpload").click()}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center text-gray-400 group-hover:text-blue-700 transition-colors duration-300">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">اضغط هنا لرفع الصورة</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden cursor-pointer"
                required
              />
            </div>
            <div className="flex flex-col gap-4 items-end w-full">
              <InputField
                label={{ icon: User, text: "الإسم" }}
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="الإسم رباعى"
                required={true}
              />
              <InputField
                label={{ icon: Calendar, text: "تاريخ الميلاد" }}
                name="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={handleChange}
                required={true}
              />
              <InputField
                label={{ icon: MapPin, text: "الكنيسة" }}
                name="church"
                type="select"
                value={formData.church}
                onChange={handleChange}
                options={churches}
                required={true}
              />
              <InputField
                label={{ icon: Phone, text: "رقم التليفون" }}
                name="phone"
                type="number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                required={true}
                maxLength={11}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="w-full">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-700 to-blue-700 text-white py-3 rounded-xl font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ البيانات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
