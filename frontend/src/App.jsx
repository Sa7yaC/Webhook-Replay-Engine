import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import WebhookTable from './components/WebhookTable';
import RecentReplaysTable from './components/RecentReplaysTable';
import ReplaysTable from './components/ReplaysTable';
import WebhookDetails from './components/WebhookDetails';
import SettingsView from './components/SettingsView';
import ReplayModal from './components/ReplayModal';
import NewWebhookModal from './components/NewWebhookModal';
import Toast from './components/Toast';
import useWebhooks from './hooks/useWebhooks';

import './App.css';

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [dateRange, setDateRange] = useState('Today');
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [replayTargetWebhook, setReplayTargetWebhook] = useState(null);
  const [newWebhookModalOpen, setNewWebhookModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  // Central data hook — all API state lives here
  const {
    webhooks,
    webhookCount,
    listLoading,
    listError,
    loadWebhooks,

    selectedWebhook,
    detailLoading,
    detailError,
    selectWebhook,

    replays,
    replaysLoading,
    replaysError,

    allReplays,
    allReplaysLoading,
    loadAllReplays,

    executeReplay,
    replaySubmitting,

    stats,
    replayStats,
  } = useWebhooks(dateRange);

  // ---- Handlers -------------------------------------------------------

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    selectWebhook(null);
  };

  const handleSelectWebhook = (webhook) => {
    selectWebhook(webhook);
  };

  const handleOpenReplayModal = (webhook) => {
    setReplayTargetWebhook(webhook || selectedWebhook);
    setReplayModalOpen(true);
  };

  const handleReplaySuccess = (replayResult) => {
    showToast(
      replayResult.success
        ? `Replay succeeded (${replayResult.status_code})`
        : `Replay failed (${replayResult.status_code})`
    );
  };

  const handleRefresh = async () => {
    await Promise.allSettled([
      loadWebhooks(dateRange),
      loadAllReplays(dateRange)
    ]);
    showToast('Data refreshed');
  };

  const handleTestWebhookCreated = () => {
    // Re-fetch the real data to pick up the newly ingested webhook
    loadWebhooks(dateRange);
    loadAllReplays(dateRange);
    showToast('Webhook ingestion triggered — refreshing list');
  };

  const handleSelectWebhookFromReplay = (whId) => {
    setActiveNav('Webhooks');
    const target = webhooks.find(w => w.webhook_id === whId) || { webhook_id: whId, id: whId };
    selectWebhook(target);
  };

  // Header metadata based on current active nav
  const getHeaderMeta = () => {
    switch (activeNav) {
      case 'Webhooks':
        return {
          title: 'Webhooks',
          subtitle: 'All captured webhook requests and payload inspection',
          showDateFilter: true,
        };
      case 'Replays':
        return {
          title: 'Replays',
          subtitle: 'Historical record of all webhook replay dispatches',
          showDateFilter: true,
        };
      /*
      case 'Settings':
        return {
          title: 'Settings',
          subtitle: 'System configurations and endpoint security policies',
          showDateFilter: false,
        };
      */
      case 'Dashboard':
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Monitor and replay your webhooks',
          showDateFilter: true,
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="app-container">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main Dashboard Content */}
      <main className="main-wrapper">
        {/* Top Header */}
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          showDateFilter={headerMeta.showDateFilter}
          onNewWebhookClick={() => setNewWebhookModalOpen(true)}
        />

        {/* 1. DASHBOARD VIEW */}
        {activeNav === 'Dashboard' && (
          <>
            <SummaryCard stats={stats} type="webhooks" />

            <div className="content-grid">
              {/* Left Column: Recent Webhooks & Recent Replays */}
              <div className="content-left">
                <WebhookTable
                  title="Recent Webhooks"
                  webhooks={webhooks}
                  dateRange={dateRange}
                  selectedWebhook={selectedWebhook}
                  onSelectWebhook={handleSelectWebhook}
                  onReplayClick={handleOpenReplayModal}
                  onRefresh={handleRefresh}
                  isRefreshing={listLoading}
                  isLoading={listLoading}
                  error={listError}
                  onCopyText={(text, msg) => showToast(msg)}
                />

                <RecentReplaysTable
                  replays={allReplays}
                  isLoading={allReplaysLoading}
                  onSelectWebhookById={handleSelectWebhookFromReplay}
                  onSelectReplay={(rep) => {
                    const target = webhooks.find(w => w.webhook_id === rep.webhook_id);
                    if (target) selectWebhook(target);
                  }}
                />

                <footer className="app-footer">
                  &copy; 2025 Webhook Replay. All rights reserved.
                </footer>
              </div>

              {/* Right Column: Webhook Details Panel */}
              <div className="content-right">
                <WebhookDetails
                  webhook={selectedWebhook}
                  replays={replays}
                  isLoading={detailLoading}
                  error={detailError}
                  replaysLoading={replaysLoading}
                  replaysError={replaysError}
                  onClose={() => selectWebhook(null)}
                  onReplayClick={handleOpenReplayModal}
                  onCopyText={(text, msg) => showToast(msg)}
                />
              </div>
            </div>
          </>
        )}

        {/* 2. WEBHOOKS VIEW */}
        {activeNav === 'Webhooks' && (
          <>
            {selectedWebhook ? (
              <div className="content-grid">
                <div className="content-left">
                  <WebhookTable
                    title="All Captured Webhooks"
                    webhooks={webhooks}
                    dateRange={dateRange}
                    selectedWebhook={selectedWebhook}
                    onSelectWebhook={handleSelectWebhook}
                    onReplayClick={handleOpenReplayModal}
                    onRefresh={handleRefresh}
                    isRefreshing={listLoading}
                    isLoading={listLoading}
                    error={listError}
                    onCopyText={(text, msg) => showToast(msg)}
                  />
                  <footer className="app-footer">
                    &copy; 2025 Webhook Replay. All rights reserved.
                  </footer>
                </div>
                <div className="content-right">
                  <WebhookDetails
                    webhook={selectedWebhook}
                    replays={replays}
                    isLoading={detailLoading}
                    error={detailError}
                    replaysLoading={replaysLoading}
                    replaysError={replaysError}
                    onClose={() => selectWebhook(null)}
                    onReplayClick={handleOpenReplayModal}
                    onCopyText={(text, msg) => showToast(msg)}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <WebhookTable
                  title="All Captured Webhooks"
                  webhooks={webhooks}
                  dateRange={dateRange}
                  selectedWebhook={selectedWebhook}
                  onSelectWebhook={handleSelectWebhook}
                  onReplayClick={handleOpenReplayModal}
                  onRefresh={handleRefresh}
                  isRefreshing={listLoading}
                  isLoading={listLoading}
                  error={listError}
                  onCopyText={(text, msg) => showToast(msg)}
                />
                <footer className="app-footer">
                  &copy; 2025 Webhook Replay. All rights reserved.
                </footer>
              </div>
            )}
          </>
        )}

        {/* 3. REPLAYS VIEW */}
        {activeNav === 'Replays' && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ReplaysTable
              replays={allReplays}
              dateRange={dateRange}
              isLoading={allReplaysLoading}
              isRefreshing={allReplaysLoading}
              onRefresh={handleRefresh}
              onSelectWebhookById={handleSelectWebhookFromReplay}
              onReplayClick={handleOpenReplayModal}
              onCopyText={(text, msg) => showToast(msg)}
            />

            <footer className="app-footer">
              &copy; 2025 Webhook Replay. All rights reserved.
            </footer>
          </div>
        )}

        {/* 4. SETTINGS VIEW (temporarily commented out) */}
        {/* activeNav === 'Settings' && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SettingsView onCopyText={(text, msg) => showToast(msg)} />

            <footer className="app-footer">
              &copy; 2025 Webhook Replay. All rights reserved.
            </footer>
          </div>
        ) */}
      </main>

      {/* Modals & Feedback */}
      <ReplayModal
        isOpen={replayModalOpen}
        webhook={replayTargetWebhook || selectedWebhook}
        onClose={() => {
          setReplayModalOpen(false);
          setReplayTargetWebhook(null);
        }}
        onReplaySuccess={handleReplaySuccess}
        executeReplay={executeReplay}
        isSubmitting={replaySubmitting}
      />

      <NewWebhookModal
        isOpen={newWebhookModalOpen}
        onClose={() => setNewWebhookModalOpen(false)}
        onTestWebhookCreated={handleTestWebhookCreated}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
      />
    </div>
  );
}
