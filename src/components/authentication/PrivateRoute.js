import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


// const PrivateRoute = ({ children }) => {
//   const { currentUser } = useAuth();
  
//   if (!currentUser) {
//     // Redirect them to the /login page, but save the current location they were trying to go to
//     return <Navigate to="/login" />;
//   }

//   return children;
// };

const PrivateRoute = ({ Component }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Component /> : <Navigate to="/login" />;
};
export default PrivateRoute