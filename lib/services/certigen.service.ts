import { db, storage } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';

const EVENTS_COLLECTION = 'certigen_events';
const MAGIC_LINKS_COLLECTION = 'certigen_magic_links';
const SUBMISSIONS_COLLECTION = 'certigen_submissions';

export type CertificateType = "student" | "teacher";

export const CERT_TYPE_LABELS: Record<CertificateType, string> = {
  student: "Student Certificates",
  teacher: "Teacher Certificates",
};

export function isTeacherEvent(event: Pick<EventModel, "certificateType"> | null | undefined): boolean {
  return event?.certificateType === "teacher";
}

export type EventModel = {
  id: string;
  adminId: string;
  title: string;
  slug: string;
  templateUrl: string;
  templateConfig: any; // JSON array of field configs
  certificateType?: CertificateType;
  isArchived: boolean;
  createdAt: any;
  updatedAt: any;
};

export type MagicLinkModel = {
  id: string;
  eventId: string;
  token: string;
  teacherEmail: string;
  expiresAt: number; // timestamp ms
  emailSent: boolean;
  isRevoked: boolean;
  type?: 'bulk_csv_upload' | 'self_serve_claim' | 'teacher_bulk';
  isOneTimeUse?: boolean;
  isUsed?: boolean;
  prefillData?: Record<string, string>;
  createdAt: any;
};

export type SubmissionModel = {
  id: string;
  eventId: string;
  magicLinkId?: string;
  adminId?: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone?: string;
  teacherState?: string;
  schoolName?: string;
  subject?: string;
  category?: string;
  customFields?: Record<string, any>;
  studentData: any[];
  certificateCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  zipUrl?: string;
  errorLogs?: string;
  hasDownloaded: boolean;
  isChunk?: boolean;
  parentSubmissionId?: string;
  createdAt: any;
  updatedAt: any;
};

export class CertiGenService {
  // --- Events ---
  static async createEvent(data: Partial<EventModel>): Promise<EventModel> {
    const newDocRef = doc(collection(db, EVENTS_COLLECTION));
    const eventData = {
      isArchived: false,
      templateUrl: "",
      templateConfig: [],
      ...data,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(newDocRef, eventData);
    return eventData as EventModel;
  }

  static async getEvent(eventId: string): Promise<EventModel | null> {
    return this.getEventById(eventId);
  }

  static async getEventById(eventId: string): Promise<EventModel | null> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as EventModel;
    }
    return null;
  }

  static async getEventsByAdmin(adminId: string): Promise<EventModel[]> {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('adminId', '==', adminId),
      where('isArchived', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EventModel));
  }

  static async getAllEvents(): Promise<EventModel[]> {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('isArchived', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EventModel));
  }

  static async updateEvent(eventId: string, data: Partial<EventModel>) {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  }

  // --- Storage ---
  static async uploadTemplateImage(eventId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const storageRef = ref(storage, `certigen/templates/${eventId}-${Date.now()}.${ext}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  static async uploadSubmissionZip(eventId: string, submissionId: string, blob: Blob): Promise<string> {
    const storageRef = ref(storage, `certigen/submissions/${eventId}/${submissionId}.zip`);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  }

  // --- Magic Links ---
  static async createMagicLink(data: Partial<MagicLinkModel>): Promise<MagicLinkModel> {
    const newDocRef = doc(collection(db, MAGIC_LINKS_COLLECTION));
    const linkData = {
      emailSent: false,
      isRevoked: false,
      isUsed: false,
      isOneTimeUse: false,
      ...data,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(newDocRef, linkData);
    return linkData as MagicLinkModel;
  }

  static async createMagicLinksBulk(links: Partial<MagicLinkModel>[]): Promise<MagicLinkModel[]> {
    const createdLinks: MagicLinkModel[] = [];
    for (const linkData of links) {
      const created = await this.createMagicLink(linkData);
      createdLinks.push(created);
    }
    return createdLinks;
  }

  static async getMagicLinkByToken(token: string): Promise<MagicLinkModel | null> {
    const q = query(collection(db, MAGIC_LINKS_COLLECTION), where('token', '==', token), where('isRevoked', '==', false));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as MagicLinkModel;
    }
    return null;
  }

  static async updateMagicLink(linkId: string, data: Partial<MagicLinkModel>) {
    const docRef = doc(db, MAGIC_LINKS_COLLECTION, linkId);
    await updateDoc(docRef, data);
  }

  static async revokeMagicLink(linkId: string) {
    const docRef = doc(db, MAGIC_LINKS_COLLECTION, linkId);
    await updateDoc(docRef, { isRevoked: true });
  }

  static async getMagicLinksByEvent(eventId: string): Promise<MagicLinkModel[]> {
    const q = query(collection(db, MAGIC_LINKS_COLLECTION), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MagicLinkModel));
  }

  // --- Submissions ---
  static async createSubmission(data: Partial<SubmissionModel>) {
    const newDocRef = doc(collection(db, SUBMISSIONS_COLLECTION));
    const mainId = newDocRef.id;
    const rawStudentData = Array.isArray(data.studentData) ? data.studentData : [];

    // Sanitize student rows to remove heavy unneeded URL bloat (e.g. Merged Doc URLs, drive links)
    const cleanedStudentData = rawStudentData.map((row) => {
      if (typeof row !== "object" || row === null) return row;
      const cleanRow: Record<string, any> = {};
      Object.keys(row).forEach((k) => {
        const lKey = k.toLowerCase();
        // Omit huge raw doc merge URLs and drive links that cause 11MB document bloat
        if (
          lKey.includes("merged doc") ||
          lKey.includes("pautan google drive") ||
          lKey.includes("document merge status")
        ) {
          return;
        }
        cleanRow[k] = row[k];
      });
      return cleanRow;
    });

    // Safe chunk size of 15 rows per document (~7KB per doc write, far below Firestore's 1MB limit)
    const CHUNK_SIZE = 15;
    const firstChunk = cleanedStudentData.slice(0, CHUNK_SIZE);
    const remainingChunks: any[][] = [];

    for (let i = CHUNK_SIZE; i < cleanedStudentData.length; i += CHUNK_SIZE) {
      remainingChunks.push(cleanedStudentData.slice(i, i + CHUNK_SIZE));
    }

    const subData: Record<string, any> = {
      ...data,
      id: mainId,
      studentData: firstChunk,
      certificateCount: data.certificateCount || rawStudentData.length,
      status: data.status || "PENDING",
      hasDownloaded: data.hasDownloaded ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    Object.keys(subData).forEach((key) => {
      if (subData[key] === undefined) delete subData[key];
    });

    // Use atomic write batches to prevent stream exhaustion
    let currentBatch = writeBatch(db);
    let batchCount = 0;

    currentBatch.set(newDocRef, subData);
    batchCount++;

    for (let cIdx = 0; cIdx < remainingChunks.length; cIdx++) {
      const chunkDocRef = doc(collection(db, SUBMISSIONS_COLLECTION));
      const chunkData: Record<string, any> = {
        id: chunkDocRef.id,
        eventId: data.eventId,
        teacherEmail: data.teacherEmail || "",
        teacherName: data.teacherName || "",
        studentData: remainingChunks[cIdx],
        isChunk: true,
        parentSubmissionId: mainId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      Object.keys(chunkData).forEach((key) => {
        if (chunkData[key] === undefined) delete chunkData[key];
      });

      currentBatch.set(chunkDocRef, chunkData);
      batchCount++;

      // Commit every 200 operations to stay well within Firestore limits
      if (batchCount >= 200) {
        await currentBatch.commit();
        await new Promise((r) => setTimeout(r, 20));
        currentBatch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await currentBatch.commit();
    }

    return subData;
  }

  static async updateSubmission(submissionId: string, data: Partial<SubmissionModel>) {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  }

  static async getSubmissionsByEvent(eventId: string): Promise<SubmissionModel[]> {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    const allDocs = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as SubmissionModel & { isChunk?: boolean; parentSubmissionId?: string })
    );

    const chunksByParent = new Map<string, any[]>();
    allDocs.forEach((doc) => {
      if (doc.isChunk && doc.parentSubmissionId) {
        if (!chunksByParent.has(doc.parentSubmissionId)) {
          chunksByParent.set(doc.parentSubmissionId, []);
        }
        chunksByParent.get(doc.parentSubmissionId)!.push(...(doc.studentData || []));
      }
    });

    const parentSubmissions = allDocs.filter((doc) => !doc.isChunk);
    parentSubmissions.forEach((parent) => {
      if (chunksByParent.has(parent.id)) {
        parent.studentData = [...(parent.studentData || []), ...chunksByParent.get(parent.id)!];
      }
    });

    return parentSubmissions;
  }
}
