import React from 'react';
import { 
  Home, 
  Code2, 
  RotateCw, 
  Settings, 
  FileText, 
  ChevronDown
} from 'lucide-react';

export default function Sidebar({ activeNav = 'Dashboard', setActiveNav }) {
  const navItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Webhooks', icon: Code2 },
    { name: 'Replays', icon: RotateCw },
    // { name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h3l3-7 4 14 3-7h7" />
              <circle cx="18" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">Webhook Replay</span>
            <span className="brand-subtitle">Dashboard</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveNav && setActiveNav(item.name)}
              >
                <Icon />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-bottom">
        {/* Need Help Card */}
        <div className="help-card">
          <div className="help-title">Need help?</div>
          <div className="help-links">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="help-link"
            >
              <FileText />
              <span>Documentation</span>
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="help-link"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-info-wrapper">
            <div className="user-avatar">JD</div>
            <div className="user-details">
              <span className="user-name">John Doe</span>
              <span className="user-email">john@example.com</span>
            </div>
          </div>
          <ChevronDown className="user-chevron" />
        </div>
      </div>
    </aside>
  );
}
