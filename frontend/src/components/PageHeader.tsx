import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className='p-2 rounded-lg mb-8'>
    <div className="bg-soft-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-forest-noir">{title}</h1>
        <div>{children}</div>
      </div>
    </div>
    </div>
  );
}
