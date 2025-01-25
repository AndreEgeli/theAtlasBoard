export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  task_id: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  tags: string[];
  importance: "not critical" | "critical" | "super critical";
  timeframe: ">3 hours" | "> 1 day" | "> 1 week";
  status: "pending" | "started" | "in_review" | "completed" | "archived";
  todos: TodoItem[];
  order?: number;
}

export interface Board {
  id: string;
  name: string;
  tasks: Task[];
}

export interface CellPosition {
  importance: Task["importance"];
  timeframe: Task["timeframe"];
}
