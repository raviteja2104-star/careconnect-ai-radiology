'use client';

import * as React from 'react';
import { useSession } from '@/components/providers/SessionProvider';

interface PermissionContextValue {
    /** Returns true if the current session has ALL of the given permissions. */
    hasPermission: (...perms: string[]) => boolean;
    /** Returns true if the current session has access to the given workspace. */
    hasWorkspace: (workspace: string) => boolean;
    permissions: string[];
    workspaces: string[];
}

const PermissionContext = React.createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { session } = useSession();

    const permissions = session.permissions ?? [];
    const workspaces  = session.workspaces  ?? [];

    const hasPermission = React.useCallback(
        (...perms: string[]) => {
            const set = new Set(permissions);
            return perms.every(p => set.has(p));
        },
        [permissions]
    );

    const hasWorkspace = React.useCallback(
        (workspace: string) => workspaces.includes(workspace),
        [workspaces]
    );

    const value = React.useMemo<PermissionContextValue>(
        () => ({ hasPermission, hasWorkspace, permissions, workspaces }),
        [hasPermission, hasWorkspace, permissions, workspaces]
    );

    return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
    const ctx = React.useContext(PermissionContext);
    if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
    return ctx;
}
