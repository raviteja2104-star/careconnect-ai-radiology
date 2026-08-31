import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
            <Sidebar />
            <div className="ml-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
