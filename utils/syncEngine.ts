import * as FileSystem from "expo-file-system";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db as firestore, storage } from "./firebaseConfig";
import { getDb } from "../DataBase/connection";
import { CaseDocument } from "../DataBase/schema";

const DOCUMENTS_DIRECTORY = FileSystem.documentDirectory + "documents/";

// Retrieve the synced documents count for a specific case in Firestore
const getSyncedDocumentsCount = async (uid: string, caseId: number): Promise<number> => {
  try {
    const q = query(
      collection(firestore, `users/${uid}/cases/${caseId}/documents`),
      where("sync_status", "==", "synced")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (e) {
    console.error("Failed to fetch synced documents count from Firestore:", e);
    return 0;
  }
};

// Sync case data to Firestore
export const syncCaseToCloud = async (uid: string, caseData: any): Promise<boolean> => {
  try {
    const caseRef = doc(firestore, `users/${uid}/cases`, caseData.id.toString());
    await setDoc(caseRef, {
      ...caseData,
      synced_at: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("Failed to sync case to Firestore:", e);
    return false;
  }
};

// Enforces document sync limits and syncs local attachments
export const syncCaseDocuments = async (uid: string, caseId: number, userTier: "free" | "basic" | "ultra"): Promise<void> => {
  if (userTier === "free") {
    console.log("Free tier does not support document cloud sync.");
    return;
  }

  const limit = userTier === "basic" ? 12 : 100;
  const db = await getDb();

  try {
    // 1. Fetch all documents for this case from local SQLite
    const localDocs = await db.getAllAsync<CaseDocument>(
      "SELECT * FROM CaseDocuments WHERE case_id = ? ORDER BY created_at ASC",
      [caseId]
    );

    // 2. Fetch already synced count in Firestore
    let syncedCount = await getSyncedDocumentsCount(uid, caseId);

    // 3. Sync each unsynced document
    for (const docItem of localDocs) {
      if (docItem.sync_status === "synced") {
        continue; // Already synced
      }

      if (syncedCount >= limit) {
        // Enforce the sync limits (additional files remain local-only)
        await db.runAsync(
          "UPDATE CaseDocuments SET sync_status = 'local_only' WHERE id = ?",
          [docItem.id]
        );
        console.log(`Document ${docItem.original_display_name} exceeds tier limit of ${limit} for case ${caseId}. Left as local-only.`);
        continue;
      }

      // 4. Perform the upload to Firebase Storage
      const localFilePath = DOCUMENTS_DIRECTORY + docItem.stored_filename;
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);

      if (!fileInfo.exists) {
        console.warn(`Local file not found for document: ${docItem.original_display_name}`);
        continue;
      }

      // Convert local file URI to Blob for Firebase Storage
      const response = await fetch(fileInfo.uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `users/${uid}/cases/${caseId}/${docItem.stored_filename}`);
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);

      // 5. Save to Firestore
      const docRef = doc(firestore, `users/${uid}/cases/${caseId}/documents`, docItem.id.toString());
      await setDoc(docRef, {
        id: docItem.id,
        case_id: caseId,
        stored_filename: docItem.stored_filename,
        original_display_name: docItem.original_display_name,
        file_type: docItem.file_type,
        file_size: docItem.file_size,
        created_at: docItem.created_at,
        sync_status: "synced",
        remote_url: downloadUrl,
      });

      // 6. Update local SQLite DB status
      await db.runAsync(
        "UPDATE CaseDocuments SET sync_status = 'synced', remote_url = ? WHERE id = ?",
        [downloadUrl, docItem.id]
      );

      syncedCount += 1;
      console.log(`Synced document: ${docItem.original_display_name} to Firestore.`);
    }
  } catch (error) {
    console.error(`Failed to sync case documents for case: ${caseId}`, error);
  }
};
