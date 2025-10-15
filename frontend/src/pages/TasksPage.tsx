import { PageHeader } from '../components/PageHeader';

export function TasksPage() {
  return (
    <div>
      <PageHeader title="Tasks">
        <button className="flex items-center space-x-3 px-4 py-3 bg-emerald-mint/50 rounded-lg text-lg font-medium shadow-md transition-all duration-200 ease-in-out text-truffle-gray hover:bg-emerald-mint hover:text-forest-noir transform hover:scale-[1.02] hover:shadow-truffle-gray/20">
          Add Task
        </button>
      </PageHeader>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task Management</h3>
          <p className="text-gray-500">
            Task management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}