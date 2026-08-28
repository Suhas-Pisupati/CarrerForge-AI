import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({
  user,
  authLoading
}) {

  // ========================================
  // WAIT FOR BACKEND AUTHENTICATION CHECK
  // ========================================

  if (authLoading) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          background: "#f5f7fb"
        }}
      >

        <div
          style={{
            fontSize: "30px"
          }}
        >
          🤖
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "15px",
            color: "#64748b"
          }}
        >
          Checking your login...
        </p>

      </div>

    );

  }


  // ========================================
  // AUTH CHECK FINISHED
  // NO USER = LOGIN
  // ========================================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ========================================
  // USER VERIFIED
  // ========================================

  return <Outlet />;

}

export default ProtectedRoute;