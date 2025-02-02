import { Board } from "@/types";
import { BoardRepository } from "../repositories/BoardRepository";
import { supabase } from "@/lib/supabase";

export class BoardService {
  private boardRepo: BoardRepository;

  constructor() {
    this.boardRepo = new BoardRepository(supabase);
  }

  async getBoards() {
    return this.boardRepo.findMany();
  }

  async getBoardDetails(boardId: string) {
    return this.boardRepo.findWithDetails(boardId);
  }

  async createBoard({ name, teamId }: { name: string; teamId: string }) {
    return this.boardRepo.create({
      name,
      team_id: teamId,
      created_by: (await supabase.auth.getUser()).data.user?.id!,
    });
  }

  async updateBoard(id: string, updates: Partial<Board>) {
    return this.boardRepo.update(id, updates);
  }

  async deleteBoard(id: string) {
    await this.boardRepo.delete(id);
  }
}
