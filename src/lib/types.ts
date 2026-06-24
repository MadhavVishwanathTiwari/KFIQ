export type ResumeParseStatus =
  | "not_uploaded"
  | "pending"
  | "processing"
  | "done"
  | "failed";

export type OnboardingState = {
  id: string;
  fullName: string;
  college: string;
  courseType: string;
  fieldOfInterest: string;
  goal: string;
  resumeParseStatus: ResumeParseStatus;
  resumeUrl: string | null;
  resumeParsedAt?: string | null;
  hasPassword: boolean;
  onboardingCompletedAt?: string | null;
};

export type ProfileSkill = {
  id: string;
  source: "resume" | "manual";
  skillId: string;
  name: string;
  category: string | null;
};

export type ProfileCertification = {
  id: string;
  name: string;
  issuingOrg: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
  source: "resume" | "manual";
};

export type ProfileEducation = {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  grade: string | null;
  source: "resume" | "manual";
};

export type ProfileInternship = {
  id: string;
  company: string;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  source: "resume" | "manual";
};

export type ProfileProject = {
  id: string;
  title: string;
  description: string | null;
  techStack: string[] | null;
  projectUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  source: "resume" | "manual";
};

export type ProfileData = {
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  education: ProfileEducation[];
  pastInternships: ProfileInternship[];
  projects: ProfileProject[];
};
