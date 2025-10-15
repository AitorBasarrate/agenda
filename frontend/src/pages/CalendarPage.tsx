import { CalendarView } from '../components/CalendarView';
import { PageHeader } from '../components/PageHeader';

export function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar">
        <button className="flex items-center space-x-3 px-4 py-3 bg-emerald-mint/50 rounded-lg text-lg font-medium shadow-md transition-all duration-200 ease-in-out text-truffle-gray hover:bg-emerald-mint hover:text-forest-noir transform hover:scale-[1.02] hover:shadow-truffle-gray/20">
          Add Event
        </button>
      </PageHeader>
      <CalendarView />
    </div>
  );
}