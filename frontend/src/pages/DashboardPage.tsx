import { Dashboard } from '../components/Dashboard';
import { PageHeader } from '../components/PageHeader';

export function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" />
      <Dashboard />
    </div>
  );
}