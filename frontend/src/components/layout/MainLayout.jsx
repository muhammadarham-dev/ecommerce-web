import {
  Outlet,
} from "react-router-dom";

import MaintenanceNotice from "../common/MaintenanceNotice";
import ScrollToTop from "../common/ScrollToTop";

import Footer from "./Footer";
import Navbar from "./Navbar";


function MainLayout() {
  return (
    <div className="ec-app-shell">
      <ScrollToTop />

      <Navbar />

      <MaintenanceNotice />

      <main className="ec-app-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}


export default MainLayout;