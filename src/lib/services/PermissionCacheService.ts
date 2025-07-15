import { TeamPermissions, TeamRole } from "@/types";

/**
 * Cache entry for user permissions
 */
interface PermissionCacheEntry {
  permissions: TeamPermissions | null;
  role: TeamRole | null;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Cache entry for team/board relationships
 */
interface ResourceCacheEntry {
  teamId: string | null;
  timestamp: number;
  ttl: number;
}

/**
 * Service for caching permission-related data to improve performance
 * and reduce database queries
 */
export class PermissionCacheService {
  private permissionCache = new Map<string, PermissionCacheEntry>();
  private resourceCache = new Map<string, ResourceCacheEntry>();

  // Cache TTL configurations (in milliseconds)
  private readonly PERMISSION_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RESOURCE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of entries

  /**
   * Generate cache key for user-team permissions
   */
  private getUserTeamKey(userId: string, teamId: string): string {
    return `user:${userId}:team:${teamId}`;
  }

  /**
   * Generate cache key for board-team relationships
   */
  private getBoardTeamKey(boardId: string): string {
    return `board:${boardId}:team`;
  }

  /**
   * Generate cache key for task-team relationships
   */
  private getTaskTeamKey(taskId: string): string {
    return `task:${taskId}:team`;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isEntryValid(
    entry: PermissionCacheEntry | ResourceCacheEntry
  ): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean up expired entries from cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    // Clean permission cache
    for (const [key, entry] of this.permissionCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.permissionCache.delete(key);
      }
    }

    // Clean resource cache
    for (const [key, entry] of this.resourceCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.resourceCache.delete(key);
      }
    }
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private enforceMaxCacheSize(): void {
    // If permission cache is too large, remove oldest entries
    if (this.permissionCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.permissionCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.permissionCache.delete(key));
    }

    // If resource cache is too large, remove oldest entries
    if (this.resourceCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.resourceCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.resourceCache.delete(key));
    }
  }

  /**
   * Get cached user permissions for a team
   */
  getUserTeamPermissions(
    userId: string,
    teamId: string
  ): { permissions: TeamPermissions | null; role: TeamRole | null } | null {
    const key = this.getUserTeamKey(userId, teamId);
    const entry = this.permissionCache.get(key);

    if (entry && this.isEntryValid(entry)) {
      return {
        permissions: entry.permissions,
        role: entry.role,
      };
    }

    return null;
  }

  /**
   * Cache user permissions for a team
   */
  setUserTeamPermissions(
    userId: string,
    teamId: string,
    permissions: TeamPermissions | null,
    role: TeamRole | null
  ): void {
    const key = this.getUserTeamKey(userId, teamId);

    this.permissionCache.set(key, {
      permissions,
      role,
      timestamp: Date.now(),
      ttl: this.PERMISSION_TTL,
    });

    // Periodic cleanup
    if (Math.random() < 0.1) {
      // 10% chance to trigger cleanup
      this.cleanupExpiredEntries();
      this.enforceMaxCacheSize();
    }
  }

  /**
   * Get cached team ID for a board
   */
  getBoardTeamId(boardId: string): string | null {
    const key = this.getBoardTeamKey(boardId);
    const entry = this.resourceCache.get(key);

    if (entry && this.isEntryValid(entry)) {
      return entry.teamId;
    }

    return null;
  }

  /**
   * Cache team ID for a board
   */
  setBoardTeamId(boardId: string, teamId: string | null): void {
    const key = this.getBoardTeamKey(boardId);

    this.resourceCache.set(key, {
      teamId,
      timestamp: Date.now(),
      ttl: this.RESOURCE_TTL,
    });
  }

  /**
   * Get cached team ID for a task
   */
  getTaskTeamId(taskId: string): string | null {
    const key = this.getTaskTeamKey(taskId);
    const entry = this.resourceCache.get(key);

    if (entry && this.isEntryValid(entry)) {
      return entry.teamId;
    }

    return null;
  }

  /**
   * Cache team ID for a task
   */
  setTaskTeamId(taskId: string, teamId: string | null): void {
    const key = this.getTaskTeamKey(taskId);

    this.resourceCache.set(key, {
      teamId,
      timestamp: Date.now(),
      ttl: this.RESOURCE_TTL,
    });
  }

  /**
   * Invalidate all cached permissions for a user
   */
  invalidateUserPermissions(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`user:${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.permissionCache.delete(key));
  }

  /**
   * Invalidate all cached permissions for a team
   */
  invalidateTeamPermissions(teamId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.permissionCache.keys()) {
      if (key.includes(`:team:${teamId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.permissionCache.delete(key));
  }

  /**
   * Invalidate cached team relationship for a board
   */
  invalidateBoardTeam(boardId: string): void {
    const key = this.getBoardTeamKey(boardId);
    this.resourceCache.delete(key);
  }

  /**
   * Invalidate cached team relationship for a task
   */
  invalidateTaskTeam(taskId: string): void {
    const key = this.getTaskTeamKey(taskId);
    this.resourceCache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.permissionCache.clear();
    this.resourceCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    permissionCacheSize: number;
    resourceCacheSize: number;
    totalSize: number;
  } {
    return {
      permissionCacheSize: this.permissionCache.size,
      resourceCacheSize: this.resourceCache.size,
      totalSize: this.permissionCache.size + this.resourceCache.size,
    };
  }

  /**
   * Batch invalidate permissions for multiple users
   * Useful when team roles change
   */
  batchInvalidateUserPermissions(userIds: string[]): void {
    const keysToDelete: string[] = [];

    for (const userId of userIds) {
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`user:${userId}:`)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach((key) => this.permissionCache.delete(key));
  }
}

// Export singleton instance
export const permissionCacheService = new PermissionCacheService();
