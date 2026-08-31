import Handlebars from 'handlebars';
import { CommunicationChannel } from './types';

interface TemplateDef {
  intentType: string;
  channel: CommunicationChannel;
  content: string;
  subject?: string; // used for email
}

export class TemplateEngine {
  private templates: Map<string, TemplateDef> = new Map();
  private compiledCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // SMS / WhatsApp Template
    this.registerTemplate({
      intentType: 'AppointmentReminder',
      channel: 'sms',
      content: 'Hi {{patientName}}, this is a reminder for your appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}} at {{hospitalName}}.'
    });

    this.registerTemplate({
      intentType: 'AppointmentReminder',
      channel: 'whatsapp',
      content: 'Hi *{{patientName}}*,\n\nThis is a reminder for your upcoming appointment:\n👨‍⚕️ Doctor: {{doctorName}}\n📅 Date: {{appointmentDate}}\n⏰ Time: {{appointmentTime}}\n🏥 Location: {{hospitalName}}\n\nPlease reply YES to confirm.'
    });

    // Email Template
    this.registerTemplate({
      intentType: 'AppointmentReminder',
      channel: 'email',
      subject: 'Your Upcoming Appointment at {{hospitalName}}',
      content: 'Dear {{patientName}},\n\nThis is a reminder for your appointment with {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}.\n\nLocation: {{hospitalName}}\n\nThank you.'
    });

    // --- AppointmentBooked (booking confirmation) ---
    this.registerTemplate({
      intentType: 'AppointmentBooked',
      channel: 'sms',
      content: 'Hi {{patientName}}, your appointment with {{doctorName}} is confirmed for {{appointmentDate}} at {{appointmentTime}} at {{hospitalName}}. - CareConnect'
    });

    this.registerTemplate({
      intentType: 'AppointmentBooked',
      channel: 'whatsapp',
      content: 'Hi *{{patientName}}*,\n\nYour appointment is confirmed ✅\n👨‍⚕️ Doctor: {{doctorName}}\n📅 Date: {{appointmentDate}}\n⏰ Time: {{appointmentTime}}\n🏥 Location: {{hospitalName}}\n\nSee you soon!'
    });

    this.registerTemplate({
      intentType: 'AppointmentBooked',
      channel: 'email',
      subject: 'Appointment Confirmed - {{hospitalName}}',
      content: 'Dear {{patientName}},\n\nYour appointment with {{doctorName}} has been booked for {{appointmentDate}} at {{appointmentTime}}.\n\nLocation: {{hospitalName}}\n\nThank you for choosing CareConnect.'
    });

    // --- CriticalFindingDetected (urgent alert, typically to the ordering doctor) ---
    this.registerTemplate({
      intentType: 'CriticalFindingDetected',
      channel: 'sms',
      content: 'URGENT: Critical finding on study {{accessionNumber}}. {{description}} Please review immediately. - CareConnect Radiology'
    });

    this.registerTemplate({
      intentType: 'CriticalFindingDetected',
      channel: 'whatsapp',
      content: '🚨 *URGENT: Critical Finding*\n\nStudy: {{accessionNumber}}\nFinding: {{description}}\n\nPlease review immediately in the CareConnect worklist.'
    });

    this.registerTemplate({
      intentType: 'CriticalFindingDetected',
      channel: 'email',
      subject: 'URGENT: Critical finding on study {{accessionNumber}}',
      content: 'A critical finding has been flagged.\n\nStudy: {{accessionNumber}}\nFinding: {{description}}\n\nPlease review the study immediately in the CareConnect worklist.'
    });

    // --- PatientNotified (imaging report ready) ---
    this.registerTemplate({
      intentType: 'PatientNotified',
      channel: 'sms',
      content: 'Hi{{#if patientName}} {{patientName}}{{/if}}, your imaging report{{#if accessionNumber}} ({{accessionNumber}}){{/if}} has been signed and is now available in your CareConnect health records.'
    });

    this.registerTemplate({
      intentType: 'PatientNotified',
      channel: 'whatsapp',
      content: 'Hi{{#if patientName}} *{{patientName}}*{{/if}},\n\n📄 Your imaging report{{#if accessionNumber}} ({{accessionNumber}}){{/if}} is ready.\nA radiologist has signed it and it is now available in your CareConnect health records.'
    });

    this.registerTemplate({
      intentType: 'PatientNotified',
      channel: 'email',
      subject: 'Your imaging report is ready',
      content: 'Dear{{#if patientName}} {{patientName}}{{else}} Patient{{/if}},\n\nA radiologist has signed your imaging report{{#if accessionNumber}} ({{accessionNumber}}){{/if}}. It is now available in your CareConnect health records.\n\nThank you.'
    });
  }

  public registerTemplate(def: TemplateDef) {
    const key = this.getCacheKey(def.intentType, def.channel);
    this.templates.set(key, def);
    
    this.compiledCache.set(`${key}_content`, Handlebars.compile(def.content));
    if (def.subject) {
      this.compiledCache.set(`${key}_subject`, Handlebars.compile(def.subject));
    }
  }

  public render(intentType: string, channel: CommunicationChannel, payload: Record<string, any>): { content: string, subject?: string } {
    const key = this.getCacheKey(intentType, channel);
    
    if (!this.templates.has(key)) {
      throw new Error(`Template not found for intent: ${intentType} on channel: ${channel}`);
    }

    const contentRenderer = this.compiledCache.get(`${key}_content`);
    const content = contentRenderer ? contentRenderer(payload) : '';

    let subject = undefined;
    const subjectRenderer = this.compiledCache.get(`${key}_subject`);
    if (subjectRenderer) {
      subject = subjectRenderer(payload);
    }

    return { content, subject };
  }

  private getCacheKey(intentType: string, channel: string): string {
    return `${intentType}:${channel}`;
  }
}
