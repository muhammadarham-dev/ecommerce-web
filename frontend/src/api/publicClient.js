import axios from "axios";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


/*
 * Public storefront requests must not include a saved JWT. An expired
 * token should never block anonymous catalog browsing or create noisy
 * 401 responses while the authenticated client refreshes its session.
 */
const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
});


export default publicApiClient;
