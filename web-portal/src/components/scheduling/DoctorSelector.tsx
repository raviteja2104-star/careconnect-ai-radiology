'use client';
import React from 'react';
import { Search, Check, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Skeleton, Avatar, EmptyState } from '@/components/ui';

export const DoctorSelector = ({ selected, onSelect }: { selected: string, onSelect: (id: string) => void }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin_doctors'],
    // Fetching all doctors across all specialties for admin view
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/appointments/doctors`).then(res => res.json())
  });

  const doctors = data?.data || [];

  return (
    <Card className="flex max-h-[calc(100vh-14rem)] flex-col overflow-hidden">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base">Resource Planner</CardTitle>
        <CardDescription>Pick a doctor to edit their weekly template.</CardDescription>

        <div className="flex gap-2 pt-2">
          <Select aria-label="Filter by hospital" className="h-9 text-xs">
            <option>All Hospitals</option>
            <option>Main Campus</option>
          </Select>
          <Select aria-label="Filter by department" className="h-9 text-xs">
            <option>All Depts</option>
            <option>Cardiology</option>
          </Select>
        </div>

        <Input icon={<Search />} type="text" placeholder="Search doctor…" aria-label="Search doctor" className="h-9" />
      </CardHeader>

      <CardContent className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2 pt-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No resources found"
            description="Doctors registered for this hospital will appear here."
          />
        ) : (
          doctors.map((doc: any) => (
            <button
              key={doc._id}
              onClick={() => onSelect(doc._id)}
              aria-current={selected === doc._id ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                selected === doc._id
                  ? 'border-primary/40 bg-primary/5 shadow-soft'
                  : 'border-transparent hover:bg-muted'
              )}
            >
              <Avatar name={doc.name} src={doc.image} size="md" status="online" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-foreground">{doc.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{doc.specialty}</p>
              </div>
              {selected === doc._id && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
};
