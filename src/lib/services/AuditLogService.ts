import { supabase } from "@/lib/supabase";
import { TeamRole, TeamPermissions } from "@/types";

/**
 * Types of audit events we track
 */
export type AuditEventType =
  | "permission_violation"
  | "permission_check"
  | "role_change"
  | "access_granted"
  | "access_denied"
  | "resource_access"
  | "bulk_permission_check";

/**
 * Severity levels for audit events
 */
export type AuditSeverity = "low" | "medium" | "high" | "critical";

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id?: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  user_id: string | null;
  resource_type: string; // "board", "task", "team", "todo", etc.
  resource_id: string | null;
  action: string; // "create", "edit", "delete", "view", etc.
  permission_required: keyof TeamPermissions | null;
  user_role: TeamRole | null;
  team_id: string | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

/**
 * Service for logging security and permission-related events
 * for audit trails and security monitoring
 */
export class AuditLogService {
  private logQueue: AuditLogEntry[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start the periodic flush timer
    this.startPeriodicFlush();
  }

  /**
   * Start periodic flushing of log entries
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop periodic flushing (for cleanup)
   */
  public stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get client IP address and user agent from request context
   * In a real application, this would be passed from the request
   */
  private getClientInfo(): {
    ip_address: string | null;
    user_agent: string | null;
  } {
    // In browser environment, we can't get real IP, but we can get user agent
    return {
      ip_address: null, // Would be populated server-side
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
  }

  /**
   * Log a permission violation event
   */
  async logPermissionViolation(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    requiredPermission: keyof TeamPermissions,
    userRole: TeamRole | null,
    teamId: string | null,
    errorMessage: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const clientInfo = this.getClientInfo();

    const entry: AuditLogEntry = {
      event_type: "permission_violation",
      severity: "high",
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      permission_required: requiredPermission,
      user_role: userRole,
      team_id: teamId,
      success: false,
      error_message: errorMessage,
      metadata: metadata || null,
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      timestamp: new Date().toISOString(),
    };

    this.queueLogEntry(entry);
  }

  /**
   * Log a successful permission check
   */
  async logPermissionGranted(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    requiredPermission: keyof TeamPermissions,
    userRole: TeamRole,
    teamId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const clientInfo = this.getClientInfo();

    const entry: AuditLogEntry = {
      event_type: "access_granted",
      severity: "low",
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      permission_required: requiredPermission,
      user_role: userRole,
      team_id: teamId,
      success: true,
      error_message: null,
      metadata: metadata || null,
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      timestamp: new Date().toISOString(),
    };

    this.queueLogEntry(entry);
  }

  /**
   * Log a role change event
   */
  async logRoleChange(
    adminUserId: string,
    targetUserId: string,
    teamId: string,
    oldRole: TeamRole | null,
    newRole: TeamRole,
    metadata?: Record<string, any>
  ): Promise<void> {
    const clientInfo = this.getClientInfo();

    const entry: AuditLogEntry = {
      event_type: "role_change",
      severity: "medium",
      user_id: adminUserId,
      resource_type: "team_member",
      resource_id: targetUserId,
      action: "role_update",
      permission_required: null,
      user_role: null,
      team_id: teamId,
      success: true,
      error_message: null,
      metadata: {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole,
        ...metadata,
      },
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      timestamp: new Date().toISOString(),
    };

    this.queueLogEntry(entry);
  }

  /**
   * Log bulk permission checks (for performance monitoring)
   */
  async logBulkPermissionCheck(
    userId: string,
    resourceType: string,
    resourceCount: number,
    teamIds: string[],
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const clientInfo = this.getClientInfo();

    const entry: AuditLogEntry = {
      event_type: "bulk_permission_check",
      severity: "low",
      user_id: userId,
      resource_type: resourceType,
      resource_id: null,
      action: "bulk_check",
      permission_required: null,
      user_role: null,
      team_id: teamIds.length === 1 ? teamIds[0] : null,
      success: true,
      error_message: null,
      metadata: {
        resource_count: resourceCount,
        team_ids: teamIds,
        duration_ms: duration,
        ...metadata,
      },
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      timestamp: new Date().toISOString(),
    };

    this.queueLogEntry(entry);
  }

  /**
   * Log resource access event
   */
  async logResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    success: boolean,
    teamId?: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const clientInfo = this.getClientInfo();

    const entry: AuditLogEntry = {
      event_type: "resource_access",
      severity: success ? "low" : "medium",
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      permission_required: null,
      user_role: null,
      team_id: teamId || null,
      success,
      error_message: errorMessage || null,
      metadata: metadata || null,
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      timestamp: new Date().toISOString(),
    };

    this.queueLogEntry(entry);
  }

  /**
   * Add log entry to queue for batch processing
   */
  private queueLogEntry(entry: AuditLogEntry): void {
    this.logQueue.push(entry);

    // If queue is full, flush immediately
    if (this.logQueue.length >= this.BATCH_SIZE) {
      this.flushLogs();
    }
  }

  /**
   * Flush queued log entries to database
   */
  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const entriesToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      // In a real application, you would insert these into an audit_logs table
      // For now, we'll log to console in development and could send to external service
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
      ) {
        console.group("🔍 Audit Log Batch");
        entriesToFlush.forEach((entry) => {
          const severity = entry.severity.toUpperCase();
          const icon = entry.success ? "✅" : "❌";
          console.log(
            `${icon} [${severity}] ${entry.event_type}: ${entry.action} on ${entry.resource_type}`,
            {
              user: entry.user_id,
              resource: entry.resource_id,
              team: entry.team_id,
              role: entry.user_role,
              permission: entry.permission_required,
              error: entry.error_message,
              metadata: entry.metadata,
            }
          );
        });
        console.groupEnd();
      }

      // TODO: In production, insert into audit_logs table
      // const { error } = await supabase
      //   .from('audit_logs')
      //   .insert(entriesToFlush);

      // if (error) {
      //   console.error('Failed to insert audit logs:', error);
      //   // Re-queue failed entries for retry
      //   this.logQueue.unshift(...entriesToFlush);
      // }
    } catch (error) {
      console.error("Error flushing audit logs:", error);
      // Re-queue failed entries for retry
      this.logQueue.unshift(...entriesToFlush);
    }
  }

  /**
   * Force flush all queued logs immediately
   */
  async forceFlush(): Promise<void> {
    await this.flushLogs();
  }

  /**
   * Get audit log statistics
   */
  getStats(): {
    queuedEntries: number;
    isFlushTimerActive: boolean;
  } {
    return {
      queuedEntries: this.logQueue.length,
      isFlushTimerActive: this.flushTimer !== null,
    };
  }

  /**
   * Query audit logs for a specific user
   * This would be implemented when we have the audit_logs table
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    // TODO: Implement when audit_logs table exists
    // const { data, error } = await supabase
    //   .from('audit_logs')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('timestamp', { ascending: false })
    //   .range(offset, offset + limit - 1);

    // if (error) throw error;
    // return data || [];

    return [];
  }

  /**
   * Query audit logs for security violations
   */
  async getSecurityViolations(
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    // TODO: Implement when audit_logs table exists
    // const { data, error } = await supabase
    //   .from('audit_logs')
    //   .select('*')
    //   .in('event_type', ['permission_violation', 'access_denied'])
    //   .in('severity', ['high', 'critical'])
    //   .order('timestamp', { ascending: false })
    //   .range(offset, offset + limit - 1);

    // if (error) throw error;
    // return data || [];

    return [];
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
