/**
 * Landing page (spec 002, user story 1): course Tasks 1-4 of home.html, as a React route.
 */
import { Link } from 'react-router';

import './LandingPage.css';

export default function LandingPage() {
  return (
    <section className="landing" aria-labelledby="landing-title">
      <div className="landing-card">
        <h1 id="landing-title" className="display-4 mb-3">
          GiftLink
        </h1>
        <h2 className="h3 mb-4">Share Gifts and Joy!</h2>
        <blockquote className="lead mb-4">
          &ldquo;Sharing is the essence of community. It is through giving that we enrich and
          perpetuate both our lives and the lives of others.&rdquo;
        </blockquote>
        <Link to="/app" className="btn btn-primary btn-lg">
          Get Started
        </Link>
      </div>
    </section>
  );
}
