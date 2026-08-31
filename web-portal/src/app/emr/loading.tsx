
export default function Loading() {
  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 animate-pulse">
           <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mr-2"></div>
           <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden animate-pulse">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0">
           <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </header>
        <div className="flex-1 p-8">
           <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8"></div>
        </div>
      </div>
    </div>
  );
}
  
