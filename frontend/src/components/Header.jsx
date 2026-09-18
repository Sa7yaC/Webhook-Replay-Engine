import React, { useState, useRef, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar01Icon,
  ChevronDownIcon,
  Add01Icon,
  CheckIcon
} from '@hugeicons/core-free-icons';

export default function Header({ 
  title = 'Dashboard', 
  subtitle = 'Monitor and replay your webhooks', 
  dateRange = '7 Days', 
  onDateRangeChange, 
  onNewWebhookClick,
  showDateFilter = true
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const ranges = ['1 Day', '7 Days', '30 Days'];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="main-header">
      <div>
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Date Filter Dropdown matching reference image */}
        {showDateFilter && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
              className="btn-secondary" 
              onClick={() => setShowDropdown(!showDropdown)}
              title="Filter by date range"
              type="button"
            >
              <HugeiconsIcon icon={Calendar01Icon} size={15} color="#8E8E93" strokeWidth={2} />
              <span>{dateRange}</span>
              <HugeiconsIcon icon={ChevronDownIcon} size={14} color="#8E8E93" strokeWidth={2} style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>

          {showDropdown && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '6px',
                background: '#FFFFFF',
                border: '1px solid #E6E6E6',
                borderRadius: '8px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
                zIndex: 50,
                width: '155px',
                padding: '4px'
              }}
            >
              {ranges.map(range => {
                const isSelected = dateRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    className={`dropdown-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onDateRangeChange?.(range);
                      setShowDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#002FFF' : '#111111',
                      backgroundColor: isSelected ? 'rgba(0, 47, 255, 0.08)' : 'transparent',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>{range}</span>
                    {isSelected && <HugeiconsIcon icon={CheckIcon} size={14} color="#002FFF" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

        {/* New Webhook ID Trigger */}
        <button 
          className="btn-primary" 
          onClick={onNewWebhookClick}
          title="Create or test a new Webhook ID"
        >
          <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2.5} />
          <span>New Webhook ID</span>
        </button>
      </div>
    </header>
  );
}
