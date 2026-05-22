import stages from "../data/stages";

const BASE_URL = import.meta.env.VITE_FIREBASE_URL;

/**
 * التحقق من أن الاسم رباعي (٤ كلمات عربية)
 */
export function validateQuadName(name) {
  if (!name?.trim()) return null;
  const regex = /^[\u0600-\u06FF]+([ ][\u0600-\u06FF]+){3}$/;
  if (!regex.test(name.trim())) {
    return "الإسم يجب أن يكون رباعياً";
  }
  return null;
}

/**
 * التحقق من تاريخ الميلاد مع المرحلة
 */
export function validateBirthdate(birthdate, stageName) {
  if (!birthdate || !stageName) return null;

  const stage = stages.find((s) => s.name === stageName);
  if (!stage) return null;

  const birthYear = new Date(birthdate).getFullYear();
  const { minYear, maxYear } = stage;

  if (minYear && maxYear) {
    if (birthYear < minYear || birthYear > maxYear) {
      return `تاريخ الميلاد لا يتوافق مع ${stageName} — سنة الميلاد يجب أن تكون بين ${minYear} و ${maxYear}`;
    }
  } else if (minYear && !maxYear) {
    if (birthYear < minYear) {
      return `تاريخ الميلاد لا يتوافق مع ${stageName} — سنة الميلاد يجب أن تكون ${minYear} أو أحدث`;
    }
  } else if (!minYear && maxYear) {
    if (birthYear > maxYear) {
      return `تاريخ الميلاد لا يتوافق مع ${stageName} — سنة الميلاد يجب أن تكون ${maxYear} أو أقدم`;
    }
  }

  return null;
}

/**
 * توحيد الأحرف العربية المتشابهة لمقارنة الأسماء
 */
function normalizeName(str) {
  if (!str) return "";
  return str
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/چ/g, "ج")
    .replace(/[ڤڥ]/g, "ف")
    .replace(/پ/g, "ب")
    .replace(/[گڭ]/g, "ك")
    .replace(/ژ/g, "ز")
    .replace(/ڈ/g, "د")
    .replace(/ڑ/g, "ر")
    .replace(/ں/g, "ن")
    .replace(/ھ/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase();
}

/**
 * التحقق من تكرار الاسم في نفس المرحلة والنوع بغض النظر عن اللعبة
 * — لمنع تسجيل نفس اللاعب في أكثر من لعبة
 */
export async function validateNameUnique(name, selectionData) {
  if (!name?.trim() || !selectionData?.stage?.name) return null;

  try {
    const res = await fetch(`${BASE_URL}/players.json`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data) return null;

    const players = Object.values(data);
    const stageName = selectionData.stage?.name || "";
    const genderName = selectionData.gender?.name || "";

    const duplicate = players.find(
      (p) =>
        normalizeName(p.name) === normalizeName(name) &&
        p.stage === stageName &&
        p.gender === genderName,
    );

    if (duplicate) {
      return `الاسم "${name}" مسجل بالفعل في ${stageName} - ${genderName} (لا يمكن التسجيل في أكثر من لعبة)`;
    }

    return null;
  } catch {
    return null;
  }
}
