import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

const stripUndefined = (value) => JSON.parse(JSON.stringify(value ?? null));

export async function getCollection(name, tenantId) {
  if (!isFirebaseConfigured || !db) return [];
  const ref = collection(db, name);
  const snapshot = tenantId
    ? await getDocs(query(ref, where("tenantId", "==", tenantId)))
    : await getDocs(ref);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function saveDocument(name, data) {
  if (!isFirebaseConfigured || !db || !data?.id) return;
  await setDoc(doc(db, name, String(data.id)), stripUndefined(data), { merge: true });
}

export async function patchDocument(name, id, patch) {
  if (!isFirebaseConfigured || !db || !id) return;
  await updateDoc(doc(db, name, String(id)), stripUndefined(patch));
}

export async function removeDocument(name, id) {
  if (!isFirebaseConfigured || !db || !id) return;
  await deleteDoc(doc(db, name, String(id)));
}

export async function seedCollection(name, records = []) {
  if (!isFirebaseConfigured || !db || !records.length) return;
  const batch = writeBatch(db);
  records.forEach((record) => {
    if (record?.id) batch.set(doc(db, name, String(record.id)), stripUndefined(record), { merge: true });
  });
  await batch.commit();
}
