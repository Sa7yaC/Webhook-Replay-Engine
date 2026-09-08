import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Plus, Check } from 'lucide-react';

export default function Header({ dateRange = 'Today', onDateRangeChange, onNewWebhookClick }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const ranges = ['Today', 'Last 24 hours', 'Last 7 days', 'Last 30 days', 'All time'];

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
        <h1 className="header-title">Dashboard</h1>
        <p className="header-subtitle">Monitor and replay your webhooks</p>
      </div>

      <div className="header-actions">
        {/* Date Filter Dropdown matching reference image */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className="btn-secondary" 
            onClick={() => setShowDropdown(!showDropdown)}
            title="Filter by date range"
            type="button"
          >
            <Calendar size={15} color="#64748b" />
            <span>{dateRange}</span>
            <ChevronDown size={14} color="#64748b" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {showDropdown && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '6px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
                zIndex: 50,
                width: '150px',
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
                      color: isSelected ? '#4f46e5' : '#334155',
                      backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>{range}</span>
                    {isSelected && <Check size={14} color="#4f46e5" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* New Webhook ID Trigger */}
        <button 
          className="btn-primary" 
          onClick={onNewWebhookClick}
          title="Create or test a new Webhook ID"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Webhook ID</span>
        </button>
      </div>
    </header>
  );
}
