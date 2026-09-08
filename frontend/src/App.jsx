import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import WebhookTable from './components/WebhookTable';
import RecentReplaysTable from './components/RecentReplaysTable';
import WebhookDetails from './components/WebhookDetails';
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

    executeReplay,
    replaySubmitting,

    stats,
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
    await loadWebhooks(dateRange);
    showToast('Webhooks refreshed');
  };

  const handleTestWebhookCreated = () => {
    // Re-fetch the real data to pick up the newly ingested webhook
    loadWebhooks(dateRange);
    showToast('Webhook ingestion triggered — refreshing list');
  };

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
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onNewWebhookClick={() => setNewWebhookModalOpen(true)}
        />

        {/* 4 Summary Cards in One Row */}
        <SummaryCard stats={stats} />

        {/* Two-column Main Dashboard Layout */}
        <div className="content-grid">
          {/* Left Column: Recent Webhooks & Recent Replays */}
          <div className="content-left">
            <WebhookTable
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
              onSelectWebhookById={(whId) => {
                const target = webhooks.find(w => w.webhook_id === whId);
                if (target) selectWebhook(target);
              }}
              onSelectReplay={(rep) => {
                const target = webhooks.find(w => w.webhook_id === rep.webhook_id);
                if (target) selectWebhook(target);
              }}
            />

            {/* Centered Footer */}
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
