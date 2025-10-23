import React from "react";
import ImagePicker from "./ImagePicker";
import Input from "./Input";

export default function Card({
  formData,
  handleInputChange,
  handleImageChange,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-center">
      <ImagePicker onImageSelect={handleImageChange} required />
      <div className="flex flex-col gap-4 w-full">
        <Input
          label="اسم اللاعب"
          type="text"
          name="name"
          placeholder="اكتب الاسم رباعي"
          required
          value={formData.name}
          onChange={handleInputChange}
        />
        <Input
          label="رقم تليفون اللاعب"
          type="tel"
          name="phone"
          placeholder="01XXXXXXXXX"
          pattern="^01[0-9]{9}$"
          maxLength="11"
          required
          value={formData.phone}
          onChange={handleInputChange}
        />
        <Input
          label="تاريخ ميلاد اللاعب"
          type="date"
          name="birthdate"
          required
          value={formData.birthdate}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
