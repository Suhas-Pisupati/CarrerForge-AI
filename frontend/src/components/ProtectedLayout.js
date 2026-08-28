import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function ProtectedLayout({
  user,
  setUser
}) {

  return (

    <>

      <Navbar
        user={user}
        setUser={setUser}
      />

      <main className="app-content">

        <Outlet />

      </main>

    </>

  );

}

export default ProtectedLayout;