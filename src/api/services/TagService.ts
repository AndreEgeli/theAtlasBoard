import { TagRepository } from "../repositories/TagRepository";
import { supabase } from "@/lib/supabase";
import type { Tag } from "@/types";

export class TagService {
  private tagRepo: TagRepository;

  constructor() {
    this.tagRepo = new TagRepository(supabase);
  }

  async getTags(organizationId: string) {
    return this.tagRepo.findByOrganization(organizationId);
  }

  async createTag(tag: Omit<Tag, "id">) {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    return this.tagRepo.create({
      ...tag,
      created_by: userId,
    });
  }

  async deleteTag(id: string) {
    await this.tagRepo.delete(id);
  }

  async addTagToTask(taskId: string, tagId: string) {
    await this.tagRepo.addToTask(taskId, tagId);
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    await this.tagRepo.removeFromTask(taskId, tagId);
  }
}
