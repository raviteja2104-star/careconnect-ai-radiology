import React from 'react';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Sidebar({ children, className = '', ...props }: SidebarProps) {
  return (
    <div className={`w-64 bg-slate-900 flex flex-col h-full border-r border-slate-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroup({ title, children, className = '', ...props }: { title?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-2 ${className}`} {...props}>
      {title && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</div>}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  isActive?: boolean;
}

export function SidebarItem({ icon, children, isActive, className = '', ...props }: SidebarItemProps) {
  return (
    <a
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive 
          ? 'bg-indigo-600 text-white' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      } ${className}`}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </a>
  );
}
