'use client';

/**
 * Reusable capture UI for Health Record Capture. Lets the user photograph a
 * paper medical document via the camera or pick files, preview/retake/remove
 * pages, optionally pick a document type (default: let AI classify), and
 * submit to the backend for AI extraction.
 *
 * Deliberately does NOT try to replicate the backend's quality/confidence
 * checks (blur detection etc). It only nudges on very cheap, obvious client
 * side signals (tiny frame, very dark frame) before upload; the real signal
 * (page.quality.warnings, confidenceNote) is surfaced on the review page
 * after upload, per the AI extraction's own assessment.
 */

import * as React from 'react';
import { Camera, Upload, X, RotateCcw, FileText, AlertTriangle, Loader2, ImageIcon } from 'lucide-react';
import { Button, Select, Label, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
    uploadHealthDocument,
    ApiOfflineError,
    ApiHttpError,
    DOCUMENT_TYPE_LABELS,
    type DocumentType,
    type CapturedVia,
    type DocumentAndExtraction,
} from '@/app/health-records/_lib/capture-api';

const ACCEPT_MIME = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/bmp,application/pdf';

const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS) as Array<[DocumentType, string]>;

interface CapturedPage {
    id: string;
    file: File;
    previewUrl: string | null; // null for non-image files (e.g. PDF)
    warning?: string;
}

let nextPageId = 1;

function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/** Cheap client-side nudge: flags a captured/selected image that's very
 *  small or very dark. Not a substitute for the backend's real assessment. */
function assessImageQuality(img: HTMLImageElement): string | undefined {
    if (img.naturalWidth < 500 || img.naturalHeight < 500) {
        return 'This looks like a low-resolution image — text may be hard to read.';
    }
    try {
        const canvas = document.createElement('canvas');
        const w = (canvas.width = Math.min(64, img.naturalWidth));
        const h = (canvas.height = Math.min(64, img.naturalHeight));
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        for (let i = 0; i < data.length; i += 4) total += (data[i] + data[i + 1] + data[i + 2]) / 3;
        const avg = total / (data.length / 4);
        if (avg < 40) return 'This photo looks very dark — consider retaking it in better light.';
    } catch {
        /* canvas sampling not available — skip the nudge */
    }
    return undefined;
}

function buildPageFromFile(file: File): Promise<CapturedPage> {
    const id = `pg-${nextPageId++}`;
    if (!isImageFile(file)) {
        return Promise.resolve({ id, file, previewUrl: null });
    }
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ id, file, previewUrl: url, warning: assessImageQuality(img) });
        img.onerror = () => resolve({ id, file, previewUrl: url });
        img.src = url;
    });
}

export interface DocumentScannerProps {
    /** Patient this document belongs to. */
    patientId: string;
    /** Pre-selects the document-type picker; user can still change or clear it. */
    defaultDocumentType?: DocumentType;
    /** Called after a successful upload (extraction may be null if AI was unavailable). */
    onUploaded: (result: DocumentAndExtraction) => void;
    className?: string;
}

export function DocumentScanner({ patientId, defaultDocumentType, onUploaded, className }: DocumentScannerProps) {
    const [pages, setPages] = React.useState<CapturedPage[]>([]);
    const [documentType, setDocumentType] = React.useState<DocumentType | ''>(defaultDocumentType || '');
    const [capturedVia, setCapturedVia] = React.useState<CapturedVia>('UPLOAD_IMAGE');
    const [cameraOpen, setCameraOpen] = React.useState(false);
    const [cameraError, setCameraError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [savedNoAi, setSavedNoAi] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    // Revoke object URLs on unmount.
    React.useEffect(() => {
        return () => {
            pages.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopCamera = React.useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraOpen(false);
    }, []);

    React.useEffect(() => () => stopCamera(), [stopCamera]);

    const openCamera = React.useCallback(async () => {
        setCameraError(null);
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setCameraError('This browser does not support camera capture. Use file upload instead.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setCameraOpen(true);
            // Attach once the <video> is mounted.
            requestAnimationFrame(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            });
        } catch (err) {
            const name = err instanceof DOMException ? err.name : '';
            setCameraError(
                name === 'NotAllowedError'
                    ? 'Camera access was denied. Allow camera access in your browser and try again, or upload a file instead.'
                    : name === 'NotFoundError'
                        ? 'No camera was found on this device. Upload a file instead.'
                        : 'Could not start the camera. Upload a file instead.'
            );
        }
    }, []);

    const capturePhoto = React.useCallback(async () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const page = await buildPageFromFile(file);
        setPages((prev) => [...prev, page]);
        setCapturedVia('CAMERA');
        stopCamera();
    }, [stopCamera]);

    const handleFileSelect = React.useCallback(async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const files = Array.from(fileList);
        const built = await Promise.all(files.map(buildPageFromFile));
        setPages((prev) => [...prev, ...built]);
        setCapturedVia(files.some((f) => f.type === 'application/pdf') ? 'UPLOAD_PDF' : 'UPLOAD_IMAGE');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const removePage = React.useCallback((id: string) => {
        setPages((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
    }, []);

    const retakePage = React.useCallback((id: string) => {
        removePage(id);
        openCamera();
    }, [removePage, openCamera]);

    const canSubmit = pages.length > 0 && !submitting;

    const handleSubmit = React.useCallback(async () => {
        if (pages.length === 0) return;
        setSubmitting(true);
        setSubmitError(null);
        setSavedNoAi(false);
        try {
            const result = await uploadHealthDocument({
                files: pages.map((p) => p.file),
                patientId,
                documentType: documentType || undefined,
                capturedVia,
            });
            if (!result.extraction) setSavedNoAi(true);
            onUploaded(result);
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                setSubmitError('Health Record Capture requires a live backend connection. The document was not saved — please try again once the backend is reachable.');
            } else if (err instanceof ApiHttpError) {
                setSubmitError(err.message);
            } else {
                setSubmitError('Something went wrong while uploading. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }, [pages, patientId, documentType, capturedVia, onUploaded]);

    return (
        <div className={cn('space-y-6', className)}>
            <Card>
                <CardContent className="space-y-4 p-5">
                    <div>
                        <Label htmlFor="doc-type-picker">Document type (optional)</Label>
                        <Select
                            id="doc-type-picker"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value as DocumentType | '')}
                        >
                            <option value="">Let AI identify the document type</option>
                            {DOCUMENT_TYPE_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </Select>
                    </div>

                    {!cameraOpen ? (
                        <div className="flex flex-wrap gap-3">
                            <Button type="button" variant="outline" onClick={openCamera}>
                                <Camera className="h-4 w-4" aria-hidden />
                                Use Camera
                            </Button>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4" aria-hidden />
                                Upload File
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPT_MIME}
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                aria-label="Upload document file"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="overflow-hidden rounded-xl border border-border bg-black">
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                <video ref={videoRef} autoPlay playsInline muted className="aspect-[4/3] w-full object-cover" />
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" onClick={capturePhoto}>
                                    <Camera className="h-4 w-4" aria-hidden />
                                    Capture Page
                                </Button>
                                <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    {cameraError && (
                        <p className="flex items-start gap-1.5 text-sm text-danger">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            {cameraError}
                        </p>
                    )}
                </CardContent>
            </Card>

            {pages.length > 0 && (
                <Card>
                    <CardContent className="p-5">
                        <h3 className="mb-3 text-sm font-semibold text-foreground">
                            Pages to submit ({pages.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {pages.map((page, idx) => (
                                <div key={page.id} className="group relative overflow-hidden rounded-xl border border-border bg-muted/40">
                                    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-muted">
                                        {page.previewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={page.previewUrl} alt={`Page ${idx + 1} preview`} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                                <FileText className="h-8 w-8" aria-hidden />
                                                <span className="max-w-[90%] truncate text-[11px]">{page.file.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                        {idx + 1}
                                    </span>
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                        {page.previewUrl && (
                                            <button
                                                type="button"
                                                onClick={() => retakePage(page.id)}
                                                aria-label={`Retake page ${idx + 1}`}
                                                className="rounded-md bg-white/90 p-1.5 text-foreground hover:bg-white"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removePage(page.id)}
                                            aria-label={`Remove page ${idx + 1}`}
                                            className="rounded-md bg-white/90 p-1.5 text-danger hover:bg-white"
                                        >
                                            <X className="h-3.5 w-3.5" aria-hidden />
                                        </button>
                                    </div>
                                    {page.warning && (
                                        <p className="flex items-start gap-1 bg-warning-soft px-1.5 py-1 text-[10px] leading-tight text-warning">
                                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                                            {page.warning}
                                        </p>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                                <ImageIcon className="h-6 w-6" aria-hidden />
                                <span className="text-xs font-medium">Add page</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {submitError && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{submitError}</span>
                </div>
            )}

            {savedNoAi && (
                <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>Saved — AI reading wasn&apos;t available, you can still review/enter details manually.</span>
                </div>
            )}

            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
                {submitting ? 'Reading document (this can take up to 2 minutes)…' : 'Submit for AI Reading'}
            </Button>
            {submitting && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Claude is reading the document — this can take up to two minutes for handwritten or multi-page documents.
                </p>
            )}
        </div>
    );
}
