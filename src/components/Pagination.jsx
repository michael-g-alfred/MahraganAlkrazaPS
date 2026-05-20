import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div
      className="flex justify-center items-center gap-2 py-6 border-t border-slate-100"
      dir="rtl">
      {/* زر السابق */}
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
          currentPage === 1 ?
            "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
        }`}>
        السابق
      </button>

      {/* العداد الرقمي */}
      <div className="text-sm text-slate-600 font-medium px-2">
        صفحة {currentPage} من {totalPages}
      </div>

      {/* زر التالي */}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
          currentPage === totalPages ?
            "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
        }`}>
        التالي
      </button>
    </div>
  );
}
