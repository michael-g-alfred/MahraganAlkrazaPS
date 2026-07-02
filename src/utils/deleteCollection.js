import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const BATCH_LIMIT = 400; // أقل من حد الـ 500 عملية لكل batch في Firestore

/**
 * يمسح كل مستندات (documents) الموجودة في collection معينة.
 * بيقسّم العملية على دفعات (batches) عشان يشتغل حتى لو العدد كبير.
 */
export default async function deleteCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const chunk = docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  return docs.length;
}
