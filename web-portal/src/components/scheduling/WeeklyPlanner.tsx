'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, GripVertical, X, Settings2, CheckCircle, CalendarDays, Video, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, Button, Input, Select, Label, Switch, Skeleton, EmptyState,
} from '@/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WeeklyPlanner = ({ doctorId }: { doctorId: string | null }) => {
  const queryClient = useQueryClient();
  const [localSchedule, setLocalSchedule] = useState<any>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null); // For the Side Drawer

  // 1. Fetch Schedule from Backend
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule', doctorId],
    queryFn: () => fetch(`http://localhost:5000/api/schedules/${doctorId}`).then(res => res.json()),
    enabled: !!doctorId
  });

  // Keep local state in sync with server state (Optimistic editing before Save)
  useEffect(() => {
    if (scheduleData?.data?.weeklySchedule) {
      setLocalSchedule(scheduleData.data.weeklySchedule);
    }
  }, [scheduleData]);

  // 2. Mutation to Save Schedule
  const saveMutation = useMutation({
    mutationFn: (newSchedule: any) =>
      fetch(`http://localhost:5000/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor: doctorId,
          hospital: 'CareConnect Main Hospital',
          weeklySchedule: newSchedule
        })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', doctorId] });
      // Show success toast here in production
    }
  });

  if (!doctorId) {
    return (
      <Card className="flex min-h-[24rem] items-center justify-center">
        <EmptyState
          icon={CalendarDays}
          title="Select a resource"
          description="Please select a doctor or room from the left sidebar to configure their weekly schedule."
        />
      </Card>
    );
  }

  if (isLoading || !localSchedule) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border pb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const handleAddShift = (day: string) => {
    const newShift = {
      _tempId: Math.random().toString(),
      name: 'Morning',
      startTime: '09:00',
      endTime: '13:00',
      consultationDuration: 15,
      bufferTime: 5,
      isTelemedicineEnabled: false
    };

    setLocalSchedule((prev: any) => ({
      ...prev,
      [day]: [...(prev[day] || []), newShift]
    }));
  };

  const handleRemoveShift = (day: string, shiftIndex: number) => {
    setLocalSchedule((prev: any) => {
      const updatedDay = [...prev[day]];
      updatedDay.splice(shiftIndex, 1);
      return { ...prev, [day]: updatedDay };
    });
    if (selectedShift?.day === day && selectedShift?.index === shiftIndex) {
      setSelectedShift(null);
    }
  };

  const handleUpdateActiveShift = (updates: any) => {
    if (!selectedShift) return;
    setLocalSchedule((prev: any) => {
      const updatedDay = [...prev[selectedShift.day]];
      updatedDay[selectedShift.index] = { ...updatedDay[selectedShift.index], ...updates };
      return { ...prev, [selectedShift.day]: updatedDay };
    });
  };

  const saveToDatabase = () => {
    saveMutation.mutate(localSchedule);
  };

  const activeShift = selectedShift ? localSchedule[selectedShift.day]?.[selectedShift.index] : null;

  return (
    <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row">
      {/* Main Calendar Area */}
      <Card className="w-full min-w-0 flex-1">
        {/* Toolbar */}
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Weekly Schedule Template</CardTitle>
            <Badge tone="success" dot>Active</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {saveMutation.isPending ? 'Saving…' : saveMutation.isSuccess ? 'Saved successfully' : 'Unsaved changes'}
            </span>
            <Button onClick={saveToDatabase} disabled={saveMutation.isPending} loading={saveMutation.isPending} size="sm">
              <CheckCircle className="h-4 w-4" aria-hidden /> Save Schedule
            </Button>
          </div>
        </CardHeader>

        {/* Grid */}
        <CardContent className="space-y-4 pt-6">
          {DAYS.map((day, dayIdx) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: dayIdx * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-border bg-background"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked aria-label={`${day} enabled`} className="h-4 w-4 rounded border-input accent-[var(--primary)]" />
                  <span className="w-24 text-sm font-semibold text-foreground">{day}</span>
                  {(localSchedule[day]?.length ?? 0) > 0 && (
                    <Badge tone="outline">{localSchedule[day].length} shift{localSchedule[day].length > 1 ? 's' : ''}</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleAddShift(day)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Add Shift
                </Button>
              </div>

              <div className="scrollbar-thin flex min-h-[6.5rem] gap-4 overflow-x-auto p-4">
                {(!localSchedule[day] || localSchedule[day].length === 0) ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border p-4 text-sm text-subtle-foreground">
                    No shifts assigned. Doctor is off.
                  </div>
                ) : (
                  localSchedule[day].map((shift: any, i: number) => {
                    const isSelected = selectedShift?.day === day && selectedShift?.index === i;
                    const isTele = shift.isTelemedicineEnabled;
                    return (
                      <div
                        key={shift._id || shift._tempId || i}
                        onClick={() => setSelectedShift({ day, index: i, shift })}
                        className={cn(
                          'group relative w-64 shrink-0 cursor-pointer rounded-xl border bg-card shadow-soft transition-all duration-200',
                          isSelected ? 'border-primary ring-2 ring-primary/40' : 'hover:border-primary/40 hover:shadow-float',
                          isTele && !isSelected && 'border-info/40'
                        )}
                      >
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
                          <GripVertical className="h-4 w-4 text-subtle-foreground" aria-hidden />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveShift(day, i); }}
                          aria-label="Remove shift"
                          className="absolute right-2 top-2 rounded-md p-1 text-subtle-foreground opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>

                        <div className="py-3 pl-8 pr-4">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <Badge tone={isTele ? 'info' : 'brand'}>
                              {isTele ? <Video className="mr-1 h-3 w-3" aria-hidden /> : null}
                              {isTele ? 'Telemedicine' : shift.name}
                            </Badge>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-muted-foreground">
                              <Clock className="h-3 w-3" aria-hidden />
                              {shift.startTime} – {shift.endTime}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle-foreground">Duration</p>
                              <p className="text-sm font-bold tabular-nums text-foreground">{shift.consultationDuration}m</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle-foreground">Buffer</p>
                              <p className="text-sm font-bold tabular-nums text-foreground">{shift.bufferTime}m</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* SHIFT EDITOR SIDE PANEL */}
      {selectedShift && activeShift ? (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full shrink-0 lg:w-80 lg:sticky lg:top-6"
        >
          <Card className="rounded-3xl">
            <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="h-4 w-4 text-primary" aria-hidden /> Shift Editor
                </CardTitle>
                <CardDescription className="mt-0.5">{selectedShift.day} shift</CardDescription>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Close editor" onClick={() => setSelectedShift(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="shift-name">Shift name</Label>
                <Select
                  id="shift-name"
                  value={localSchedule[selectedShift.day][selectedShift.index].name}
                  onChange={(e) => handleUpdateActiveShift({ name: e.target.value })}
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="Custom">Custom</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="shift-start">Start time</Label>
                  <Input
                    id="shift-start"
                    type="time"
                    value={localSchedule[selectedShift.day][selectedShift.index].startTime}
                    onChange={(e) => handleUpdateActiveShift({ startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shift-end">End time</Label>
                  <Input
                    id="shift-end"
                    type="time"
                    value={localSchedule[selectedShift.day][selectedShift.index].endTime}
                    onChange={(e) => handleUpdateActiveShift({ endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="shift-duration">Duration (m)</Label>
                  <Input
                    id="shift-duration"
                    type="number"
                    value={localSchedule[selectedShift.day][selectedShift.index].consultationDuration}
                    onChange={(e) => handleUpdateActiveShift({ consultationDuration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shift-buffer">Buffer (m)</Label>
                  <Input
                    id="shift-buffer"
                    type="number"
                    value={localSchedule[selectedShift.day][selectedShift.index].bufferTime}
                    onChange={(e) => handleUpdateActiveShift({ bufferTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold leading-none text-foreground">Telemedicine Enabled</p>
                    <p className="mt-1 text-xs text-muted-foreground">Accept virtual video consultations</p>
                  </div>
                  <Switch
                    checked={!!localSchedule[selectedShift.day][selectedShift.index].isTelemedicineEnabled}
                    onCheckedChange={(checked) => handleUpdateActiveShift({ isTelemedicineEnabled: checked })}
                    label="Telemedicine enabled"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold leading-none text-foreground">Walk-In Enabled</p>
                    <p className="mt-1 text-xs text-muted-foreground">Allow reception to book unreserved slots</p>
                  </div>
                  <Switch
                    checked={!!localSchedule[selectedShift.day][selectedShift.index].isWalkInEnabled}
                    onCheckedChange={(checked) => handleUpdateActiveShift({ isWalkInEnabled: checked })}
                    label="Walk-in enabled"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-4">
              <Button onClick={saveToDatabase} className="w-full" loading={saveMutation.isPending}>
                Apply to Calendar
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <div className="hidden w-80 shrink-0 lg:block lg:sticky lg:top-6">
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Settings2 className="mb-4 h-10 w-10 text-subtle-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Click on any shift card in the calendar to edit its properties, duration, and rules.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
