export default function Loading() {
  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 animate-pulse">
           <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mr-2"></div>
           <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1,2,3,4,5,6,7].map(i => (
             <div key={i} className="flex items-center animate-pulse">
               <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-md mr-3"></div>
               <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
             </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0 animate-pulse">
           <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </header>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-8">
           <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8 animate-pulse"></div>
           <div className="grid grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                 <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
