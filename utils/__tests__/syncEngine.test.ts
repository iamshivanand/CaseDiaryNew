import { syncCaseDocuments } from "../syncEngine";
import * as FileSystem from "expo-file-system";
import { getDocs } from "firebase/firestore";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { getDb } from "../../DataBase/connection";

// Mock Firebase config
jest.mock("../firebaseConfig", () => ({
  db: {},
  storage: {},
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "mock-dir/",
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, uri: "mock-uri" })),
}));

// Mock Firebase Firestore/Storage
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve("https://firebase.mock/file.pdf")),
}));

// Mock database connection
const mockRunAsync = jest.fn(() => Promise.resolve());
const mockGetAllAsync = jest.fn();

jest.mock("../../DataBase/connection", () => ({
  getDb: jest.fn(() => Promise.resolve({
    getAllAsync: mockGetAllAsync,
    runAsync: mockRunAsync,
  })),
}));

describe("syncEngine - Selective Document Upload Sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve({ size: 1024, type: "application/pdf" }),
      })
    ) as any;
  });

  it("should immediately return and do nothing under Free tier", async () => {
    await syncCaseDocuments("uid-123", 1, "free");
    expect(mockGetAllAsync).not.toHaveBeenCalled();
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it("should enforce the Basic Premium tier limit of 12 documents", async () => {
    // Generate 15 local offline documents
    const mockLocalDocs = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      case_id: 1,
      stored_filename: `file_${i + 1}.pdf`,
      original_display_name: `Document ${i + 1}`,
      file_type: "pdf",
      file_size: 1024,
      created_at: new Date().toISOString(),
      sync_status: "local_only",
      remote_url: null,
    }));

    mockGetAllAsync.mockResolvedValueOnce(mockLocalDocs);
    // Mock Firestore showing 0 files synced initially
    (getDocs as jest.Mock).mockResolvedValueOnce({ size: 0 });

    await syncCaseDocuments("uid-123", 1, "basic");

    // Expect only the first 12 files to be uploaded to storage
    expect(uploadBytes).toHaveBeenCalledTimes(12);
    expect(getDownloadURL).toHaveBeenCalledTimes(12);

    // Expect the remaining 3 files (id 13, 14, 15) to be marked as local_only
    expect(mockRunAsync).toHaveBeenCalledWith(
      "UPDATE CaseDocuments SET sync_status = 'local_only' WHERE id = ?",
      [13]
    );
    expect(mockRunAsync).toHaveBeenCalledWith(
      "UPDATE CaseDocuments SET sync_status = 'local_only' WHERE id = ?",
      [14]
    );
    expect(mockRunAsync).toHaveBeenCalledWith(
      "UPDATE CaseDocuments SET sync_status = 'local_only' WHERE id = ?",
      [15]
    );
  });

  it("should support up to 100 documents under the Ultra Premium tier", async () => {
    const mockLocalDocs = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      case_id: 1,
      stored_filename: `file_${i + 1}.pdf`,
      original_display_name: `Document ${i + 1}`,
      file_type: "pdf",
      file_size: 1024,
      created_at: new Date().toISOString(),
      sync_status: "local_only",
      remote_url: null,
    }));

    mockGetAllAsync.mockResolvedValueOnce(mockLocalDocs);
    (getDocs as jest.Mock).mockResolvedValueOnce({ size: 0 });

    await syncCaseDocuments("uid-123", 1, "ultra");

    // All 50 should upload because 50 is less than the 100 limit
    expect(uploadBytes).toHaveBeenCalledTimes(50);
    expect(mockRunAsync).not.toHaveBeenCalledWith(
      "UPDATE CaseDocuments SET sync_status = 'local_only' WHERE id = ?",
      expect.any(Array)
    );
  });
});
