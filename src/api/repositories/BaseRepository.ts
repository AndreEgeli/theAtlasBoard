import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Generic type for database tables
export type TableRecord<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export class BaseRepository<
  T extends keyof Database["public"]["Tables"],
  Record = TableRecord<T>,
  Insert = TableInsert<T>,
  Update = TableUpdate<T>
> {
  constructor(
    protected supabase: SupabaseClient<Database>,
    protected table: T
  ) {}

  async findOne(id: string): Promise<Record | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select()
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Record;
  }

  async findMany(query?: Partial<Record>): Promise<Record[]> {
    let builder = this.supabase.from(this.table).select();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        builder = builder.eq(key, value);
      });
    }

    const { data, error } = await builder;
    if (error) throw error;
    return data as Record[];
  }

  async create(data: Insert): Promise<Record> {
    const { data: created, error } = await this.supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created as Record;
  }

  async update(id: string, data: Partial<Update>): Promise<Record> {
    const { data: updated, error } = await this.supabase
      .from(this.table)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated as Record;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
