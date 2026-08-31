import { VideoProvider, CreateMeetingParams, MeetingRoom } from '../types';

export class DailyVideoProvider implements VideoProvider {
  providerName = 'Daily.co';
  
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('[DailyVideoProvider] Initialized without API key. Running in mock mode.');
    }
  }

  async createMeeting(params: CreateMeetingParams): Promise<MeetingRoom> {
    // In a real app, this hits https://api.daily.co/v1/rooms
    const mockRoomId = `daily-${params.appointmentId}-${Date.now().toString().slice(-4)}`;
    
    return {
      roomId: mockRoomId,
      joinUrl: `https://careconnect.daily.co/${mockRoomId}`,
      hostUrl: `https://careconnect.daily.co/${mockRoomId}?t=host_token_mock`,
      provider: this.providerName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // +24 hours
    };
  }

  async endMeeting(roomId: string): Promise<boolean> {
    console.log(`[DailyVideoProvider] Ended meeting ${roomId}`);
    return true;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
