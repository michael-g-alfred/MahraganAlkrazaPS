import React from "react";

export default function StepHeader({ step, title }) {
  return (
    <div className="flex items-center gap-4 mb-4 border border-blue-700 rounded-full p-2 bg-blue-700">
      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full text-blue-700 font-bold text-lg">
        {step}
      </div>
      <h2 className="text-3xl font-bold text-blue-50 flex items-center gap-3">
        {title}
      </h2>
    </div>
  );
}
