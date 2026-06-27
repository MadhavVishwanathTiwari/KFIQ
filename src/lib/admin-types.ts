// Types for the admin UI, mirroring the JSON returned by the /api/admin routes.
import type {
  ApplicationStatus,
  SubmissionReviewStatus,
  TaskAssignmentStatus,
} from "@/lib/db/schema";

export type AdminSkill = { id: string; name: string; category: string | null };

export type AdminCohort = { id: string; name: string; isActive: boolean };

export type TaskGroupListItem = {
  id: string;
  title: string;
  description: string | null;
  field: string;
  isOpen: boolean;
  createdAt: string;
  taskCount: number;
};

export type AdminTask = {
  id: string;
  taskGroupId: string | null;
  taskSubgroupId: string | null;
  title: string;
  description: string | null;
  sequenceOrder: number;
  canRunConcurrent: boolean;
  requiredSkills: string[] | null;
};

export type AdminSubgroup = {
  id: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  canRunConcurrent: boolean;
  tasks: AdminTask[];
};

export type TaskGroupDetail = {
  group: {
    id: string;
    title: string;
    description: string | null;
    field: string;
    isOpen: boolean;
  };
  skills: { id: string; name: string }[];
  subgroups: AdminSubgroup[];
  directTasks: AdminTask[];
};

export type AdminApplication = {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  rejectionNote: string | null;
  internId: string;
  internName: string;
  internCollege: string;
  taskGroupId: string;
  taskGroupTitle: string;
  taskGroupField: string;
};

export type AssignableTask = {
  id: string;
  title: string;
  taskSubgroupId: string | null;
  sequenceOrder: number;
};

export type AdminSubmission = {
  id: string;
  notes: string | null;
  attachmentUrls: string[] | null;
  submittedAt: string;
  reviewStatus: SubmissionReviewStatus;
  assignmentId: string;
  internId: string;
  internName: string;
  taskId: string;
  taskTitle: string;
  taskGroupId: string;
  taskGroupTitle: string;
};

export type AdminCertificate = {
  id: string;
  issuedAt: string;
  verifyToken: string;
  internName: string;
  taskGroupTitle: string;
};

export type { ApplicationStatus, SubmissionReviewStatus, TaskAssignmentStatus };
