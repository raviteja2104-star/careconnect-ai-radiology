'use client';
import React, { useState } from 'react';
import TelemedicineWaitingRoom from '@/components/telemedicine/TelemedicineWaitingRoom';
import TelemedicineWorkspace from '@/components/telemedicine/TelemedicineWorkspace';

export default function TelemedicineSessionPage({ params }: { params: { sessionId: string } }) {
  const [hasJoined, setHasJoined] = useState(false);

  // In a real app, you would fetch session details from /api/telemedicine/:sessionId
  // to get doctorName, department, patientName, roomId, etc.
  const mockSession = {
    sessionId: params.sessionId,
    roomId: `tele-room-${params.sessionId}`,
    doctorName: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    patientName: 'Jane Smith'
  };

  if (!hasJoined) {
    return (
      <TelemedicineWaitingRoom 
        sessionId={mockSession.sessionId}
        doctorName={mockSession.doctorName}
        department={mockSession.department}
        onJoin={() => setHasJoined(true)}
      />
    );
  }

  return (
    <TelemedicineWorkspace 
      sessionId={mockSession.sessionId}
      roomId={mockSession.roomId}
      patientName={mockSession.patientName}
    />
  );
}
