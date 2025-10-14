import { render, screen } from '@testing-library/react';
import { TasksPage } from '../TasksPage';

describe('TasksPage', () => {
  it('renders tasks page title', () => {
    render(<TasksPage />);
    
    expect(screen.getByRole('heading', { name: /tasks/i })).toBeInTheDocument();
  });

  it('renders add task button', () => {
    render(<TasksPage />);
    
    const addButton = screen.getByRole('button', { name: /add task/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });

  it('renders placeholder content', () => {
    render(<TasksPage />);
    
    expect(screen.getByText('Task Management')).toBeInTheDocument();
    expect(screen.getByText('Task management functionality will be implemented here.')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('applies correct responsive layout', () => {
    const { container } = render(<TasksPage />);
    
    const pageContainer = container.firstChild;
    expect(pageContainer).toHaveClass('space-y-6');
    
    const cardContainer = container.querySelector('.bg-white');
    expect(cardContainer).toHaveClass('shadow', 'rounded-lg', 'p-6');
  });
});