import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const links = [
  { to: '/admin/cities', label: 'Cities', icon: '🏙' },
  { to: '/admin/hotels', label: 'Hotels', icon: '🏨' },
  { to: '/admin/room-types', label: 'Room types', icon: '🛏' },
  { to: '/admin/amenities', label: 'Amenities', icon: '✨' },
  { to: '/admin/discounts', label: 'Discounts', icon: '％' },
  { to: '/admin/users', label: 'Users', icon: '👤' },
  { to: '/admin/outbox', label: 'Outbox', icon: '📤' },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="container">
      <div className={`admin-layout ${collapsed ? 'collapsed' : ''}`}>
        <nav className="admin-nav stack-sm">
          <Button size="sm" variant="ghost" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? '»' : '« Collapse'}
          </Button>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} title={link.label}>
              {collapsed ? link.icon : `${link.icon}  ${link.label}`}
            </NavLink>
          ))}
        </nav>
        <div className="stack">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
