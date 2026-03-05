import React, { useState, useRef, useId } from "react";
import { Upload, X, FileImage, AlertCircle } from "lucide-react";
import uploadImageToCloudinary from "../utils/cloudinary";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB  (UI and logic now match)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ImagePicker({ required, onImageSelect }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const inputId = useId(); // unique ID for label association

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "من فضلك اختر ملف صورة صحيح (JPEG, PNG, GIF, أو WebP)";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return "حجم الملف يجب أن يكون أقل من 10 ميجابايت";
    }
    return null;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setImageUrl(null);

    const uploadedUrl = await uploadImageToCloudinary(file);

    if (uploadedUrl) {
      setImageUrl(uploadedUrl);
      onImageSelect?.(uploadedUrl);
    } else {
      setError("فشل رفع الصورة، يرجى المحاولة مرة أخرى");
      setImageUrl(null);
    }

    setIsUploading(false);
  };

  const handleRemove = () => {
    setImageUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onImageSelect?.(null);
  };

  return (
    <div>
      {/* Accessible hidden file input linked via htmlFor/id */}
      <label htmlFor={inputId} className="sr-only">
        اختر صورة البطاقة أو شهادة الميلاد
      </label>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-hidden="true"
        required={required && !imageUrl}
      />

      {!imageUrl ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="اختر صورة البطاقة أو شهادة الميلاد"
          aria-busy={isUploading}
          className="group w-64 h-64 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-4 transition-colors duration-200 border-gray-300 hover:border-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex flex-col items-center">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-blue-700">
                <svg
                  className="animate-spin h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <p className="text-lg font-medium" dir="rtl">
                  جاري الرفع...
                </p>
              </div>
            ) : (
              <>
                <FileImage
                  className="w-12 h-12 text-gray-400 group-hover:text-blue-700 mb-4"
                  aria-hidden="true"
                />
                <div className="text-center flex flex-col items-center gap-1">
                  <p className="text-sm font-bold text-gray-700 px-4 group-hover:text-blue-700">
                    اختر صورة البطاقة أو شهادة الميلاد
                  </p>
                  <p className="text-xs text-gray-400 mt-2 group-hover:text-blue-700">
                    يدعم: JPEG, PNG, GIF, WebP
                  </p>
                  <p className="text-xs text-gray-400 group-hover:text-blue-700">
                    (بحد أقصى 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="w-64 h-64 flex flex-col items-center">
          <div className="relative group">
            <img
              src={imageUrl}
              alt="معاينة الصورة المختارة"
              className="w-64 h-64 object-cover rounded-xl shadow-xs border-2 border-dashed border-blue-700"
              loading="lazy"
            />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="حذف الصورة المختارة"
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xs transition-colors duration-200"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="w-full absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="تغيير الصورة"
                className="w-full justify-center px-3 py-1.5 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg shadow-xs transition-colors duration-200 flex items-center gap-1.5 text-sm"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                تغيير
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
