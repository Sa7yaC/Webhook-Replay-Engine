import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  SourceCodeIcon,
  ReloadIcon,
  File01Icon,
  GithubIcon,
  ChevronDownIcon
} from '@hugeicons/core-free-icons';
import hookpalLogo from '../assets/hookpal-logo.png';

export default function Sidebar({ activeNav = 'Dashboard', setActiveNav }) {
  const navItems = [
    { name: 'Dashboard', icon: Home01Icon },
    { name: 'Webhooks', icon: SourceCodeIcon },
    { name: 'Replays', icon: ReloadIcon },
    // { name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Brand Header with Logo */}
        <div className="brand-header">
          <img src={hookpalLogo} alt="HookPal" className="brand-logo" />
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveNav && setActiveNav(item.name)}
              >
                <HugeiconsIcon icon={item.icon} size={18} strokeWidth={2} />
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
              <HugeiconsIcon icon={File01Icon} size={15} strokeWidth={2} />
              <span>Documentation</span>
            </a>
            <a
              href="https://github.com/Sa7yaC/Webhook-Replay-Engine"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              <HugeiconsIcon icon={GithubIcon} size={15} strokeWidth={2} />
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
          <HugeiconsIcon icon={ChevronDownIcon} size={16} strokeWidth={2} className="user-chevron" />
        </div>
      </div>
    </aside>
  );
}
