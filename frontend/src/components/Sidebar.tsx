import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
];

const isActive = (href: string, currentLocation: string) => {
  if (href === '/') {
    return currentLocation === '/';
  }
  return currentLocation.startsWith(href);
};

export function Sidebar() {
  const location = useLocation();

  return (
    <div className='my-8 ml-8 p-2 rounded-lg'>
    <div className="flex flex-col h-full w-64 bg-soft-white rounded-lg shadow-lg text-forest-noir">
      <div className="flex items-center justify-center h-20 border-b border-deep-violet/10">
        <Link to="/" className="flex items-center space-x-3 px-4">
          <span className="text-3xl">📋</span>
          <span className="text-2xl font-bold">
            Agenda
          </span>
        </Link>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-lg font-medium shadow-md transition-all duration-200 ease-in-out ${
              isActive(item.href, location.pathname)
                ? 'bg-emerald-mint text-forest-noir shadow-emerald-mint/25'
                : 'text-truffle-gray hover:bg-rose-clay/20 hover:text-forest-noir transform hover:scale-[1.02] hover:shadow-truffle-gray/20'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
    </div>
  );
}