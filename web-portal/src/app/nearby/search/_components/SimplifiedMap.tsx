'use client';

import * as React from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { NearbyProvider } from '../../_lib/api';

/**
 * NOT a real street map — there is no maps SDK wired up. This scatters
 * markers by each provider's lat/lng position relative to the bounding box
 * of the current result set, purely to convey rough spatial spread. The
 * "Simplified map view" label must stay visible whenever this renders.
 */
export function SimplifiedMap({
    providers,
    highlightedId,
    onSelect,
    onHover,
}: {
    providers: NearbyProvider[];
    highlightedId: string | null;
    onSelect: (id: string) => void;
    onHover?: (id: string | null) => void;
}) {
    const bounds = React.useMemo(() => {
        if (!providers.length) return null;
        const lats = providers.map((p) => p.geo.lat);
        const lngs = providers.map((p) => p.geo.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        // Pad degenerate bounds (single point / identical coords) so markers don't collapse.
        const padLat = maxLat - minLat < 0.01 ? 0.01 : (maxLat - minLat) * 0.12;
        const padLng = maxLng - minLng < 0.01 ? 0.01 : (maxLng - minLng) * 0.12;
        return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
    }, [providers]);

    if (!providers.length || !bounds) {
        return (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                No providers to place on the map.
            </div>
        );
    }

    const typeDot: Record<string, string> = {
        hospital: 'bg-rose-500',
        clinic: 'bg-blue-500',
        diagnostic: 'bg-violet-500',
        pharmacy: 'bg-teal-500',
    };

    return (
        <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-border bg-muted/20">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,theme(colors.border)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border)_1px,transparent_1px)] [background-size:32px_32px]" aria-hidden />

            <div className="absolute left-3 top-3 z-10">
                <Badge tone="outline" className="bg-card/90 backdrop-blur">
                    <MapPin className="h-3 w-3" aria-hidden /> Simplified map view — not a street map
                </Badge>
            </div>

            <div className="relative h-full w-full">
                {providers.map((p) => {
                    // x from lng (west→east), y inverted from lat (north is up).
                    const x = ((p.geo.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
                    const y = (1 - (p.geo.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
                    const isHi = highlightedId === p._id;
                    return (
                        <button
                            key={p._id}
                            type="button"
                            onClick={() => onSelect(p._id)}
                            onMouseEnter={() => onHover?.(p._id)}
                            onMouseLeave={() => onHover?.(null)}
                            style={{ left: `${Math.min(96, Math.max(4, x))}%`, top: `${Math.min(92, Math.max(8, y))}%` }}
                            className="group absolute -translate-x-1/2 -translate-y-full focus-visible:outline-none"
                            aria-label={`${p.name}, ${p.locality}`}
                            title={p.name}
                        >
                            <span
                                className={`block h-4 w-4 rounded-full border-2 border-white shadow-pop transition-transform group-hover:scale-125 ${typeDot[p.type] ?? 'bg-primary'} ${isHi ? 'scale-125 ring-2 ring-primary' : ''}`}
                            />
                            <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-1.5 py-0.5 text-[10px] font-medium text-foreground opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                                {p.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
                {Object.entries(typeDot).map(([type, dot]) => (
                    <span key={type} className="inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden /> {type}
                    </span>
                ))}
            </div>
        </div>
    );
}
