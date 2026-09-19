import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <div className="top-navigation">
      <strong className="navbar-brand">Campus QA</strong>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Ask questions
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
          Document library
        </NavLink>
      </div>
    </div>
  );
}
