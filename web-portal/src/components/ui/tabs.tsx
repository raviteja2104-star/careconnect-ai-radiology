'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{ value: string; onValueChange: (v: string) => void }>({
    value: '',
    onValueChange: () => {},
});

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }
>(({ className, defaultValue, value: controlled, onValueChange, ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue || '');
    const value = controlled ?? uncontrolled;
    const handleChange = (v: string) => {
        setUncontrolled(v);
        onValueChange?.(v);
    };
    return (
        <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
            <div ref={ref} className={className} {...props} />
        </TabsContext.Provider>
    );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            role="tablist"
            className={cn(
                'inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-muted p-1 text-muted-foreground',
                className
            )}
            {...props}
        />
    )
);
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isSelected = context.value === value;
    return (
        <button
            ref={ref}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => context.onValueChange(value)}
            className={cn(
                'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium',
                'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected
                    ? 'bg-card text-foreground shadow-soft'
                    : 'hover:text-foreground',
                className
            )}
            {...props}
        />
    );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (context.value !== value) return null;
    return (
        <div
            ref={ref}
            role="tabpanel"
            className={cn('mt-3 animate-fade-in focus-visible:outline-none', className)}
            {...props}
        />
    );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
