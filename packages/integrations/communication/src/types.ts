export type CommunicationChannel = 'sms' | 'email' | 'whatsapp' | 'push';
export type DeliveryStatus = 'queued' | 'accepted' | 'sent' | 'delivered' | 'read' | 'failed' | 'retried';

/**
 * 'live'       — provider talks to a real upstream API (Twilio, Gupshup, SendGrid...).
 * 'simulation' — no credentials configured; sends are logged, never transmitted.
 */
export type ProviderMode = 'live' | 'simulation';

export interface Recipient {
  id: string; // userId or patientId
  phone?: string;
  email?: string;
  pushToken?: string;
  preferences?: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
}

export interface NotificationIntent {
  id: string; // unique intent/request id
  type: string; // e.g. 'AppointmentReminder'
  recipient: Recipient;
  payload: Record<string, any>; // data to hydrate the template
  channels?: CommunicationChannel[]; // override default channel selection
  priority?: 'low' | 'normal' | 'high';
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  channel: CommunicationChannel;
  provider: string;
  status: DeliveryStatus;
  error?: string;
  timestamp: Date;
  /** true when the message was NOT actually transmitted (simulation mode). Never set on real sends. */
  simulated?: boolean;
}

export interface CommunicationProvider {
  channel: CommunicationChannel;
  providerName: string;
  /** Defaults to 'live' when omitted. Simulation providers bypass the circuit breaker. */
  mode?: ProviderMode;

  initialize(): Promise<void>;
  
  /**
   * Send the constructed message via this provider
   */
  send(to: string, content: string, subject?: string): Promise<SendResult>;
  
  healthCheck(): Promise<boolean>;
}

export interface DeliveryRecord {
  intentId: string;
  messageId?: string;
  recipientId: string;
  channel: CommunicationChannel;
  provider: string;
  status: DeliveryStatus;
  timestamp: Date;
  error?: string;
  /** true when the record refers to a simulated (not actually transmitted) message. */
  simulated?: boolean;
}
