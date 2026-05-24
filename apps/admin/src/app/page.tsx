import { AppLayout } from '@/components/AppLayout'
import { PageHead } from '@/components/ui/PageHead'
import { Card } from '@/components/ui/Card'
import styles from './page.module.css'

export default function DashboardPage() {
  return (
    <AppLayout>
      <PageHead
        title="Compliance overview"
        sub="Your workspace"
      />

      {/* KPI strip */}
      <Card flush>
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Compliance score</div>
            <div className={styles.kpiValue}>—</div>
            <div className={styles.kpiSub}>No data yet</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Open findings</div>
            <div className={styles.kpiValue}>0</div>
            <div className={styles.kpiSub}>No data yet</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Audits this month</div>
            <div className={styles.kpiValue}>0</div>
            <div className={styles.kpiSub}>No data yet</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLabel}>Locations at risk</div>
            <div className={styles.kpiValue}>0</div>
            <div className={styles.kpiSub}>No data yet</div>
          </div>
        </div>
      </Card>

      <div className={styles.grid}>
        {/* Upcoming audits */}
        <Card header={{ title: 'Upcoming audits', meta: 'Next 30 days' }}>
          <div className={styles.emptyState}>No audits scheduled</div>
        </Card>

        <div className={styles.stack}>
          {/* Findings by severity */}
          <Card header={{ title: 'Findings by severity', meta: 'Open · YTD' }}>
            <div className={styles.emptyState}>No findings</div>
          </Card>

          {/* Region scorecard */}
          <Card header={{ title: 'Region scorecard', meta: 'Weighted' }}>
            <div className={styles.emptyState}>No regions</div>
          </Card>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ marginTop: 14 }}>
        <Card header={{ title: 'Recent activity', meta: 'All events' }}>
          <div className={styles.emptyState}>No recent activity</div>
        </Card>
      </div>
    </AppLayout>
  )
}
