import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../utils/firebase";

const ID_LENGTH = 14;

// تحويل الأرقام العربية والفارسية إلى إنجليزية
function toEnglishDigits(str) {
  return str
    .replace(/[\u0660-\u0669]/g, (c) => c.charCodeAt(0) - 0x0660) // عربية
    .replace(/[\u06F0-\u06F9]/g, (c) => c.charCodeAt(0) - 0x06f0); // فارسية
}

async function checkNationalIdUnique(nationalId) {
  if (nationalId.length !== ID_LENGTH) return null;
  try {
    const q = query(
      collection(db, "players"),
      where("nationalId", "==", nationalId),
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count > 0 ? "هذا الرقم القومى مسجل من قبل" : null;
  } catch {
    return null;
  }
}

export default function NationalIdInput({
  value,
  onChange,
  required,
  onValidationChange,
  onError,
  onChecking,
  onSuccess,
}) {
  const digits = Array.from({ length: ID_LENGTH }, (_, i) => value?.[i] || "");

  const inputRefs = useRef([]);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef(null);

  const fullId = digits.join("");
  const isComplete = fullId.length === ID_LENGTH && !digits.includes("");

  useEffect(() => {
    onChecking?.(checking);
  }, [checking, onChecking]);
  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  useEffect(() => {
    const isValid = isComplete && !checking && !error;
    onValidationChange?.(isValid);
    onSuccess?.(isValid);
  }, [isComplete, checking, error, onValidationChange, onSuccess]);

  useEffect(() => {
    if (!isComplete) {
      setError(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      onValidationChange?.(false);
      const err = await checkNationalIdUnique(fullId);
      setError(err);
      setChecking(false);
    }, 500);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updateDigit = useCallback(
    (index, char) => {
      const arr = Array.from({ length: ID_LENGTH }, (_, i) => value?.[i] || "");
      arr[index] = char;
      onChange(arr.join(""));
    },
    [value, onChange],
  );

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        updateDigit(index, "");
      } else if (index > 0) {
        updateDigit(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleInput = (e, index) => {
    // تحويل الأرقام العربية/الفارسية لإنجليزية أولاً
    const converted = toEnglishDigits(e.target.value);
    const val = converted.replace(/\D/g, "");
    if (!val) return;
    const char = val[val.length - 1];
    updateDigit(index, char);
    if (index < ID_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e, startIndex) => {
    e.preventDefault();
    // تحويل الأرقام العربية/الفارسية في النص الملصق
    const raw = toEnglishDigits(e.clipboardData.getData("text"))
      .replace(/\D/g, "")
      .slice(0, ID_LENGTH - startIndex);
    if (!raw) return;

    const arr = Array.from({ length: ID_LENGTH }, (_, i) => value?.[i] || "");
    raw.split("").forEach((ch, i) => {
      if (startIndex + i < ID_LENGTH) arr[startIndex + i] = ch;
    });
    onChange(arr.join(""));
    const nextFocus = Math.min(startIndex + raw.length, ID_LENGTH - 1);
    setTimeout(() => inputRefs.current[nextFocus]?.focus(), 0);
  };

  return (
    <div dir="rtl">
      <label className="block mb-3 text-blue-700 font-semibold">
        الرقم القومى (بالإنجليزية)
        <span className="text-gray-400 text-xs font-normal me-2">(١٤ رقم)</span>
      </label>

      <div
        className="flex flex-wrap gap-1.5 justify-start items-center"
        dir="ltr">
        {Array.from({ length: ID_LENGTH }, (_, i) => {
          const isGroupStart = i === 1 || i === 7 || i === 10;
          return (
            <React.Fragment key={i}>
              {isGroupStart && (
                <span className="text-blue-300 font-bold text-lg select-none">
                  -
                </span>
              )}
              <input
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={2}
                value={digits[i]}
                onChange={(e) => handleInput(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={(e) => handlePaste(e, i)}
                onFocus={(e) => e.target.select()}
                required={required && i === 0}
                aria-label={`الرقم القومى - الخانة ${i + 1} من ${ID_LENGTH}`}
                className={`
                  w-9 h-11 text-center text-lg font-bold rounded-lg border-2 outline-none
                  transition-all duration-150 select-none
                  ${
                    digits[i] ?
                      error && isComplete ?
                        "border-red-400 bg-red-50 text-red-700"
                      : isComplete && !checking && !error ?
                        "border-green-500 bg-green-50 text-green-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-800 hover:border-blue-400"
                  }
                  focus:border-blue-700 focus:bg-blue-50 focus:shadow-[0_0_0_3px_rgba(29,78,216,0.15)]
                  caret-transparent
                `}
              />
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-2 min-h-[1rem]">
        {!isComplete && fullId.length > 0 && (
          <p className="text-gray-400 text-xs">
            {ID_LENGTH - fullId.length} خانة متبقية
          </p>
        )}
      </div>
    </div>
  );
}
