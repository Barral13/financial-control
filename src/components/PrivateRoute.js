// components/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import LoadingSpinner from "./LoadingSpinner";

export default function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;

  return children;
}
