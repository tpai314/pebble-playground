/**
 * Shared mock data for the Onboarding Journeys prototype.
 *
 * Mirrors the schema described in the v2 PRD's "onboarding_journey" section
 * so the gallery, builder, and tracker stay coherent.
 */

import Icon from '@rippling/pebble/Icon';

// ─── Step types & constants ───────────────────────────────────────────────────

export type StepType =
  | 'hris'
  | 'background_check'
  | 'device'
  | 'benefits'
  | 'lms'
  | 'app_provisioning'
  | 'notification'
  | 'custom_task'
  | 'automation_hook';

export type AssigneeRole =
  | 'employee'
  | 'manager'
  | 'hr_admin'
  | 'it_admin'
  | 'benefits_admin'
  | 'system'
  | '3p_vendor';

export type Checkpoint = 'registered' | 'day_1_ready' | 'payroll_ready' | 'fully_onboarded';

export type BlockingClass = 'start' | 'payroll' | 'non_blocking';

export type TriggerKind = 'data_change' | 'time_based';

export type DateAnchor = 'role.hire_date' | 'role.start_date' | 'role.offer_expiry_date';

export interface Trigger {
  kind: TriggerKind;
  field?: string;
  fieldValueBefore?: string;
  fieldValueAfter?: string;
  anchor?: DateAnchor;
  offsetDays?: number;
}

export interface ReminderSchedule {
  fireIfDaysBeforeDueDate: number | null;
  fireIfDaysAfterDueDate: number[];
}

export interface JourneyStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  trigger: Trigger;
  assignee: AssigneeRole;
  dueDateLabel: string;
  blocking: BlockingClass;
  checkpoint: Checkpoint;
  workflowStudioSupported: boolean;
  reminders?: {
    primary: ReminderSchedule;
    secondary?: ReminderSchedule;
  };
}

export interface JourneyAudience {
  workLocation?: string;
  employmentType?: string;
  department?: string;
}

export interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  audience: JourneyAudience;
  activeHires: number;
  status: 'active' | 'draft' | 'rippling_default';
  steps: JourneyStep[];
  lastModified: string;
  modifiedBy: string;
}

// ─── Step type metadata (for the step library + step rows) ────────────────────

export interface StepTypeMeta {
  label: string;
  category: 'rippling_app' | 'workflow' | 'task';
  icon: string;
  defaultAssignee: AssigneeRole;
  configuredVia: 'builder' | 'workflow_studio' | 'source_app';
}

export const STEP_TYPE_META: Record<StepType, StepTypeMeta> = {
  hris: {
    label: 'HRIS task',
    category: 'rippling_app',
    icon: Icon.TYPES.PEOPLE_HEART_OUTLINE,
    defaultAssignee: 'employee',
    configuredVia: 'builder',
  },
  background_check: {
    label: 'Background check',
    category: 'rippling_app',
    icon: Icon.TYPES.SHIELD_EYE_OUTLINE,
    defaultAssignee: '3p_vendor',
    configuredVia: 'source_app',
  },
  device: {
    label: 'Device',
    category: 'rippling_app',
    icon: Icon.TYPES.LAPTOP_OUTLINE,
    defaultAssignee: 'it_admin',
    configuredVia: 'builder',
  },
  benefits: {
    label: 'Benefits',
    category: 'rippling_app',
    icon: Icon.TYPES.MEDICAL_OUTLINE,
    defaultAssignee: 'employee',
    configuredVia: 'source_app',
  },
  lms: {
    label: 'Learning',
    category: 'rippling_app',
    icon: Icon.TYPES.MAGNIFYING_GLASS_STAR_OUTLINE,
    defaultAssignee: 'employee',
    configuredVia: 'workflow_studio',
  },
  app_provisioning: {
    label: 'App provisioning',
    category: 'rippling_app',
    icon: Icon.TYPES.HAND_LAPTOP_OUTLINE,
    defaultAssignee: 'system',
    configuredVia: 'builder',
  },
  notification: {
    label: 'Notification',
    category: 'workflow',
    icon: Icon.TYPES.EMAIL_OUTLINE,
    defaultAssignee: 'system',
    configuredVia: 'workflow_studio',
  },
  custom_task: {
    label: 'Custom task',
    category: 'task',
    icon: Icon.TYPES.TASK_OUTLINE,
    defaultAssignee: 'manager',
    configuredVia: 'builder',
  },
  automation_hook: {
    label: 'Existing workflow',
    category: 'workflow',
    icon: Icon.TYPES.THUNDERBOLT_OUTLINE,
    defaultAssignee: 'system',
    configuredVia: 'workflow_studio',
  },
};

// ─── Checkpoint metadata ──────────────────────────────────────────────────────

export const CHECKPOINT_META: Record<
  Checkpoint,
  { label: string; order: number; description: string }
> = {
  registered: { label: 'Registered', order: 1, description: 'Offer signed, account created' },
  day_1_ready: { label: 'Day 1 ready', order: 2, description: 'Cleared to start work' },
  payroll_ready: { label: 'Payroll ready', order: 3, description: 'Cleared for first paycheck' },
  fully_onboarded: {
    label: 'Fully onboarded',
    order: 4,
    description: 'All onboarding tasks complete',
  },
};

export const ASSIGNEE_LABEL: Record<AssigneeRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR admin',
  it_admin: 'IT admin',
  benefits_admin: 'Benefits admin',
  system: 'System',
  '3p_vendor': '3P vendor',
};

// ─── Templates ────────────────────────────────────────────────────────────────

const sharedSalariedSteps: JourneyStep[] = [
  {
    id: 'step-1',
    type: 'hris',
    title: 'Complete employee onboarding flow',
    trigger: {
      kind: 'data_change',
      field: 'role.state',
      fieldValueBefore: 'HIRED',
      fieldValueAfter: 'ACCEPTED',
    },
    assignee: 'employee',
    dueDateLabel: 'role.offer_expiry_date',
    blocking: 'start',
    checkpoint: 'registered',
    workflowStudioSupported: true,
    reminders: {
      primary: { fireIfDaysBeforeDueDate: 5, fireIfDaysAfterDueDate: [1, 3, 5] },
    },
  },
  {
    id: 'step-2',
    type: 'background_check',
    title: 'Share info for background check',
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: -10 },
    assignee: 'employee',
    dueDateLabel: 'role.start_date − 10',
    blocking: 'start',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: true,
    reminders: {
      primary: { fireIfDaysBeforeDueDate: 3, fireIfDaysAfterDueDate: [1, 2] },
    },
  },
  {
    id: 'step-3',
    type: 'background_check',
    title: 'Verify background',
    trigger: {
      kind: 'data_change',
      field: 'background_check.status',
      fieldValueBefore: 'pending',
      fieldValueAfter: 'submitted',
    },
    assignee: '3p_vendor',
    dueDateLabel: 'role.start_date − 2',
    blocking: 'start',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: false,
  },
  {
    id: 'step-4',
    type: 'device',
    title: 'Order and ship device',
    trigger: { kind: 'time_based', anchor: 'role.hire_date', offsetDays: 1 },
    assignee: 'it_admin',
    dueDateLabel: 'role.start_date − 3',
    blocking: 'start',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: true,
    reminders: {
      primary: { fireIfDaysBeforeDueDate: 5, fireIfDaysAfterDueDate: [1, 2] },
    },
  },
  {
    id: 'step-5',
    type: 'hris',
    title: 'Verify I-9 documents',
    trigger: {
      kind: 'data_change',
      field: 'role.is_onboarding_complete',
      fieldValueBefore: 'false',
      fieldValueAfter: 'true',
    },
    assignee: 'hr_admin',
    dueDateLabel: 'role.start_date + 3',
    blocking: 'payroll',
    checkpoint: 'payroll_ready',
    workflowStudioSupported: true,
    reminders: {
      primary: { fireIfDaysBeforeDueDate: 1, fireIfDaysAfterDueDate: [1, 3, 5] },
    },
  },
  {
    id: 'step-6',
    type: 'custom_task',
    title: 'Assign onboarding buddy',
    description: "Manager picks a peer to be the new hire's onboarding buddy",
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: -7 },
    assignee: 'manager',
    dueDateLabel: 'role.start_date − 7',
    blocking: 'non_blocking',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: true,
  },
  {
    id: 'step-7',
    type: 'benefits',
    title: 'Enroll for benefits',
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: 0 },
    assignee: 'employee',
    dueDateLabel: 'role.start_date + 30',
    blocking: 'non_blocking',
    checkpoint: 'fully_onboarded',
    workflowStudioSupported: true,
    reminders: {
      primary: { fireIfDaysBeforeDueDate: 7, fireIfDaysAfterDueDate: [3, 7, 14] },
    },
  },
  {
    id: 'step-8',
    type: 'lms',
    title: 'Complete required LMS courses',
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: 0 },
    assignee: 'employee',
    dueDateLabel: 'role.start_date + 30',
    blocking: 'non_blocking',
    checkpoint: 'fully_onboarded',
    workflowStudioSupported: true,
    reminders: {
      primary: { fireIfDaysBeforeDueDate: 7, fireIfDaysAfterDueDate: [3, 10] },
    },
  },
];

const hourlySteps: JourneyStep[] = [
  ...sharedSalariedSteps.slice(0, 5),
  {
    id: 'h-step-6',
    type: 'custom_task',
    title: 'Schedule first-shift orientation',
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: -3 },
    assignee: 'manager',
    dueDateLabel: 'role.start_date − 3',
    blocking: 'start',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: true,
  },
  {
    id: 'h-step-7',
    type: 'lms',
    title: 'Complete safety training',
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: 0 },
    assignee: 'employee',
    dueDateLabel: 'role.start_date + 7',
    blocking: 'non_blocking',
    checkpoint: 'fully_onboarded',
    workflowStudioSupported: true,
  },
];

const eorSteps: JourneyStep[] = [
  sharedSalariedSteps[0],
  {
    id: 'eor-step-2',
    type: 'custom_task',
    title: 'Verify work authorization with EOR partner',
    trigger: { kind: 'time_based', anchor: 'role.hire_date', offsetDays: 1 },
    assignee: '3p_vendor',
    dueDateLabel: 'role.start_date − 7',
    blocking: 'start',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: false,
  },
  {
    id: 'eor-step-3',
    type: 'device',
    title: 'Ship device via international logistics',
    trigger: { kind: 'time_based', anchor: 'role.hire_date', offsetDays: 1 },
    assignee: 'it_admin',
    dueDateLabel: 'role.start_date − 7',
    blocking: 'start',
    checkpoint: 'day_1_ready',
    workflowStudioSupported: true,
  },
  sharedSalariedSteps[5],
  sharedSalariedSteps[7],
];

export const TEMPLATES: JourneyTemplate[] = [
  {
    id: 'tmpl-us-salaried',
    name: 'US Salaried — Engineering & GTM',
    description: 'Standard onboarding for US salaried employees in Engineering and Sales.',
    audience: {
      workLocation: 'United States',
      employmentType: 'Salaried',
      department: 'Engineering, Sales',
    },
    activeHires: 12,
    status: 'active',
    steps: sharedSalariedSteps,
    lastModified: '3 days ago',
    modifiedBy: 'Priya Shah',
  },
  {
    id: 'tmpl-us-hourly',
    name: 'US Hourly — Operations',
    description: 'Onboarding for hourly retail and ops workers, with safety training.',
    audience: { workLocation: 'United States', employmentType: 'Hourly', department: 'Operations' },
    activeHires: 7,
    status: 'active',
    steps: hourlySteps,
    lastModified: '1 week ago',
    modifiedBy: 'Marcus Lee',
  },
  {
    id: 'tmpl-eor',
    name: 'International Contractor — EOR',
    description: 'Cross-border onboarding via Rippling EOR. Skips US-only steps.',
    audience: { employmentType: 'EOR Contractor' },
    activeHires: 4,
    status: 'active',
    steps: eorSteps,
    lastModified: '2 weeks ago',
    modifiedBy: 'Aisha Khan',
  },
  {
    id: 'tmpl-default-rippling',
    name: 'Rippling default — Salaried',
    description: 'Out-of-the-box journey shipped by Rippling. Clone to customize.',
    audience: { employmentType: 'Salaried' },
    activeHires: 0,
    status: 'rippling_default',
    steps: sharedSalariedSteps.slice(0, 6),
    lastModified: 'Seeded by Rippling',
    modifiedBy: 'Rippling',
  },
];

// ─── New hires (for tracker) ──────────────────────────────────────────────────

export type StepStatus =
  | 'completed'
  | 'in_progress'
  | 'sent'
  | 'viewed'
  | 'overdue'
  | 'blocked'
  | 'not_started';

export interface NewHire {
  id: string;
  name: string;
  initials: string;
  jobTitle: string;
  department: string;
  templateId: string;
  startDate: string;
  daysToStart: number;
  stepStatuses: Record<string, StepStatus>;
  blockerSummary?: string;
}

const usSalariedTemplate = TEMPLATES[0];

function statusMap(entries: Array<[string, StepStatus]>): Record<string, StepStatus> {
  const out: Record<string, StepStatus> = {};
  for (const [stepId, status] of entries) out[stepId] = status;
  for (const step of usSalariedTemplate.steps) {
    if (!(step.id in out)) out[step.id] = 'not_started';
  }
  return out;
}

export const NEW_HIRES: NewHire[] = [
  {
    id: 'h-jane-doe',
    name: 'Jane Doe',
    initials: 'JD',
    jobTitle: 'Senior Software Engineer',
    department: 'Engineering',
    templateId: 'tmpl-us-salaried',
    startDate: 'May 5',
    daysToStart: 7,
    stepStatuses: statusMap([
      ['step-1', 'completed'],
      ['step-2', 'completed'],
      ['step-3', 'overdue'],
      ['step-4', 'blocked'],
      ['step-5', 'not_started'],
      ['step-6', 'completed'],
    ]),
    blockerSummary: 'Device shipment blocked: no shipping address on file',
  },
  {
    id: 'h-john-smith',
    name: 'John Smith',
    initials: 'JS',
    jobTitle: 'Account Executive',
    department: 'Sales',
    templateId: 'tmpl-us-salaried',
    startDate: 'May 5',
    daysToStart: 7,
    stepStatuses: statusMap([
      ['step-1', 'completed'],
      ['step-2', 'completed'],
      ['step-3', 'completed'],
      ['step-4', 'in_progress'],
      ['step-5', 'not_started'],
      ['step-6', 'sent'],
    ]),
  },
  {
    id: 'h-maria-garcia',
    name: 'Maria Garcia',
    initials: 'MG',
    jobTitle: 'Staff Engineer',
    department: 'Engineering',
    templateId: 'tmpl-us-salaried',
    startDate: 'May 12',
    daysToStart: 14,
    stepStatuses: statusMap([
      ['step-1', 'sent'],
      ['step-2', 'not_started'],
      ['step-3', 'not_started'],
    ]),
  },
  {
    id: 'h-david-park',
    name: 'David Park',
    initials: 'DP',
    jobTitle: 'Senior Account Executive',
    department: 'Sales',
    templateId: 'tmpl-us-salaried',
    startDate: 'Apr 28',
    daysToStart: 0,
    stepStatuses: statusMap([
      ['step-1', 'completed'],
      ['step-2', 'completed'],
      ['step-3', 'completed'],
      ['step-4', 'completed'],
      ['step-5', 'overdue'],
      ['step-6', 'completed'],
      ['step-7', 'in_progress'],
    ]),
    blockerSummary: 'I-9 verification overdue — 2 days past start date',
  },
  {
    id: 'h-amelia-novak',
    name: 'Amelia Novak',
    initials: 'AN',
    jobTitle: 'Engineering Manager',
    department: 'Engineering',
    templateId: 'tmpl-us-salaried',
    startDate: 'Apr 21',
    daysToStart: -7,
    stepStatuses: statusMap([
      ['step-1', 'completed'],
      ['step-2', 'completed'],
      ['step-3', 'completed'],
      ['step-4', 'completed'],
      ['step-5', 'completed'],
      ['step-6', 'completed'],
      ['step-7', 'completed'],
      ['step-8', 'in_progress'],
    ]),
  },
  {
    id: 'h-priya-iyer',
    name: 'Priya Iyer',
    initials: 'PI',
    jobTitle: 'Product Designer',
    department: 'Engineering',
    templateId: 'tmpl-us-salaried',
    startDate: 'May 19',
    daysToStart: 21,
    stepStatuses: statusMap([
      ['step-1', 'sent'],
      ['step-2', 'not_started'],
    ]),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function describeTrigger(t: Trigger): string {
  if (t.kind === 'time_based' && t.anchor !== undefined) {
    const offset = t.offsetDays ?? 0;
    if (offset === 0) return `On ${t.anchor.replace('role.', '').replace('_', ' ')}`;
    const sign = offset > 0 ? '+' : '−';
    return `${t.anchor.replace('role.', '').replace('_', ' ')} ${sign} ${Math.abs(offset)} days`;
  }
  if (t.kind === 'data_change' && t.field) {
    return `${t.field} changes ${t.fieldValueBefore} → ${t.fieldValueAfter}`;
  }
  return 'Trigger not configured';
}

export function statusLabel(s: StepStatus): string {
  switch (s) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In progress';
    case 'sent':
      return 'Sent';
    case 'viewed':
      return 'Viewed';
    case 'overdue':
      return 'Overdue';
    case 'blocked':
      return 'Blocked';
    case 'not_started':
      return 'Not started';
  }
}

export function blockingLabel(b: BlockingClass): string {
  switch (b) {
    case 'start':
      return 'Blocks Day 1';
    case 'payroll':
      return 'Blocks payroll';
    case 'non_blocking':
      return 'Non-blocking';
  }
}
