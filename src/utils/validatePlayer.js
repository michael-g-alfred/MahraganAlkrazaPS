import stages from "../data/stages";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export function validateQuadName(name) {
  if (!name?.trim()) return null;
  const regex = /^[\u0600-\u06FF]+([ ][\u0600-\u06FF]+){3}$/;
  if (!regex.test(name.trim())) return "الإسم يجب أن يكون رباعياً";
  return null;
}

export function validateBirthdate(birthdate, stageName) {
  if (!birthdate || !stageName) return null;
  const stage = stages.find((s) => s.name === stageName);
  if (!stage) return null;
  const birthYear = new Date(birthdate).getFullYear();
  const { minYear, maxYear } = stage;
  if (minYear && maxYear) {
    if (birthYear < minYear || birthYear > maxYear)
      return `تاريخ الميلاد لا يتوافق مع ${stageName} — يجب أن تكون بين ${minYear} و ${maxYear}`;
  } else if (minYear && !maxYear) {
    if (birthYear < minYear)
      return `تاريخ الميلاد لا يتوافق مع ${stageName} — يجب أن تكون ${minYear} أو أحدث`;
  } else if (!minYear && maxYear) {
    if (birthYear > maxYear)
      return `تاريخ الميلاد لا يتوافق مع ${stageName} — يجب أن تكون ${maxYear} أو أقدم`;
  }
  return null;
}

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
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase();
}

export async function validateNameUnique(name, selectionData) {
  if (!name?.trim() || !selectionData?.stage?.name) return null;
  try {
    const snapshot = await getDocs(collection(db, "players"));
    const stageName = selectionData.stage?.name || "";
    const genderName = selectionData.gender?.name || "";
    const duplicate = snapshot.docs.find((doc) => {
      const p = doc.data();
      return (
        normalizeName(p.name) === normalizeName(name) &&
        p.stage === stageName &&
        p.gender === genderName
      );
    });
    if (duplicate)
      return `الاسم "${name}" مسجل بالفعل في ${stageName} - ${genderName}`;
    return null;
  } catch {
    return null;
  }
}
