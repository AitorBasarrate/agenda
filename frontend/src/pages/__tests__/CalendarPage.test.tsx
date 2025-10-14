import { render, screen } from '@testing-library/react';
import { AppProvider } from '../../contexts';
import { CalendarPage } from '../CalendarPage';

const CalendarPageWithProvider = () => (
  <AppProvider>
    <CalendarPage />
  </AppProvider>
);

describe('CalendarPage', () => {
  it('renders calendar page title', () => {
    render(<CalendarPageWithProvider />);
    
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();
  });

  it('renders add event button', () => {
    render(<CalendarPageWithProvider />);
    
    const addButton = screen.getByRole('button', { name: /add event/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });

  it('renders calendar view component', () => {
    render(<CalendarPageWithProvider />);
    
    // The CalendarView component should be rendered
    // We can check for the loading text which is specific to the CalendarView component
    expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
  });

  it('applies correct layout classes', () => {
    const { container } = render(<CalendarPageWithProvider />);
    
    const pageContainer = container.firstChild;
    expect(pageContainer).toHaveClass('space-y-6');
  });
});