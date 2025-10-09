import { useTaskContext, useEventContext, useDashboardContext } from '../contexts';

export function StateDemo() {
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError, 
    loadTasks, 
    createTask 
  } = useTaskContext();
  
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError, 
    loadEvents, 
    createEvent 
  } = useEventContext();
  
  const { 
    loading: dashboardLoading, 
    error: dashboardError, 
    loadDashboard,
    getSummary 
  } = useDashboardContext();

  const summary = getSummary();

  const handleCreateTask = async () => {
    await createTask({
      title: `Test Task ${Date.now()}`,
      description: 'Created from state demo',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    });
  };

  const handleCreateEvent = async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    await createEvent({
      title: `Test Event ${Date.now()}`,
      description: 'Created from state demo',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">State Management Demo</h1>
      
      {/* Dashboard Stats */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Dashboard Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.pendingTasksCount}</div>
            <div className="text-sm text-gray-600">Pending Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.overdueCount}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.upcomingCount}</div>
            <div className="text-sm text-gray-600">Upcoming Events</div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => loadDashboard()}
            disabled={dashboardLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {dashboardLoading ? 'Loading...' : 'Refresh Dashboard'}
          </button>
          {dashboardError && (
            <p className="mt-2 text-red-600">Error: {dashboardError}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tasks ({tasks.length})</h2>
          
          <div className="mb-4 space-x-2">
            <button
              onClick={() => loadTasks()}
              disabled={tasksLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {tasksLoading ? 'Loading...' : 'Load Tasks'}
            </button>
            <button
              onClick={handleCreateTask}
              disabled={tasksLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Create Task
            </button>
          </div>

          {tasksError && (
            <p className="mb-4 text-red-600">Error: {tasksError}</p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-gray-500 italic">No tasks loaded. Click "Load Tasks" to fetch data.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Events ({events.length})</h2>
          
          <div className="mb-4 space-x-2">
            <button
              onClick={() => loadEvents()}
              disabled={eventsLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {eventsLoading ? 'Loading...' : 'Load Events'}
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={eventsLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Create Event
            </button>
          </div>

          {eventsError && (
            <p className="mb-4 text-red-600">Error: {eventsError}</p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 italic">No events loaded. Click "Load Events" to fetch data.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}