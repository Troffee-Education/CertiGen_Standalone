import { getAdminDb } from '@/lib/firebase/admin';
import type { CertificateType } from '@/lib/services/certigen.service';

const EVENTS_COLLECTION = 'certigen_events';
const MAGIC_LINKS_COLLECTION = 'certigen_magic_links';
const SUBMISSIONS_COLLECTION = 'certigen_submissions';

export type AdminEventModel = {
  id: string;
  adminId: string;
  title: string;
  slug: string;
  templateUrl: string;
  templateConfig: any;
  certificateType?: CertificateType;
  isArchived: boolean;
  createdAt: any;
  updatedAt: any;
};

export type AdminMagicLinkModel = {
  id: string;
  eventId: string;
  token: string;
  teacherEmail: string;
  expiresAt: number;
  emailSent: boolean;
  isRevoked: boolean;
  type?: 'bulk_csv_upload' | 'self_serve_claim' | 'teacher_bulk';
  isOneTimeUse?: boolean;
  isUsed?: boolean;
  prefillData?: Record<string, string>;
  createdAt: any;
};

export type AdminSubmissionModel = {
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

export class CertiGenAdminService {
  static async getEventById(eventId: string): Promise<AdminEventModel | null> {
    const db = await getAdminDb();
    const docSnap = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as AdminEventModel;
  }

  static async createMagicLink(data: Partial<AdminMagicLinkModel>): Promise<AdminMagicLinkModel> {
    const db = await getAdminDb();
    const docRef = db.collection(MAGIC_LINKS_COLLECTION).doc();
    const linkData = {
      emailSent: false,
      isRevoked: false,
      isUsed: false,
      isOneTimeUse: false,
      ...data,
      id: docRef.id,
      createdAt: new Date(),
    };
    await docRef.set(linkData);
    return linkData as AdminMagicLinkModel;
  }

  static async getMagicLinkByToken(token: string): Promise<AdminMagicLinkModel | null> {
    const db = await getAdminDb();
    const snap = await db
      .collection(MAGIC_LINKS_COLLECTION)
      .where('token', '==', token)
      .where('isRevoked', '==', false)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as AdminMagicLinkModel;
  }

  static async getMagicLinksByEvent(eventId: string): Promise<AdminMagicLinkModel[]> {
    const db = await getAdminDb();
    const snap = await db.collection(MAGIC_LINKS_COLLECTION).where('eventId', '==', eventId).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminMagicLinkModel));
  }

  static async updateMagicLink(linkId: string, data: Partial<AdminMagicLinkModel>) {
    const db = await getAdminDb();
    await db.collection(MAGIC_LINKS_COLLECTION).doc(linkId).update(data);
  }

  static async revokeMagicLink(linkId: string) {
    const db = await getAdminDb();
    await db.collection(MAGIC_LINKS_COLLECTION).doc(linkId).update({ isRevoked: true });
  }

  static async getSubmissionsByEvent(eventId: string): Promise<AdminSubmissionModel[]> {
    const db = await getAdminDb();
    const snap = await db.collection(SUBMISSIONS_COLLECTION).where('eventId', '==', eventId).get();
    const allDocs = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AdminSubmissionModel & { isChunk?: boolean; parentSubmissionId?: string }
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
