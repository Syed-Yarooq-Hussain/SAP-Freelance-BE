export enum MeetingStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export const MEETING_STATUS_ARRAY = Object.values(MeetingStatus)

export enum UserRole {
  ADMIN = 3,
  CONSULTANT = 2,
  CLIENT = 1
}

export const USER_ROLE_ARRAY = Object.values(UserRole); 

export enum ProjectStatus {
  INITIATED = 'Initiated',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled',
}
export const PROJECT_STATUS_ARRAY = Object.values(ProjectStatus);

export enum ConsultantStatus {
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview-schedule',
  INTERVIEW_DONE = 'interviewed',
  HIRED = 'hired',
  REJECTED = 'rejected',
}
export const CONSULTANT_STATUS_ARRAY = Object.values(ConsultantStatus);

export enum ConsultantLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
}
export const CONSULTANT_LEVEL_ARRAY = Object.values(ConsultantLevel);