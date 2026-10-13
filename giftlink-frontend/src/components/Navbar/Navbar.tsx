/**
 * Responsive top navigation (spec 002, user story 2).
 *
 * React Router's NavLink adds `aria-current="page"` to the active link, so screen readers
 * announce the current section. The collapse toggle is a real button and keyboard friendly.
 */
import { Button, Container, Nav, Navbar as BsNavbar } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router';

import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/app/login');
  };

  return (
    <BsNavbar expand="lg" bg="light" as="header" collapseOnSelect>
      <Container>
        <BsNavbar.Brand as={Link} to="/">
          🎁 GiftLink
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="main-navigation" />
        <BsNavbar.Collapse id="main-navigation">
          <Nav as="nav" aria-label="Main" className="me-auto">
            <Nav.Link as={NavLink} to="/" end>
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/app" end>
              Gifts
            </Nav.Link>
            <Nav.Link as={NavLink} to="/app/search">
              Search
            </Nav.Link>
          </Nav>
          <Nav className="align-items-lg-center gap-lg-2">
            {isAuthenticated && user ? (
              <>
                <Nav.Link as={NavLink} to="/app/new">
                  Post a gift
                </Nav.Link>
                <Nav.Link as={NavLink} to="/app/profile">
                  Welcome, {user.firstName}
                </Nav.Link>
                <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/app/login">
                  Login
                </Nav.Link>
                <Nav.Link as={NavLink} to="/app/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}
