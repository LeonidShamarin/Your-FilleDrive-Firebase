import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// AuthProvider holds its children back until Firebase has restored the session,
// so a null user here means "signed out", never "still loading".
const PrivateRoute = ({ Component }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Component /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
