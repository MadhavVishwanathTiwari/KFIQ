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

// Note: SharpAPI's parse_resume response has no projects field, so the resume
// pipeline never populates projects. Projects are a manual-entry section only.
export type ParsedResumeData = {
  skills: ParsedResumeSkill[];
  certifications: string[];
  education: ParsedResumeEducation[];
  workExperience: ParsedResumeWorkExperience[];
};
