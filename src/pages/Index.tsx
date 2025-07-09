import { Navigate } from "react-router-dom";

const Index = () => {
  // This component is no longer needed as routing is handled in App.tsx
  return <Navigate to="/auth" replace />;
};

export default Index;
