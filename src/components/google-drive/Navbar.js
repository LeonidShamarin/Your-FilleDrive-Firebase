import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

// expand="sm"
export default function NavbarComponent() {
  return (
    <Navbar bg="light" expand="xxxl" className="px-3">
      <Navbar.Brand as={Link} to="/">
        Your File Drive
      </Navbar.Brand>
      <Nav>
        <Nav.Link as={Link} to="/user">
          Profile
        </Nav.Link>
      </Nav>
    </Navbar>
  );
}
