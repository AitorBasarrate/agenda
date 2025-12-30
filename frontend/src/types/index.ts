export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}
