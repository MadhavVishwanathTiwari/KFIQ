// Types for the intern dashboard. These intentionally mirror the eventual
// task/application/certificate schema so swapping the mock data layer for real
// API calls later is mechanical.

export type ApplicationStatus = "not_applied" | "pending" | "approved" | "rejected";

export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected";

export type Task = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  sequenceOrder: number;
};

export type TaskSubgroup = {
  id: string;
  title: string;
  description: string;
  sequenceOrder: number;
  /** Marks a subgroup that runs in parallel with the previous one. */
  canRunConcurrent: boolean;
  tasks: Task[];
};

export type TaskGroup = {
  id: string;
  title: string;
  description: string;
  field: string;
  requiredSkills: string[];
  certificateOnComplete: boolean;
  subgroups: TaskSubgroup[];
  /** Tasks attached directly to the group (no subgroup). */
  directTasks: Task[];
};

export type Application = {
  taskGroupId: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  rejectionReason?: string | null;
};

export type Feedback = {
  id: string;
  author: string;
  authorRole: "admin" | "task_overseer";
  message: string;
  createdAt: string;
};

export type AssignedTask = {
  /** assignment id */
  id: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  requiredSkills: string[];
  sequenceOrder: number;
  taskGroupId: string;
  taskGroupTitle: string;
  subgroupId: string | null;
  subgroupTitle: string | null;
  status: AssignmentStatus;
  feedback: Feedback[];
  submission?: { notes: string; submittedAt: string } | null;
};

export type Certificate = {
  id: string;
  taskGroupId: string;
  taskGroupTitle: string;
  issuedAt: string;
  verifyUuid: string;
};

export type DashboardIntern = {
  fullName: string;
  cohort: string;
  fieldOfInterest: string;
  skills: string[];
};

export type DashboardData = {
  intern: DashboardIntern;
  taskGroups: TaskGroup[];
  applications: Application[];
  assignedTasks: AssignedTask[];
  certificates: Certificate[];
};

/** Total task count across a group's direct tasks and all subgroup tasks. */
export function countTasks(group: TaskGroup): number {
  return (
    group.directTasks.length +
    group.subgroups.reduce((sum, sg) => sum + sg.tasks.length, 0)
  );
}
