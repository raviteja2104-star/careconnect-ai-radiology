import React from 'react';
import { Video, MapPin, Calendar, Clock, MoreHorizontal, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppointmentData {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  type: 'Video Call' | 'In-Person';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  image: string;
  room?: string;
}

interface AppointmentCardProps {
  appointment: AppointmentData;
}

export const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
  const isVideo = appointment.type === 'Video Call';
  
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        
        <div className="flex gap-4 items-center">
          <img 
            src={appointment.image} 
            alt={appointment.doctorName} 
            className="w-14 h-14 rounded-xl object-cover shadow-sm border border-zinc-100 dark:border-zinc-800" 
          />
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">{appointment.doctorName}</h3>
            <p className="text-zinc-500 text-sm font-medium">{appointment.specialty}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin className="w-3.5 h-3.5" /> {appointment.hospital} {appointment.room && `• Room ${appointment.room}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            <span className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-md",
              appointment.status === 'Upcoming' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
              appointment.status === 'Completed' ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
              "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {appointment.status.toUpperCase()}
            </span>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded border",
              isVideo ? "border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400" : "border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400"
            )}>
              {appointment.type}
            </span>
        </div>

      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 font-medium bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <Calendar className="w-4 h-4 text-zinc-400" />
                {appointment.date}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 font-medium bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <Clock className="w-4 h-4 text-zinc-400" />
                {appointment.time}
            </div>
        </div>

        <div className="flex items-center gap-3">
          {appointment.status === 'Upcoming' && (
            <>
              {isVideo ? (
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors">
                  <Video className="w-4 h-4" /> Join Video
                </button>
              ) : (
                <button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 text-sm font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-opacity">
                  <MapPin className="w-4 h-4" /> Directions
                </button>
              )}
              
              <button className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium py-2 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors">
                Reschedule
              </button>
              <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </>
          )}

          {appointment.status === 'Completed' && (
              <button className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm font-semibold py-2 px-4 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800">
                  Book Follow-up
              </button>
          )}
        </div>
      </div>
    </div>
  );
};
