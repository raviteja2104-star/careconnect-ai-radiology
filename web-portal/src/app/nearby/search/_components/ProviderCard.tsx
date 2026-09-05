'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Phone, Navigation2, CalendarCheck2, Star, Truck, Video, Siren } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { VerificationBadge } from '../../_components/VerificationBadge';
import {
    PROVIDER_TYPE_LABELS, feeRangeLabel, directionsUrl, telUrl,
    type NearbyProvider,
} from '../../_lib/api';

export function ProviderCard({
    provider,
    highlighted,
    delay = 0,
    onHover,
}: {
    provider: NearbyProvider;
    highlighted?: boolean;
    delay?: number;
    onHover?: (id: string | null) => void;
}) {
    const router = useRouter();
    const tel = telUrl(provider.phone);
    const bookable = provider.verificationStatus !== 'CLOSED';

    return (
        <motion.div
            id={`provider-${provider._id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => onHover?.(provider._id)}
            onMouseLeave={() => onHover?.(null)}
        >
            <Card
                variant={highlighted ? 'interactive' : 'default'}
                className={highlighted ? 'ring-2 ring-primary/50' : undefined}
            >
                <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-foreground">{provider.name}</h3>
                                <Badge tone="neutral">{PROVIDER_TYPE_LABELS[provider.type]}</Badge>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" aria-hidden /> {provider.locality} · {provider.distanceKm} km away
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <VerificationBadge status={provider.verificationStatus} lastVerifiedAt={provider.lastVerifiedAt} />
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                    <span
                                        className={`h-2 w-2 rounded-full ${provider.openNow ? 'bg-success' : 'bg-danger'}`}
                                        aria-hidden
                                    />
                                    <span className={provider.openNow ? 'text-success' : 'text-danger'}>
                                        {provider.openNow ? 'Open now' : 'Closed now'}
                                    </span>
                                </span>
                                {provider.reviewSummary && (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                                        {provider.reviewSummary.avg.toFixed(1)} ({provider.reviewSummary.count})
                                    </span>
                                )}
                            </div>

                            {provider.availableToday && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                                    <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden /> Appointments available today
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {provider.servicesOffered.slice(0, 4).map((s) => (
                                    <Badge key={s} tone="outline">{s}</Badge>
                                ))}
                                {provider.homeCollection && <Badge tone="info"><Truck className="h-3 w-3" aria-hidden /> Home collection</Badge>}
                                {provider.teleconsultation && <Badge tone="info"><Video className="h-3 w-3" aria-hidden /> Teleconsult</Badge>}
                                {provider.emergencyAvailable && <Badge tone="danger"><Siren className="h-3 w-3" aria-hidden /> Emergency</Badge>}
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">{feeRangeLabel(provider.consultationFeeRange)}</p>
                        </div>

                        <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:flex-col sm:items-stretch">
                            <Button size="sm" onClick={() => router.push(`/nearby/provider/${provider._id}`)}>
                                View Profile
                            </Button>
                            {bookable && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/nearby/book/${provider._id}`)}
                                >
                                    Book
                                </Button>
                            )}
                            <div className="flex gap-2 sm:contents">
                                {tel && (
                                    <Button size="sm" variant="ghost" onClick={() => (window.location.href = tel)}>
                                        <Phone className="h-3.5 w-3.5" aria-hidden /> Call
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(directionsUrl(provider.geo, provider.name), '_blank', 'noopener,noreferrer')}
                                >
                                    <Navigation2 className="h-3.5 w-3.5" aria-hidden /> Directions
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
