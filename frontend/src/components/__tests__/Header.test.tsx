import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Header } from '../Header';

// Mock useLocation
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
  };
});

const HeaderWithRouter = () => (
  <BrowserRouter>
    <Header />
  </BrowserRouter>
);

describe('Header', () => {
  beforeEach(() => {
    mockLocation.pathname = '/';
  });

  it('renders the logo and app name', () => {
    render(<HeaderWithRouter />);
    
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<HeaderWithRouter />);
    
    expect(screen.getAllByText('Dashboard')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('Tasks')).toHaveLength(2);
    expect(screen.getAllByText('Calendar')).toHaveLength(2);
  });

  it('highlights active navigation item', () => {
    render(<HeaderWithRouter />);
    
    const dashboardLinks = screen.getAllByRole('link', { name: '📊Dashboard' });
    // Both desktop and mobile links should be active
    expect(dashboardLinks[0]).toHaveClass('bg-blue-100', 'text-blue-700');
    expect(dashboardLinks[1]).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('shows mobile menu button container on small screens', () => {
    render(<HeaderWithRouter />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(menuButton).toBeInTheDocument();
    
    // Check the parent div has the responsive class
    const buttonContainer = menuButton.parentElement;
    expect(buttonContainer).toHaveClass('md:hidden');
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<HeaderWithRouter />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    const mobileMenu = document.getElementById('mobile-menu');
    
    // Initially hidden
    expect(mobileMenu).toHaveClass('hidden');
    
    // Click to open
    fireEvent.click(menuButton);
    expect(mobileMenu).toHaveClass('block');
    
    // Click to close
    fireEvent.click(menuButton);
    expect(mobileMenu).toHaveClass('hidden');
  });

  it('closes mobile menu when navigation link is clicked', () => {
    render(<HeaderWithRouter />);
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toHaveClass('block');
    
    // Click on a mobile navigation link
    const mobileTasksLink = mobileMenu?.querySelector('a[href="/tasks"]');
    if (mobileTasksLink) {
      fireEvent.click(mobileTasksLink);
      // Mobile menu should close
      expect(mobileMenu).toHaveClass('hidden');
    }
  });

  it('applies correct styling for different screen sizes', () => {
    render(<HeaderWithRouter />);
    
    // Desktop navigation should be hidden on mobile
    const desktopNav = screen.getByRole('navigation');
    expect(desktopNav).toHaveClass('hidden', 'md:flex');
    
    // Mobile menu button container should be hidden on desktop
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    const buttonContainer = menuButton.parentElement;
    expect(buttonContainer).toHaveClass('md:hidden');
  });
});