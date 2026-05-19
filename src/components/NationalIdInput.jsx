import React, { useRef, useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;
const ID_LENGTH = 14;

async function checkNationalIdUnique(nationalId) {
  if (nationalId.length !== ID_LENGTH) return null;
  try {
    const res = await fetch(`${BASE_URL}/players.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    const exists = Object.values(data).some(
      (p) => p.nationalId === nationalId
    );
    return exists ? "هذا الرقم القومى مسجل من قبل" : null;
  } catch {
    return null;
  }
}

// onValidationChange(isValid: boolean) — بيبعت للـ parent الحالة الحقيقية
export default function NationalIdInput({ value, onChange, required, onValidationChange }) {
  const digits = Array.from({ length: ID_LENGTH }, (_, i) => value?.[i] || "");

  const inputRefs = useRef([]);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef(null);

  const fullId = digits.join("");
  const isComplete = fullId.length === ID_LENGTH && !digits.includes("");

  // ── كل ما تتغير الحالة → نبلغ الـ parent ──
  useEffect(() => {
    const isValid = isComplete && !checking && !error;
    onValidationChange?.(isValid);
  }, [isComplete, checking, error, onValidationChange]);

  // ── كل ما يكتمل الرقم → نعمل check ──
  useEffect(() => {
    if (!isComplete) {
      setError(null);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      onValidationChange?.(false); // أثناء الـ check → مش valid
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
    [value, onChange]
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
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const char = val[val.length - 1];
    updateDigit(index, char);
    if (index < ID_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e, startIndex) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, ID_LENGTH - startIndex);
    if (!pasted) return;

    const arr = Array.from({ length: ID_LENGTH }, (_, i) => value?.[i] || "");
    pasted.split("").forEach((ch, i) => {
      if (startIndex + i < ID_LENGTH) arr[startIndex + i] = ch;
    });
    onChange(arr.join(""));
    const nextFocus = Math.min(startIndex + pasted.length, ID_LENGTH - 1);
    setTimeout(() => inputRefs.current[nextFocus]?.focus(), 0);
  };

  return (
    <div dir="rtl">
      <label className="block mb-3 text-blue-700 font-semibold">
        الرقم القومى (بالإنجليزية)
        <span className="text-gray-400 text-xs font-normal me-2">(١٤ رقم)</span>
      </label>

      <div className="flex flex-wrap gap-1.5 justify-start items-center" dir="ltr">
        {Array.from({ length: ID_LENGTH }, (_, i) => {
          const isGroupStart = i === 1 || i === 7 || i === 10;
          return (
            <React.Fragment key={i}>
              {isGroupStart && (
                <span className="text-blue-300 font-bold text-lg select-none">-</span>
              )}
              <input
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
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
                    digits[i]
                      ? error && isComplete
                        ? "border-red-400 bg-red-50 text-red-700"
                        : isComplete && !checking && !error
                        ? "border-green-500 bg-green-50 text-green-700"
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

      <div className="mt-2 min-h-[1.5rem]">
        {checking && (
          <p className="text-blue-500 text-sm animate-pulse flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            جارٍ التحقق...
          </p>
        )}
        {!checking && error && isComplete && (
          <p role="alert" className="text-red-600 text-sm flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {!checking && !error && isComplete && (
          <p className="text-green-600 text-sm flex items-center gap-1">
            <span>✅</span> الرقم القومى صحيح ومتاح
          </p>
        )}
        {!isComplete && fullId.length > 0 && (
          <p className="text-gray-400 text-xs">
            {ID_LENGTH - fullId.length} خانة متبقية
          </p>
        )}
      </div>
    </div>
  );
}
