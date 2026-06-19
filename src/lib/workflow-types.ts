export const TRIGGER_TYPES = {
  CONTACT_CREATED:            "contact.created",
  CONTACT_UPDATED:            "contact.updated",
  CONTACT_TAG_ADDED:          "contact.tag_added",
  CONTACT_TAG_REMOVED:        "contact.tag_removed",
  CONTACT_STAGE_CHANGED:      "contact.stage_changed",
  NOTE_ADDED:                 "contact.note_added",
  TASK_ADDED:                 "contact.task_added",
  TASK_COMPLETED:             "contact.task_completed",
  CUSTOM_FIELD_UPDATED:       "contact.custom_field_updated",
  EMAIL_SENT:                 "email.sent",
  EMAIL_OPENED:               "email.opened",
  EMAIL_CLICKED:              "email.clicked",
  EMAIL_BOUNCED:              "email.bounced",
  EMAIL_UNSUBSCRIBED:         "email.unsubscribed",
  OPPORTUNITY_CREATED:        "opportunity.created",
  OPPORTUNITY_STAGE_CHANGED:  "opportunity.stage_changed",
  OPPORTUNITY_STATUS_CHANGED: "opportunity.status_changed",
  STALE_OPPORTUNITY:          "opportunity.stale",
  BRAND_APPROVED:             "brand.approved",
  BRAND_CREATED:              "brand.created",
  INBOUND_WEBHOOK:            "system.webhook",
  SCHEDULER:                  "system.scheduler",
} as const;

export type TriggerType = typeof TRIGGER_TYPES[keyof typeof TRIGGER_TYPES];

export const STEP_TYPES = {
  SEND_EMAIL:              "action.send_email",
  SEND_SMS:                "action.send_sms",
  SEND_INTERNAL_NOTIFY:    "action.notify_team",
  ADD_TAG:                 "action.add_tag",
  REMOVE_TAG:              "action.remove_tag",
  UPDATE_CONTACT_FIELD:    "action.update_field",
  ADD_NOTE:                "action.add_note",
  ADD_TASK:                "action.add_task",
  UPDATE_STAGE:            "action.update_stage",
  CREATE_OPPORTUNITY:      "action.create_opportunity",
  MOVE_OPPORTUNITY:        "action.move_opportunity",
  UPDATE_OPPORTUNITY:      "action.update_opportunity",
  WAIT:                    "control.wait",
  WAIT_UNTIL:              "control.wait_until",
  IF_ELSE:                 "control.if_else",
  GO_TO:                   "control.go_to",
  END:                     "control.end",
  REMOVE_FROM_WORKFLOW:    "control.remove",
  WEBHOOK:                 "action.webhook",
  AI_ACTION:               "action.ai",
} as const;

export type StepType = typeof STEP_TYPES[keyof typeof STEP_TYPES];

export interface TriggerConfig {
  tagId?: string;
  tagName?: string;
  fromStage?: string;
  toStage?: string;
  fieldId?: string;
  fieldValue?: string;
  pipelineId?: string;
  stageId?: string;
  daysStale?: number;
  scheduleType?: "daily" | "weekly" | "monthly";
  scheduleHour?: number;
  scheduleDayOfWeek?: number;
  scheduleTime?: string;
  webhookSecret?: string;
  filters?: WorkflowFilter[];
}

export interface WorkflowFilter {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_empty" | "is_not_empty";
  value?: string;
}

export interface IfElseCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_empty" | "is_not_empty" | "greater_than" | "less_than";
  value?: string;
  join?: "AND" | "OR";
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  label?: string;
  waitAmount?: number;
  waitUnit?: "minutes" | "hours" | "days";
  waitUntilTime?: string;
  waitUntilDayOfWeek?: number;
  emailSubject?: string;
  emailBody?: string;
  emailFrom?: string;
  smsBody?: string;
  notifyTo?: string;
  notifySubject?: string;
  notifyBody?: string;
  tagId?: string;
  tagName?: string;
  fieldId?: string;
  fieldValue?: string;
  noteContent?: string;
  noteType?: string;
  taskTitle?: string;
  taskDueDays?: number;
  newStage?: string;
  pipelineId?: string;
  stageId?: string;
  opportunityName?: string;
  opportunityValue?: number;
  opportunityStatus?: string;
  conditions?: IfElseCondition[];
  trueBranch?: WorkflowStep[];
  falseBranch?: WorkflowStep[];
  goToStepId?: string;
  webhookUrl?: string;
  webhookMethod?: "POST" | "GET" | "PUT";
  webhookBody?: string;
  aiPrompt?: string;
  aiOutputField?: string;
}

export const TRIGGER_DISPLAY: Record<TriggerType, { label: string; category: string; description: string; icon: string }> = {
  "contact.created":              { label: "Contact Created",           category: "Contact",   description: "Fires when a new contact is added",                  icon: "UserPlus" },
  "contact.updated":              { label: "Contact Updated",            category: "Contact",   description: "Fires when any contact field changes",               icon: "UserCog" },
  "contact.tag_added":            { label: "Tag Added",                  category: "Contact",   description: "Fires when a specific tag is added",                 icon: "Tag" },
  "contact.tag_removed":          { label: "Tag Removed",                category: "Contact",   description: "Fires when a specific tag is removed",               icon: "X" },
  "contact.stage_changed":        { label: "Outreach Stage Changed",     category: "Contact",   description: "Fires when contact moves to a new stage",            icon: "ArrowRightCircle" },
  "contact.note_added":           { label: "Note Added",                 category: "Contact",   description: "Fires when a note is added to a contact",            icon: "FileText" },
  "contact.task_added":           { label: "Task Created",               category: "Contact",   description: "Fires when a task is created for a contact",         icon: "CheckSquare" },
  "contact.task_completed":       { label: "Task Completed",             category: "Contact",   description: "Fires when a contact task is completed",             icon: "CheckCircle2" },
  "contact.custom_field_updated": { label: "Custom Field Updated",       category: "Contact",   description: "Fires when a custom field value changes",            icon: "Edit3" },
  "email.sent":                   { label: "Email Sent",                 category: "Email",     description: "Fires when an email is delivered",                   icon: "Send" },
  "email.opened":                 { label: "Email Opened",               category: "Email",     description: "Fires when a contact opens an email",                icon: "Mail" },
  "email.clicked":                { label: "Email Link Clicked",         category: "Email",     description: "Fires when a contact clicks a link",                 icon: "MousePointer" },
  "email.bounced":                { label: "Email Bounced",              category: "Email",     description: "Fires when an email bounces",                        icon: "AlertCircle" },
  "email.unsubscribed":           { label: "Contact Unsubscribed",       category: "Email",     description: "Fires when a contact unsubscribes",                  icon: "UserMinus" },
  "opportunity.created":          { label: "Opportunity Created",        category: "Pipeline",  description: "Fires when a new opportunity is created",            icon: "Briefcase" },
  "opportunity.stage_changed":    { label: "Pipeline Stage Changed",     category: "Pipeline",  description: "Fires when opportunity moves to new stage",           icon: "GitBranch" },
  "opportunity.status_changed":   { label: "Opportunity Status Changed", category: "Pipeline",  description: "Fires when opportunity is won, lost, or reopened",   icon: "Flag" },
  "opportunity.stale":            { label: "Stale Opportunity",          category: "Pipeline",  description: "Fires when no movement for X days",                  icon: "Clock" },
  "brand.approved":               { label: "Brand Approved",             category: "Sourcing",  description: "Fires when a brand is marked as approved",           icon: "BadgeCheck" },
  "brand.created":                { label: "Brand Created",              category: "Sourcing",  description: "Fires when a new brand is added",                    icon: "Store" },
  "system.webhook":               { label: "Inbound Webhook",            category: "System",    description: "Fires when data is received at your webhook URL",    icon: "Globe" },
  "system.scheduler":             { label: "Time-Based Scheduler",       category: "System",    description: "Fires on a recurring schedule",                      icon: "Calendar" },
};

export const STEP_DISPLAY: Record<StepType, { label: string; category: string; description: string; icon: string; color: string }> = {
  "action.send_email":         { label: "Send Email",            category: "Communication", description: "Send an email to the contact",             icon: "Mail",            color: "#0E90C8" },
  "action.send_sms":           { label: "Send SMS",              category: "Communication", description: "Send an SMS via SendBlue",                 icon: "MessageSquare",   color: "#10B981" },
  "action.notify_team":        { label: "Notify Team",           category: "Communication", description: "Send notification to a team member",       icon: "Bell",            color: "#8B5CF6" },
  "action.add_tag":            { label: "Add Tag",               category: "Contact",       description: "Add a tag to the contact",                 icon: "Tag",             color: "#F59E0B" },
  "action.remove_tag":         { label: "Remove Tag",            category: "Contact",       description: "Remove a tag from the contact",            icon: "X",               color: "#EF4444" },
  "action.update_field":       { label: "Update Contact Field",  category: "Contact",       description: "Update a field value on the contact",      icon: "Edit",            color: "#6366F1" },
  "action.add_note":           { label: "Add Note",              category: "Contact",       description: "Add a note to the contact",                icon: "FileText",        color: "#0E90C8" },
  "action.add_task":           { label: "Create Task",           category: "Contact",       description: "Create a task for the contact",            icon: "CheckSquare",     color: "#14B8A6" },
  "action.update_stage":       { label: "Update Outreach Stage", category: "Contact",       description: "Change the contact outreach stage",        icon: "ArrowRight",      color: "#F59E0B" },
  "action.create_opportunity": { label: "Create Opportunity",    category: "Pipeline",      description: "Create a new opportunity in a pipeline",   icon: "Briefcase",       color: "#8B5CF6" },
  "action.move_opportunity":   { label: "Move Opportunity",      category: "Pipeline",      description: "Move opportunity to a pipeline stage",     icon: "GitBranch",       color: "#6366F1" },
  "action.update_opportunity": { label: "Update Opportunity",    category: "Pipeline",      description: "Update opportunity status (won/lost)",     icon: "Flag",            color: "#10B981" },
  "control.wait":              { label: "Wait",                  category: "Control",       description: "Wait X minutes, hours, or days",           icon: "Clock",           color: "#64748B" },
  "control.wait_until":        { label: "Wait Until",            category: "Control",       description: "Wait until a specific time or day",        icon: "Calendar",        color: "#64748B" },
  "control.if_else":           { label: "If / Else",             category: "Control",       description: "Branch based on a condition",              icon: "GitMerge",        color: "#F59E0B" },
  "control.go_to":             { label: "Go To",                 category: "Control",       description: "Jump to another step in this workflow",    icon: "CornerDownRight", color: "#64748B" },
  "control.end":               { label: "End Workflow",          category: "Control",       description: "End the workflow for this contact",        icon: "StopCircle",      color: "#EF4444" },
  "control.remove":            { label: "Remove from Workflow",  category: "Control",       description: "Unenroll the contact from this workflow",  icon: "UserX",           color: "#EF4444" },
  "action.webhook":            { label: "Send Webhook",          category: "External",      description: "POST data to an external URL",             icon: "Globe",           color: "#64748B" },
  "action.ai":                 { label: "AI Action",             category: "AI",            description: "Run an AI prompt via OpenAI",              icon: "Sparkles",        color: "#8B5CF6" },
};
