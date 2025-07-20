import { TaskRepository } from "../repositories/TaskRepository";
import { supabase } from "@/lib/supabase";
import type {
  Task,
  TaskInsert,
  TaskPosition,
  TodoItem,
  TodoItemInsert,
  TodoItemUpdate,
  Tag,
} from "@/types";

export class TaskService {
  private taskRepo: TaskRepository;

  constructor() {
    this.taskRepo = new TaskRepository(supabase);
  }

  async getTasks(boardId: string) {
    return this.taskRepo.findByBoard(boardId);
  }

  async createTask(
    boardId: string,
    task: Omit<TaskInsert, "id">
  ): Promise<TaskInsert> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    return this.taskRepo.create({
      ...task,
      board_id: boardId,
      created_by: userId,
    });
  }

  async updateTask(id: string, updates: Partial<Task>) {
    return this.taskRepo.update(id, updates);
  }

  async moveTask(id: string, position: TaskPosition) {
    return this.taskRepo.moveTask(id, position);
  }

  async deleteTask(id: string) {
    await this.taskRepo.delete(id);
  }

  // Task Assignees
  async assignUser(taskId: string, userId: string) {
    const assignedBy = (await supabase.auth.getUser()).data.user?.id!;
    return this.taskRepo.assignUser(taskId, userId, assignedBy);
  }

  async unassignUser(taskId: string, userId: string) {
    return this.taskRepo.unassignUser(taskId, userId);
  }

  // Task Todos
  async getTodos(taskId: string): Promise<TodoItem[]> {
    return this.taskRepo.getTodos(taskId);
  }

  async createTodo(taskId: string, todo: Omit<TodoItemInsert, "id">) {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    return this.taskRepo.createTodo(taskId, {
      ...todo,
      created_by: userId,
    });
  }

  async updateTodo(id: string, updates: Partial<TodoItemUpdate>) {
    return this.taskRepo.updateTodo(id, updates);
  }

  async deleteTodo(id: string) {
    await this.taskRepo.deleteTodo(id);
  }

  // Task Tags
  async addTag(taskId: string, tagId: string) {
    await this.taskRepo.addTag(taskId, tagId);
  }

  async removeTag(taskId: string, tagId: string) {
    await this.taskRepo.removeTag(taskId, tagId);
  }
}
