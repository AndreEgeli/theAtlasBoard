import { TodoRepository } from "../repositories/TodoRepository";
import { supabase } from "@/lib/supabase";
import type { TodoItem } from "@/types";

export class TodoService {
  private todoRepo: TodoRepository;

  constructor() {
    this.todoRepo = new TodoRepository(supabase);
  }

  async getTodos(taskId: string) {
    return this.todoRepo.getByTaskId(taskId);
  }

  async createTodo(taskId: string, todo: Omit<TodoItem, "id">) {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    return this.todoRepo.create({
      task_id: taskId,
      title: todo.title,
      is_completed: todo.is_completed ?? false,
      created_by: userId,
    });
  }

  async updateTodo(id: string, updates: Partial<TodoItem>) {
    return this.todoRepo.update(id, updates);
  }

  async deleteTodo(id: string) {
    await this.todoRepo.delete(id);
  }
}
