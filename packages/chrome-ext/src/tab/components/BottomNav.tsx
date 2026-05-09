import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/home', icon: '🏠', label: 'Home' },
  { path: '/progress', icon: '📊', label: 'Progress' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/active-break' || location.pathname === '/welcome') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-item-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
