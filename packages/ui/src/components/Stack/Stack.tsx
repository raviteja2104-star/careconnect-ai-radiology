import React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
}

export function Stack({ 
  children, 
  direction = 'col', 
  gap = 'md', 
  align = 'stretch', 
  justify = 'start',
  wrap = false,
  className = '', 
  ...props 
}: StackProps) {
  const directions = {
    row: 'flex-row',
    col: 'flex-col'
  };

  const gaps = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };

  return (
    <div 
      className={`flex ${directions[direction]} ${gaps[gap]} ${alignments[align]} ${justifications[justify]} ${wrap ? 'flex-wrap' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
