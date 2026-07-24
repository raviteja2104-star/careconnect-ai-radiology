const fs = require('fs');
const path = require('path');

const components = {
  Input: `import React from 'react';\n\nexport interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\n\nexport function Input({ label, error, className = '', ...props }: InputProps) {\n  return (\n    <div className="w-full">\n      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}\n      <input className={\`block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border \${error ? 'border-red-500' : ''} \${className}\`} {...props} />\n      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}\n    </div>\n  );\n}\n`,
  Select: `import React from 'react';\n\nexport interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: {value: string; label: string}[]; }\n\nexport function Select({ label, options, className = '', ...props }: SelectProps) {\n  return (\n    <div className="w-full">\n      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}\n      <select className={\`block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border \${className}\`} {...props}>\n        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}\n      </select>\n    </div>\n  );\n}\n`,
  PatientSearch: `import React from 'react';\nimport { Input } from '../Input/Input';\nimport { Search } from 'lucide-react';\n\nexport function PatientSearch(props: React.InputHTMLAttributes<HTMLInputElement>) {\n  return (\n    <div className="relative">\n      <Input placeholder="Search patient by Name, MRN, or Phone..." className="pl-10" {...props} />\n      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />\n    </div>\n  );\n}\n`,
  Table: `import React from 'react';\n\nexport function Table({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) {\n  return <div className="overflow-x-auto"><table className={\`min-w-full divide-y divide-slate-200 dark:divide-slate-800 \${className}\`} {...props}>{children}</table></div>;\n}\n\nexport function TableHead({ children }: { children: React.ReactNode }) { return <thead className="bg-slate-50 dark:bg-slate-900/50">{children}</thead>; }\nexport function TableBody({ children }: { children: React.ReactNode }) { return <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">{children}</tbody>; }\nexport function TableRow({ children }: { children: React.ReactNode }) { return <tr>{children}</tr>; }\nexport function TableHeader({ children }: { children: React.ReactNode }) { return <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{children}</th>; }\nexport function TableCell({ children }: { children: React.ReactNode }) { return <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">{children}</td>; }\n`,
  PatientCard: `import React from 'react';\nimport { Avatar } from '../Avatar/Avatar';\nimport { Badge } from '../Badge/Badge';\n\nexport interface PatientCardProps {\n  name: string;\n  mrn: string;\n  age: number;\n  gender: string;\n  status?: 'Admitted' | 'Discharged' | 'Critical';\n}\n\nexport function PatientCard({ name, mrn, age, gender, status }: PatientCardProps) {\n  return (\n    <div className="flex items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">\n      <Avatar fallback={name.substring(0, 2).toUpperCase()} size="lg" className="mr-4" />\n      <div className="flex-1">\n        <div className="flex items-center gap-2">\n          <h3 className="font-bold text-slate-900 dark:text-white">{name}</h3>\n          {status && <Badge variant={status === 'Critical' ? 'danger' : 'neutral'}>{status}</Badge>}\n        </div>\n        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">MRN: {mrn} • {age}y {gender}</p>\n      </div>\n    </div>\n  );\n}\n`
};

Object.keys(components).forEach(name => {
  const dir = path.join(__dirname, 'packages/ui/src/components', name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, \`\${name}.tsx\`), components[name]);
});

let indexContent = fs.readFileSync(path.join(__dirname, 'packages/ui/src/index.ts'), 'utf8');
indexContent += \`
// Forms
export * from './components/Input/Input';
export * from './components/Select/Select';

// Healthcare Forms
export * from './components/PatientSearch/PatientSearch';

// Data Display
export * from './components/Table/Table';

// Healthcare Display
export * from './components/PatientCard/PatientCard';
\`;
fs.writeFileSync(path.join(__dirname, 'packages/ui/src/index.ts'), indexContent);
