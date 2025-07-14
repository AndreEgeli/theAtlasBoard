import { BoardUpdate } from "@/types";
import { BoardRepository } from "../repositories/BoardRepository";
import { supabase } from "@/lib/supabase";

export class BoardService {
  private boardRepo: BoardRepository;

  constructor() {
    this.boardRepo = new BoardRepository(supabase);
  }

  async getBoards() {
    // Get boards for the user's teams directly to avoid RLS issues
    const { data, error } = await supabase
      .from("boards")
      .select(
        `
        id,
        name,
        created_at,
        team_id,
        is_private,
        created_by
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
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

  async updateBoard(id: string, updates: Partial<BoardUpdate>) {
    return this.boardRepo.update(id, updates);
  }

  async deleteBoard(id: string) {
    await this.boardRepo.delete(id);
  }
}
