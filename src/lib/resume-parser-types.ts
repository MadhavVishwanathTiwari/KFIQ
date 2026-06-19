export type ParsedResumeSkill = {
  name: string;
};

export type ParsedResumeEducation = {
  organization: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  grade?: string | null;
};

export type ParsedResumeWorkExperience = {
  organization: string;
  jobTitle?: string | null;
  jobDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type ParsedResumeProject = {
  title: string;
  description?: string | null;
  techStack?: string[] | null;
  projectUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type ParsedResumeData = {
  skills: ParsedResumeSkill[];
  certifications: string[];
  education: ParsedResumeEducation[];
  workExperience: ParsedResumeWorkExperience[];
  projects: ParsedResumeProject[];
};
