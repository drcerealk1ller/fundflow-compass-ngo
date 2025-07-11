import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Short delay to show transition

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isLoading) {
    return <LoadingSpinner message="Loading page..." size="md" />;
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};