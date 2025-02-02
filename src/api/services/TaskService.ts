import { TaskRepository } from "../repositories/TaskRepository";
import { supabase } from "@/lib/supabase";
import type { Task, TaskPosition } from "@/types";

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
    task: Omit<Task, "id" | "created_at" | "updated_at">
  ) {
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
}
