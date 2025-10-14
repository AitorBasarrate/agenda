import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';

const LayoutWithRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Layout>{children}</Layout>
  </BrowserRouter>
);

describe('Layout', () => {
  it('renders header and main content', () => {
    render(
      <LayoutWithRouter>
        <div data-testid="test-content">Test Content</div>
      </LayoutWithRouter>
    );
    
    // Header should be present
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    
    // Main content should be rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct responsive classes', () => {
    const { container } = render(
      <LayoutWithRouter>
        <div>Content</div>
      </LayoutWithRouter>
    );
    
    // Check main container classes
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass(
      'max-w-7xl',
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:px-8',
      'py-6'
    );
    
    // Check root div classes
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('min-h-screen', 'bg-gray-50');
  });

  it('renders children correctly', () => {
    render(
      <LayoutWithRouter>
        <h1>Page Title</h1>
        <p>Page content</p>
      </LayoutWithRouter>
    );
    
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });
});