import React, { useState, useEffect, useRef } from "react";
import { Upload, X, FileImage, AlertCircle } from "lucide-react";
import uploadImageToCloudinary from "../utils/cloudinary";

export default function ImagePicker({ required, onImageSelect }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // No object URLs to revoke since we no longer create them
    };
  }, [imageUrl]);

  const validateFile = (file) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "من فضلك اختر ملف صورة صحيح (JPEG, PNG, GIF, أو WebP)";
    }

    if (file.size > maxSize) {
      return "حجم الملف يجب أن يكون أقل من 2 ميجابايت";
    }

    return null;
  };

  const handleFileSelect = (file) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    // We do not create object URLs here anymore
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

    // Show loading indicator while uploading
    setImageUrl(null);

    const uploadedUrl = await uploadImageToCloudinary(file);

    if (uploadedUrl) {
      setImageUrl(uploadedUrl); // Save the Cloudinary URL
      if (onImageSelect) {
        onImageSelect(uploadedUrl);
      }
    } else {
      setError("فشل رفع الصورة");
      setImageUrl(null);
    }

    setIsUploading(false);
  };

  const handleRemove = () => {
    setImageUrl(null);
    setError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        required={required && !imageUrl}
      />

      {!imageUrl ? (
        <button
          type="button"
          className={`w-64 h-64 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-4 transition-colors duration-200 ${
            isDragging
              ? "border-blue-700 bg-blue-50"
              : "border-gray-300 hover:border-blue-700 hover:bg-blue-50"
          }`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isUploading}>
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-blue-700">
                <svg
                  className="animate-spin h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <p className="text-lg font-medium">جاري الرفع...</p>
              </div>
            ) : isDragging ? (
              <Upload className="w-12 h-12 text-blue-700" />
            ) : (
              <FileImage className="w-12 h-12 text-gray-400" />
            )}
            {!isUploading && (
              <>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700">
                    {isDragging ? "أسقط صورتك هنا" : "اختر صورة"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    اضغط للاختيار أو اسحب وأفلت
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    يدعم: JPEG, PNG, GIF, WebP (بحد أقصى 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="w-64 h-64 flex flex-col items-center">
          <div className="relative group">
            {isUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                <p className="text-gray-700 font-medium">جاري الرفع...</p>
              </div>
            )}
            <img
              src={imageUrl}
              alt="Selected preview"
              className="w-64 h-64 object-cover rounded-xl shadow-xs border-2 border-dashed border-blue-700"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xs transition-colors duration-200">
              <X className="w-4 h-4" />
            </button>
            <div className="w-full absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 p-2">
              <button
                onClick={handleClick}
                className="w-full justify-center px-3 py-1.5 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg shadow-xs transition-colors duration-200 flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4" />
                تغيير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
