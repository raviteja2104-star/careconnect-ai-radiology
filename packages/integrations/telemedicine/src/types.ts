export interface CreateMeetingParams {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  scheduledStartTime?: Date;
}

export interface MeetingRoom {
  roomId: string;
  joinUrl: string;
  hostUrl?: string; // Doctor's join link with extra perms
  provider: string;
  expiresAt: Date;
}

export interface VideoProvider {
  providerName: string;
  initialize(): Promise<void>;
  createMeeting(params: CreateMeetingParams): Promise<MeetingRoom>;
  endMeeting(roomId: string): Promise<boolean>;
  healthCheck(): Promise<boolean>;
}
