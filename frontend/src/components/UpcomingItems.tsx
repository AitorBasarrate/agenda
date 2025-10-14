import { useDashboardContext } from '../contexts/DashboardContext';
import type { Task, Event } from '../types/api';

interface UpcomingItemProps {
  item: Task | Event;
  type: 'task' | 'event';
}

function UpcomingItem({ item, type }: UpcomingItemProps) {
  const isTask = type === 'task';
  const task = isTask ? (item as Task) : null;
  const event = !isTask ? (item as Event) : null;

  const getDateDisplay = () => {
    if (isTask && task?.due_date) {
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600', bgColor: 'bg-red-50' };
      } else if (diffDays === 0) {
        return { text: 'Due today', color: 'text-orange-600', bgColor: 'bg-orange-50' };
      } else if (diffDays === 1) {
        return { text: 'Due tomorrow', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
      } else {
        return { text: `Due in ${diffDays} days`, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      }
    }
    
    if (!isTask && event) {
      const startTime = new Date(event.start_time);
      const now = new Date();
      const diffTime = startTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: 'Past event', color: 'text-gray-600', bgColor: 'bg-gray-50' };
      } else if (diffDays === 0) {
        return { text: 'Today', color: 'text-green-600', bgColor: 'bg-green-50' };
      } else if (diffDays === 1) {
        return { text: 'Tomorrow', color: 'text-blue-600', bgColor: 'bg-blue-50' };
      } else {
        return { text: `In ${diffDays} days`, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      }
    }
    
    return { text: 'No date', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  };

  const dateInfo = getDateDisplay();

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 flex-1">
        {/* Type Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isTask ? 'bg-blue-100' : 'bg-green-100'
        }`}>
          {isTask ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0V7a4 4 0 118 0v4z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
            {isTask && task?.status === 'completed' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-gray-500 truncate mt-1">{item.description}</p>
          )}
          {!isTask && event && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* Date Badge */}
      <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${dateInfo.color} ${dateInfo.bgColor}`}>
        {dateInfo.text}
      </div>
    </div>
  );
}

export function UpcomingItems() {
  const { upcomingTasks, upcomingEvents, loading, error, loadUpcomingItems } = useDashboardContext();

  // Combine and sort items by date
  const allItems = [
    ...upcomingTasks.map(task => ({ item: task, type: 'task' as const, sortDate: task.due_date })),
    ...upcomingEvents.map(event => ({ item: event, type: 'event' as const, sortDate: event.start_time }))
  ]
    .filter(({ sortDate }) => sortDate) // Only include items with dates
    .sort((a, b) => new Date(a.sortDate!).getTime() - new Date(b.sortDate!).getTime())
    .slice(0, 10); // Show only next 10 items

  const handleLoadMore = () => {
    loadUpcomingItems({ days: 30, limit: 20 });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Items</h3>
          <span className="text-sm text-gray-500">
            {allItems.length} item{allItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleLoadMore}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && allItems.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No upcoming items</h4>
            <p className="text-gray-500">You're all caught up! Create a new task or event to get started.</p>
          </div>
        )}

        {!loading && !error && allItems.length > 0 && (
          <div className="space-y-3">
            {allItems.map(({ item, type }, index) => (
              <UpcomingItem key={`${type}-${item.id}-${index}`} item={item} type={type} />
            ))}
            
            {allItems.length >= 10 && (
              <div className="pt-4 text-center">
                <button
                  onClick={handleLoadMore}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Load more items
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}