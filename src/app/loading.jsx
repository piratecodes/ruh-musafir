export default function Loading() {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center">
      
      {/* Elegant Terracotta Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-foreground/5 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-transparent border-t-accent border-r-accent rounded-full animate-spin absolute inset-0"></div>
      </div>
      
      {/* Branded Text */}
      <p className="mt-8 font-sans text-[10px] uppercase tracking-[0.4em] font-bold text-foreground/50 animate-pulse">
        Loading Sanctuary...
      </p>
      
    </div>
  );
}