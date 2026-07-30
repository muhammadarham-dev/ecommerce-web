import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="page-section centered-page">
      <div className="container">
        <h1>404</h1>
        <p>The requested page could not be found.</p>

        <Link to="/" className="primary-button">
          Return Home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;