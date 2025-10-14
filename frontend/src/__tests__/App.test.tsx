import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';

describe('App', () => {
  it('renders the app with default dashboard route', () => {
    render(<App />);
    
    // Should render header
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    
    // Should render dashboard by default
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('navigates between routes correctly', () => {
    render(<App />);
    
    // Start on dashboard
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    
    // Navigate to tasks
    const tasksLinks = screen.getAllByRole('link', { name: '✅Tasks' });
    fireEvent.click(tasksLinks[0]);
    expect(screen.getByRole('heading', { name: /^tasks$/i })).toBeInTheDocument();
    
    // Navigate to calendar
    const calendarLinks = screen.getAllByRole('link', { name: '📅Calendar' });
    fireEvent.click(calendarLinks[0]);
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();
    
    // Navigate back to dashboard
    const dashboardLinks = screen.getAllByRole('link', { name: '📊Dashboard' });
    fireEvent.click(dashboardLinks[0]);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<App />);
    
    // Dashboard should be active initially
    const dashboardLinks = screen.getAllByRole('link', { name: '📊Dashboard' });
    expect(dashboardLinks[0]).toHaveClass('bg-blue-100', 'text-blue-700');
    
    // Navigate to tasks
    const tasksLinks = screen.getAllByRole('link', { name: '✅Tasks' });
    fireEvent.click(tasksLinks[0]);
    
    // Tasks should now be active
    const updatedTasksLinks = screen.getAllByRole('link', { name: '✅Tasks' });
    expect(updatedTasksLinks[0]).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('renders responsive layout', () => {
    const { container } = render(<App />);
    
    // Check that the layout has responsive classes
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    
    // Check mobile menu button container exists
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    const buttonContainer = menuButton.parentElement;
    expect(buttonContainer).toHaveClass('md:hidden');
  });

  it('works with mobile navigation', () => {
    render(<App />);
    
    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    // Mobile menu should be visible
    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toHaveClass('block');
    
    // Navigate using mobile menu
    const mobileTasksLink = mobileMenu?.querySelector('a[href="/tasks"]');
    if (mobileTasksLink) {
      fireEvent.click(mobileTasksLink);
      expect(screen.getByRole('heading', { name: /^tasks$/i })).toBeInTheDocument();
      // Mobile menu should close
      expect(mobileMenu).toHaveClass('hidden');
    }
  });
});