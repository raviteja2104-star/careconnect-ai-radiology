import React from 'react';
import { Avatar } from '../Avatar/Avatar';

export interface UserMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export function UserMenu({ name, role, avatarUrl, className = '', ...props }: UserMenuProps) {
  return (
    <div className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`} {...props}>
      <Avatar fallback={name.substring(0, 2).toUpperCase()} src={avatarUrl} size="sm" />
      <div className="hidden md:block text-left">
        <div className="text-sm font-medium text-slate-900 dark:text-white leading-none">{name}</div>
        {role && <div className="text-xs text-slate-500 mt-1">{role}</div>}
      </div>
    </div>
  );
}
