import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

import AppDataProviders from
  "./context/AppDataProviders";

import {
  StoreSettingsProvider,
} from "./context/StoreSettingsContext";

import "./styles/global.css";
import "./styles/layout.css";
import "./styles/coupons.css";
import "./styles/banners.css";
import "./styles/shop-products.css";

import "./styles/admin.css";
import "./styles/admin-products.css";
import "./styles/admin-inventory.css";
import "./styles/admin-orders.css";
import "./styles/admin-returns.css";
import "./styles/admin-tickets.css";
import "./styles/admin-shipments.css";
import "./styles/admin-coupons.css";
import "./styles/admin-reviews.css";
import "./styles/admin-banners.css";
import "./styles/admin-shipping-rates.css";
import "./styles/admin-store-settings.css";


createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    <BrowserRouter>
      <StoreSettingsProvider>
        <AuthProvider>
          <AppDataProviders>
            <App />
          </AppDataProviders>
        </AuthProvider>
      </StoreSettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
