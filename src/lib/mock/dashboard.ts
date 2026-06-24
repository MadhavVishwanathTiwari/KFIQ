// Mock dashboard dataset. All reads go through getDashboardData() so swapping
// this file for real `fetch()` calls later is a drop-in change. Nothing here
// persists — Apply/Submit interactions are handled optimistically in the UI.

import type {
  Application,
  AssignedTask,
  Certificate,
  DashboardData,
  DashboardIntern,
  TaskGroup,
} from "@/lib/dashboard-types";

const intern: DashboardIntern = {
  fullName: "Aanya Sharma",
  cohort: "Summer 2025",
  fieldOfInterest: "Web Development",
  skills: ["React", "TypeScript", "Figma", "Node.js"],
};

const taskGroups: TaskGroup[] = [
  {
    id: "tg-web",
    title: "Build the KFIQ Landing Site",
    description:
      "Ship a production landing site end-to-end: design, build, and wire it to a database. A full-stack group with a frontend and a backend track.",
    field: "Web Development",
    requiredSkills: ["React", "TypeScript", "Figma", "Node.js"],
    certificateOnComplete: true,
    directTasks: [
      {
        id: "t-web-kickoff",
        title: "Project kickoff & repo setup",
        description:
          "Set up the repository, CI, and a shared component library scaffold before the tracks begin.",
        requiredSkills: ["Git"],
        sequenceOrder: 1,
      },
    ],
    subgroups: [
      {
        id: "sg-web-frontend",
        title: "Frontend",
        description: "Design and build the responsive marketing front end.",
        sequenceOrder: 2,
        canRunConcurrent: false,
        tasks: [
          {
            id: "t-fe-figma",
            title: "Design the landing page in Figma",
            description:
              "Produce a desktop + mobile design for the hero, features, and footer sections.",
            requiredSkills: ["Figma"],
            sequenceOrder: 1,
          },
          {
            id: "t-fe-code",
            title: "Code the landing page",
            description:
              "Implement the approved Figma design as React components with Tailwind.",
            requiredSkills: ["React", "TypeScript"],
            sequenceOrder: 2,
          },
          {
            id: "t-fe-responsive",
            title: "Make it responsive",
            description:
              "Ensure the page is pixel-clean from 320px to large desktop breakpoints.",
            requiredSkills: ["CSS"],
            sequenceOrder: 3,
          },
        ],
      },
      {
        id: "sg-web-backend",
        title: "Backend",
        description: "Stand up the database and connect the contact form.",
        sequenceOrder: 2,
        canRunConcurrent: true,
        tasks: [
          {
            id: "t-be-db",
            title: "Create the database schema",
            description:
              "Model the leads table and run the initial migration.",
            requiredSkills: ["PostgreSQL"],
            sequenceOrder: 1,
          },
          {
            id: "t-be-connect",
            title: "Connect the form to the database",
            description:
              "Wire the contact form to an API route that persists submissions.",
            requiredSkills: ["Node.js"],
            sequenceOrder: 2,
          },
        ],
      },
    ],
  },
  {
    id: "tg-data",
    title: "Customer Churn Analysis",
    description:
      "Analyse a sample customer dataset and present findings on churn drivers with a short written summary.",
    field: "Data Science",
    requiredSkills: ["Python", "Pandas", "Data Visualization"],
    certificateOnComplete: true,
    directTasks: [
      {
        id: "t-data-clean",
        title: "Clean and explore the dataset",
        description: "Handle missing values and produce summary statistics.",
        requiredSkills: ["Python", "Pandas"],
        sequenceOrder: 1,
      },
      {
        id: "t-data-viz",
        title: "Visualize churn drivers",
        description: "Build 3–4 charts that surface the strongest churn signals.",
        requiredSkills: ["Data Visualization"],
        sequenceOrder: 2,
      },
    ],
    subgroups: [],
  },
  {
    id: "tg-design",
    title: "Mobile App UI Kit",
    description:
      "Design a reusable UI kit for a fictional fitness app, including components and a sample screen flow.",
    field: "Product Design",
    requiredSkills: ["Figma", "UI Design"],
    certificateOnComplete: true,
    directTasks: [
      {
        id: "t-design-components",
        title: "Build the core component set",
        description: "Buttons, inputs, cards, and navigation as Figma components.",
        requiredSkills: ["Figma"],
        sequenceOrder: 1,
      },
    ],
    subgroups: [],
  },
  {
    id: "tg-content",
    title: "Technical Blog Series",
    description:
      "Write a 3-part beginner-friendly blog series explaining a technical concept of your choice.",
    field: "Content",
    requiredSkills: ["Writing"],
    certificateOnComplete: false,
    directTasks: [
      {
        id: "t-content-outline",
        title: "Outline the series",
        description: "Define the three posts and their key takeaways.",
        requiredSkills: ["Writing"],
        sequenceOrder: 1,
      },
    ],
    subgroups: [],
  },
];

// The current intern's application state per group.
const applications: Application[] = [
  { taskGroupId: "tg-web", status: "approved", appliedAt: "2025-06-02T10:00:00Z" },
  { taskGroupId: "tg-data", status: "pending", appliedAt: "2025-06-18T09:30:00Z" },
  {
    taskGroupId: "tg-design",
    status: "rejected",
    appliedAt: "2025-05-28T14:00:00Z",
    rejectionReason:
      "We'd like to see a Figma sample first — add one to your profile and re-apply.",
  },
  { taskGroupId: "tg-content", status: "not_applied", appliedAt: null },
];

// Tasks the intern was assigned when approved into the Web Development group.
const assignedTasks: AssignedTask[] = [
  {
    id: "a-1",
    taskId: "t-web-kickoff",
    taskTitle: "Project kickoff & repo setup",
    taskDescription:
      "Set up the repository, CI, and a shared component library scaffold before the tracks begin.",
    requiredSkills: ["Git"],
    sequenceOrder: 1,
    taskGroupId: "tg-web",
    taskGroupTitle: "Build the KFIQ Landing Site",
    subgroupId: null,
    subgroupTitle: null,
    status: "approved",
    feedback: [
      {
        id: "f-1",
        author: "Rohan (Admin)",
        authorRole: "admin",
        message: "Clean setup. CI is green — nice work.",
        createdAt: "2025-06-05T12:00:00Z",
      },
    ],
    submission: {
      notes: "Repo + CI configured, component scaffold pushed.",
      submittedAt: "2025-06-04T18:00:00Z",
    },
  },
  {
    id: "a-2",
    taskId: "t-fe-figma",
    taskTitle: "Design the landing page in Figma",
    taskDescription:
      "Produce a desktop + mobile design for the hero, features, and footer sections.",
    requiredSkills: ["Figma"],
    sequenceOrder: 1,
    taskGroupId: "tg-web",
    taskGroupTitle: "Build the KFIQ Landing Site",
    subgroupId: "sg-web-frontend",
    subgroupTitle: "Frontend",
    status: "submitted",
    feedback: [],
    submission: {
      notes: "Figma link shared in the brief. Awaiting review.",
      submittedAt: "2025-06-20T16:00:00Z",
    },
  },
  {
    id: "a-3",
    taskId: "t-fe-code",
    taskTitle: "Code the landing page",
    taskDescription:
      "Implement the approved Figma design as React components with Tailwind.",
    requiredSkills: ["React", "TypeScript"],
    sequenceOrder: 2,
    taskGroupId: "tg-web",
    taskGroupTitle: "Build the KFIQ Landing Site",
    subgroupId: "sg-web-frontend",
    subgroupTitle: "Frontend",
    status: "not_started",
    feedback: [],
    submission: null,
  },
  {
    id: "a-4",
    taskId: "t-be-db",
    taskTitle: "Create the database schema",
    taskDescription: "Model the leads table and run the initial migration.",
    requiredSkills: ["PostgreSQL"],
    sequenceOrder: 1,
    taskGroupId: "tg-web",
    taskGroupTitle: "Build the KFIQ Landing Site",
    subgroupId: "sg-web-backend",
    subgroupTitle: "Backend",
    status: "in_progress",
    feedback: [
      {
        id: "f-2",
        author: "Meera (Task Overseer)",
        authorRole: "task_overseer",
        message: "Remember to add an index on created_at for the leads table.",
        createdAt: "2025-06-21T11:00:00Z",
      },
    ],
    submission: null,
  },
];

const certificates: Certificate[] = [
  {
    id: "c-1",
    taskGroupId: "tg-onboarding-basics",
    taskGroupTitle: "Developer Onboarding Basics",
    issuedAt: "2025-05-30T09:00:00Z",
    verifyUuid: "0f3c2b9a-7e51-4a6d-9b2e-1c8f4a7d2e10",
  },
];

const data: DashboardData = {
  intern,
  taskGroups,
  applications,
  assignedTasks,
  certificates,
};

export function getDashboardData(): DashboardData {
  return data;
}
