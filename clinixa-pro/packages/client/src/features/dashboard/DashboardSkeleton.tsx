export function DashboardSkeleton() {
  return (
    <div className="dashboard-page dashboard-skeleton" aria-busy="true" aria-label="Loading dashboard">
      {/* Header Skeleton */}
      <div className="page-head">
        <div className="stack" style={{ gap: '8px' }}>
          <div className="skeleton-box skeleton-title" />
          <div className="skeleton-box skeleton-sub" />
        </div>
        <div className="page-actions">
          <div className="skeleton-box skeleton-btn" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="stat-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card glass skeleton-card">
            <div className="stat-top">
              <div className="skeleton-box skeleton-icon" />
              <div className="skeleton-box skeleton-label" />
            </div>
            <div className="stat-value" style={{ marginTop: '12px' }}>
              <div className="skeleton-box skeleton-num" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Card Skeleton */}
      <div className="table-card glass skeleton-table-card">
        <div className="card-head">
          <div className="skeleton-box skeleton-section-title" />
          <div className="skeleton-box skeleton-badge" />
        </div>

        <div className="skeleton-rows">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="skeleton-table-row">
              <div className="skeleton-box skeleton-cell cell-sm" />
              <div className="skeleton-box skeleton-cell cell-lg" />
              <div className="skeleton-box skeleton-cell cell-md" />
              <div className="skeleton-box skeleton-cell cell-pill" />
              <div className="skeleton-box skeleton-cell cell-btn" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
