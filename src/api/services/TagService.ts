import { TagRepository } from "../repositories/TagRepository";
import { supabase } from "@/lib/supabase";
import type { Tag, TagInsert } from "@/types";

export class TagService {
  private tagRepo: TagRepository;

  constructor() {
    this.tagRepo = new TagRepository(supabase);
  }

  async getTags(organizationId: string): Promise<Tag[]> {
    return this.tagRepo.findByOrganization(organizationId);
  }

  async createTag(tag: Omit<TagInsert, "id">) {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    return this.tagRepo.create({
      ...tag,
      created_by: userId,
    });
  }

  async deleteTag(id: string) {
    await this.tagRepo.delete(id);
  }
}
