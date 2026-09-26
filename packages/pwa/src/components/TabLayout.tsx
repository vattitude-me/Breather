import { NavLink, Outlet } from 'react-router-dom';
import { Chart, Gear, Home } from './icons';
import CookieConsent from './CookieConsent';

const TABS = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/progress', label: 'Progress', Icon: Chart },
  { to: '/settings', label: 'Settings', Icon: Gear },
];

export default function TabLayout() {
  return (
    <>
      <div className="tab-content">
        <Outlet />
      </div>
      <nav className="tabbar">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} replace className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
      <CookieConsent />
    </>
  );
}
