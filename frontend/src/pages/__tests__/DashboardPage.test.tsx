import { render, screen } from '@testing-library/react';
import { AppProvider } from '../../contexts';
import { DashboardPage } from '../DashboardPage';

const DashboardPageWithProvider = () => (
  <AppProvider>
    <DashboardPage />
  </AppProvider>
);

describe('DashboardPage', () => {
  it('renders dashboard page title', () => {
    render(<DashboardPageWithProvider />);
    
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders dashboard component', () => {
    render(<DashboardPageWithProvider />);
    
    // The Dashboard component should be rendered
    // We can check for the loading text which is specific to the Dashboard component
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('applies correct layout classes', () => {
    const { container } = render(<DashboardPageWithProvider />);
    
    const pageContainer = container.firstChild;
    expect(pageContainer).toHaveClass('space-y-6');
  });
});