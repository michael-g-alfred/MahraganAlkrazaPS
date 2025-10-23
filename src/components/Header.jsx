import React from "react";
import Trophy from "../icons/Trophy";

export default function Header() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 border-3 border-blue-700 rounded-full mb-6">
        <Trophy />
      </div>
      <h1 className="text-4xl font-bold text-blue-700 mb-2">
        مهرجان الكرازة المرقسية {new Date().getFullYear()}
      </h1>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        المسابقة الرياضية - بورسعيد
      </h2>
      <hr className="max-w-xl mx-auto h-1 bg-blue-700 border-none rounded-full my-6 shadow-md" />
    </div>
  );
}
