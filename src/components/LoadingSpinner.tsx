import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({ message = "Loading...", size = "md" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="text-center">
        <div className="relative">
          {/* Main spinner */}
          <Loader2 className={`${sizeClasses[size]} animate-spin text-white mx-auto pulse-glow`} />
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="loading-dots w-3 h-3 bg-white/80 rounded-full"></div>
            <div className="loading-dots w-3 h-3 bg-white/80 rounded-full"></div>
            <div className="loading-dots w-3 h-3 bg-white/80 rounded-full"></div>
          </div>
        </div>
        
        <p className="mt-4 text-white/90 font-medium text-lg">{message}</p>
        <p className="mt-2 text-white/70 text-sm">Please wait while we load your data</p>
      </div>
    </div>
  );
};