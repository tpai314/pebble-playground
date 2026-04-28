import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StyledTheme, usePebbleTheme } from '@/utils/theme';
import { AppShellLayout } from '@/components/app-shell';
import Button from '@rippling/pebble/Button';
import Card from '@rippling/pebble/Card';
import Icon from '@rippling/pebble/Icon';
import Status from '@rippling/pebble/Status';
import Drawer from '@rippling/pebble/Drawer';
import Modal from '@rippling/pebble/Modal';
import Avatar from '@rippling/pebble/Avatar';
import Input from '@rippling/pebble/Inputs';
import Tip from '@rippling/pebble/Tip';
import { HStack } from '@rippling/pebble/Layout/Stack';
import {
  TEMPLATES,
  NEW_HIRES,
  STEP_TYPE_META,
  CHECKPOINT_META,
  ASSIGNEE_LABEL,
  statusLabel,
  describeTrigger,
  StepStatus,
  NewHire,
  JourneyStep,
  Checkpoint,
} from '@/demos/journey-data';

/**
 * Journey Tracker
 *
 * Cohort-specific tracker. Filters and rows are scoped to one journey
 * template at a time (per v2 PRD: "the tracker UI should be cohort-specific").
 *
 * Top: KPI strip (on track / blocked / overdue / upcoming)
 * Left main: matrix view — hire × step status
 * Right rail: "What's blocked" — grouped by owner so admin can route follow-ups
 * Click a hire row → drawer with full timeline of their journey
 */

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space600};
  min-width: 0;
`;

const KpiStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${({ theme }) => (theme as StyledTheme).space400};
`;

const KpiCardInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
`;

const KpiLabel = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const KpiValue = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2DisplaySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const KpiCaption = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: ${({ theme }) => (theme as StyledTheme).space600};
  align-items: start;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
  align-items: center;
`;

const MatrixWrapper = styled.div`
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceBright};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
  overflow: hidden;
`;

const MatrixScroll = styled.div`
  overflow-x: auto;
`;

const MatrixTable = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  min-width: 720px;
`;

const MatrixHeadCell = styled.th<{ sticky?: boolean }>`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: left;
  padding: ${({ theme }) => (theme as StyledTheme).space300}
    ${({ theme }) => (theme as StyledTheme).space300};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  white-space: nowrap;
  position: ${({ sticky }) => (sticky ? 'sticky' : 'static')};
  left: 0;
  z-index: ${({ sticky }) => (sticky ? 2 : 'auto')};
`;

const MatrixCheckpointHeadCell = styled.th`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  text-align: left;
  padding: ${({ theme }) => (theme as StyledTheme).space200}
    ${({ theme }) => (theme as StyledTheme).space300};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-left: 2px solid ${({ theme }) => (theme as StyledTheme).colorOutline};
`;

const MatrixRow = styled.tr`
  cursor: pointer;
  transition: background-color 120ms ease;

  &:hover {
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const MatrixCell = styled.td`
  padding: ${({ theme }) => (theme as StyledTheme).space300};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  vertical-align: middle;
`;

const MatrixHireCell = styled.td`
  padding: ${({ theme }) => (theme as StyledTheme).space300};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  position: sticky;
  left: 0;
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceBright};
  border-right: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  min-width: 220px;
`;

const HireCellInner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
`;

const HireName = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const HireSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const StatusDot = styled.div<{ color: string }>`
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerFull};
  background-color: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const ColMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 140px;
`;

const ColTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  text-transform: none;
  letter-spacing: 0;
`;

const ColMetaSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const SideRail = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space400};
  position: sticky;
  top: ${({ theme }) => (theme as StyledTheme).space400};
`;

const RailCardInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
`;

const RailTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const RailGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
`;

const RailGroupTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: ${({ theme }) => (theme as StyledTheme).space200};
`;

const RailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: ${({ theme }) => (theme as StyledTheme).space200}
    ${({ theme }) => (theme as StyledTheme).space300};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  border-left: 3px solid ${({ theme }) => (theme as StyledTheme).colorError};
`;

const RailItemTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const RailItemSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
`;

const TimelineRow = styled.div`
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  align-items: center;
  padding: ${({ theme }) => (theme as StyledTheme).space300};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
`;

const TimelineCheckpointLabel = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: ${({ theme }) => (theme as StyledTheme).space400};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space200};
`;

const HireDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
  padding-bottom: ${({ theme }) => (theme as StyledTheme).space400};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const HireDrawerName = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const HireDrawerSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const BlockerBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  padding: ${({ theme }) => (theme as StyledTheme).space300};
  background-color: ${({ theme }) => (theme as StyledTheme).colorErrorContainer};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
`;

const ReminderModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space400};
  padding: ${({ theme }) => (theme as StyledTheme).space400} 0;
`;

const ReminderModalIntro = styled.p`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin: 0;
`;

const ReminderList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  max-height: 320px;
  overflow-y: auto;
`;

const ReminderRow = styled.label<{ checked: boolean }>`
  display: grid;
  grid-template-columns: 24px 32px 1fr auto;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  align-items: center;
  padding: ${({ theme }) => (theme as StyledTheme).space300};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  cursor: pointer;
  background-color: ${({ checked, theme }) =>
    checked ? 'transparent' : (theme as StyledTheme).colorSurfaceContainerLow};
  opacity: ${({ checked }) => (checked ? 1 : 0.55)};

  &:last-child {
    border-bottom: none;
  }
`;

const ReminderRowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ReminderRowTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const ReminderRowSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const ChannelChips = styled.div`
  display: flex;
  gap: 4px;
`;

const ChannelChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  padding: 2px 8px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerFull};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const MessagePreview = styled.div`
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  padding: ${({ theme }) => (theme as StyledTheme).space300}
    ${({ theme }) => (theme as StyledTheme).space400};
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  line-height: 1.5;
  border-left: 3px solid ${({ theme }) => (theme as StyledTheme).colorPrimary};
`;

const MessagePreviewLabel = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space200};
`;

const ModalFooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
`;

const FooterMetaText = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const SuccessState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => (theme as StyledTheme).space800}
    ${({ theme }) => (theme as StyledTheme).space400};
  gap: ${({ theme }) => (theme as StyledTheme).space300};
`;

const SuccessIconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerFull};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSuccessContainer};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space200};
`;

const SuccessTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const SuccessSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  max-width: 360px;
`;

function statusColor(theme: any, status: StepStatus): string {
  switch (status) {
    case 'completed':
      return theme.colorSuccess;
    case 'in_progress':
      return theme.colorPrimary;
    case 'sent':
    case 'viewed':
      return theme.colorPrimaryContainer;
    case 'overdue':
    case 'blocked':
      return theme.colorError;
    case 'not_started':
      return theme.colorSurfaceContainerHigh;
  }
}

function statusIcon(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return Icon.TYPES.CHECK;
    case 'in_progress':
      return Icon.TYPES.HOURGLASS_CHECKED_OUTLINE;
    case 'sent':
      return Icon.TYPES.EMAIL_OUTLINE;
    case 'viewed':
      return Icon.TYPES.EYE_OUTLINE;
    case 'overdue':
      return Icon.TYPES.WARNING_TRIANGLE_OUTLINE;
    case 'blocked':
      return Icon.TYPES.WARNING_CIRCLE_OUTLINE;
    case 'not_started':
      return Icon.TYPES.PAUSE;
  }
}

interface HireMatrixRowProps {
  hire: NewHire;
  steps: JourneyStep[];
  theme: any;
  onClick: () => void;
}

const HireMatrixRow: React.FC<HireMatrixRowProps> = ({ hire, steps, theme, onClick }) => {
  return (
    <MatrixRow onClick={onClick}>
      <MatrixHireCell>
        <HireCellInner>
          <Avatar title={hire.initials} size={Avatar.SIZES.S} />
          <div>
            <HireName>{hire.name}</HireName>
            <HireSub>
              {hire.jobTitle} · Starts {hire.startDate}
              {hire.daysToStart > 0
                ? ` (in ${hire.daysToStart}d)`
                : hire.daysToStart === 0
                  ? ' (today)'
                  : ` (${Math.abs(hire.daysToStart)}d ago)`}
            </HireSub>
          </div>
        </HireCellInner>
      </MatrixHireCell>
      {steps.map(s => {
        const status = hire.stepStatuses[s.id] ?? 'not_started';
        return (
          <MatrixCell key={s.id} style={{ textAlign: 'center' }}>
            <Tip content={`${s.title} · ${statusLabel(status)}`} placement={Tip.PLACEMENTS.TOP}>
              <span>
                <StatusDot color={statusColor(theme, status)}>
                  <Icon
                    type={statusIcon(status)}
                    size={12}
                    color={status === 'not_started' ? theme.colorOnSurfaceVariant : '#fff'}
                  />
                </StatusDot>
              </span>
            </Tip>
          </MatrixCell>
        );
      })}
    </MatrixRow>
  );
};

const JourneyTrackerDemo: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = usePebbleTheme();
  const [params] = useSearchParams();
  const requestedTemplate = params.get('template') ?? 'tmpl-us-salaried';

  const template = TEMPLATES.find(t => t.id === requestedTemplate) ?? TEMPLATES[0];
  const hires = useMemo(() => NEW_HIRES.filter(h => h.templateId === template.id), [template.id]);

  const [filterStatus, setFilterStatus] = useState<'all' | StepStatus>('all');
  const [filterCheckpoint, setFilterCheckpoint] = useState<'all' | Checkpoint>('all');
  const [openHire, setOpenHire] = useState<NewHire | null>(null);

  type ReminderModalState = { scope: 'single'; hireId: string } | { scope: 'bulk' } | null;
  const [reminderModal, setReminderModal] = useState<ReminderModalState>(null);
  const [reminderSelections, setReminderSelections] = useState<Set<string>>(new Set());
  const [sendStatus, setSendStatus] = useState<'reviewing' | 'sending' | 'sent'>('reviewing');

  const checkpointFilterOptions = useMemo(() => {
    const opts: Array<{ label: string; value: string }> = [
      { label: 'All checkpoints', value: 'all' },
    ];
    for (const k of Object.keys(CHECKPOINT_META) as Checkpoint[]) {
      opts.push({ label: CHECKPOINT_META[k].label, value: k });
    }
    return opts;
  }, []);

  const visibleSteps = useMemo(() => {
    if (filterCheckpoint === 'all') return template.steps;
    return template.steps.filter(s => s.checkpoint === filterCheckpoint);
  }, [template.steps, filterCheckpoint]);

  const visibleHires = useMemo(() => {
    if (filterStatus === 'all') return hires;
    return hires.filter(h => Object.values(h.stepStatuses).some(st => st === filterStatus));
  }, [hires, filterStatus]);

  const kpis = useMemo(() => {
    let onTrack = 0;
    let blocked = 0;
    let overdue = 0;
    let upcoming = 0;
    for (const h of hires) {
      const statuses = Object.values(h.stepStatuses);
      const hasBlocked = statuses.some(s => s === 'blocked');
      const hasOverdue = statuses.some(s => s === 'overdue');
      if (hasBlocked) blocked++;
      else if (hasOverdue) overdue++;
      else onTrack++;
      if (h.daysToStart > 0 && h.daysToStart <= 14) upcoming++;
    }
    return { onTrack, blocked, overdue, upcoming };
  }, [hires]);

  const blockedItems = useMemo(() => {
    type BlockedItem = { hire: NewHire; step: JourneyStep; status: StepStatus };
    const items: BlockedItem[] = [];
    for (const h of hires) {
      for (const s of template.steps) {
        const st = h.stepStatuses[s.id];
        if (st === 'blocked' || st === 'overdue') items.push({ hire: h, step: s, status: st });
      }
    }
    const grouped: Record<string, BlockedItem[]> = {};
    for (const item of items) {
      const key = ASSIGNEE_LABEL[item.step.assignee];
      grouped[key] = grouped[key] ?? [];
      grouped[key].push(item);
    }
    return grouped;
  }, [hires, template.steps]);

  const handleOpenBuilder = () => navigate(`/journey-builder?template=${template.id}`);

  const reminderItems = useMemo(() => {
    type Item = { key: string; hire: NewHire; step: JourneyStep; status: StepStatus };
    const out: Item[] = [];
    if (reminderModal === null) return out;
    const scopedHires =
      reminderModal.scope === 'single' ? hires.filter(h => h.id === reminderModal.hireId) : hires;
    for (const h of scopedHires) {
      for (const s of template.steps) {
        const st = h.stepStatuses[s.id];
        if (st === 'blocked' || st === 'overdue') {
          out.push({ key: `${h.id}__${s.id}`, hire: h, step: s, status: st });
        }
      }
    }
    return out;
  }, [reminderModal, hires, template.steps]);

  const openReminderModal = (state: NonNullable<ReminderModalState>) => {
    setReminderModal(state);
    const scopedHires = state.scope === 'single' ? hires.filter(h => h.id === state.hireId) : hires;
    const initialKeys = new Set<string>();
    for (const h of scopedHires) {
      for (const s of template.steps) {
        const st = h.stepStatuses[s.id];
        if (st === 'blocked' || st === 'overdue') {
          initialKeys.add(`${h.id}__${s.id}`);
        }
      }
    }
    setReminderSelections(initialKeys);
    setSendStatus('reviewing');
  };

  const closeReminderModal = () => {
    setReminderModal(null);
    setReminderSelections(new Set());
    setSendStatus('reviewing');
  };

  const toggleReminderSelection = (key: string) => {
    setReminderSelections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSendReminders = () => {
    setSendStatus('sending');
    setTimeout(() => setSendStatus('sent'), 700);
  };

  const humanizeDueDate = (label: string): string => {
    const m = label.match(/role\.(start_date|hire_date|offer_expiry_date)\s*([−\-+])\s*(\d+)/);
    if (!m) return label;
    const anchor =
      m[1] === 'start_date' ? 'start date' : m[1] === 'hire_date' ? 'hire date' : 'offer expiry';
    const sign = m[2];
    const days = m[3];
    if (sign === '+') return `${days} day${days === '1' ? '' : 's'} after ${anchor}`;
    return `${days} day${days === '1' ? '' : 's'} before ${anchor}`;
  };

  const selectedItems = reminderItems.filter(i => reminderSelections.has(i.key));

  const pageActions = (
    <HStack gap="0.5rem">
      <Button
        appearance={Button.APPEARANCES.OUTLINE}
        size={Button.SIZES.M}
        onClick={handleOpenBuilder}
      >
        Edit journey
      </Button>
      <Button
        appearance={Button.APPEARANCES.PRIMARY}
        size={Button.SIZES.M}
        onClick={() => openReminderModal({ scope: 'bulk' })}
        isDisabled={kpis.blocked + kpis.overdue === 0}
      >
        Send reminders
      </Button>
    </HStack>
  );

  const breadcrumbs = (
    <span style={{ fontSize: 13 }}>
      <a
        href="#"
        onClick={e => {
          e.preventDefault();
          navigate('/journey-gallery');
        }}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        Onboarding journeys
      </a>
      &nbsp;›&nbsp; {template.name} &nbsp;›&nbsp; Tracker
    </span>
  );

  return (
    <AppShellLayout
      pageTitle={`${template.name} — Tracker`}
      pageBreadcrumbs={breadcrumbs}
      pageActions={pageActions}
      defaultAdminMode
      companyName="Acme, Inc."
      userInitial="P"
    >
      <Page>
        <KpiStrip>
          <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
            <KpiCardInner>
              <KpiLabel>On track</KpiLabel>
              <KpiValue>{kpis.onTrack}</KpiValue>
              <KpiCaption>No blockers, no overdue steps</KpiCaption>
            </KpiCardInner>
          </Card.Layout>
          <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
            <KpiCardInner>
              <KpiLabel>Blocked</KpiLabel>
              <KpiValue style={{ color: theme.colorError }}>{kpis.blocked}</KpiValue>
              <KpiCaption>Step has a known blocker</KpiCaption>
            </KpiCardInner>
          </Card.Layout>
          <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
            <KpiCardInner>
              <KpiLabel>Overdue</KpiLabel>
              <KpiValue style={{ color: theme.colorWarning }}>{kpis.overdue}</KpiValue>
              <KpiCaption>Past due date, no completion</KpiCaption>
            </KpiCardInner>
          </Card.Layout>
          <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
            <KpiCardInner>
              <KpiLabel>Upcoming starts</KpiLabel>
              <KpiValue>{kpis.upcoming}</KpiValue>
              <KpiCaption>Within next 14 days</KpiCaption>
            </KpiCardInner>
          </Card.Layout>
        </KpiStrip>

        <Body>
          <div>
            <FiltersRow>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.colorOnSurfaceVariant }}>
                Filter:
              </span>
              <Input.Select
                list={[
                  { label: 'All statuses', value: 'all' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'In progress', value: 'in_progress' },
                  { label: 'Overdue', value: 'overdue' },
                  { label: 'Blocked', value: 'blocked' },
                  { label: 'Not started', value: 'not_started' },
                ]}
                value={filterStatus}
                onChange={(v: unknown) => setFilterStatus(v as 'all' | StepStatus)}
              />
              <Input.Select
                list={checkpointFilterOptions}
                value={filterCheckpoint}
                onChange={(v: unknown) => setFilterCheckpoint(v as 'all' | Checkpoint)}
              />
            </FiltersRow>

            <MatrixWrapper>
              <MatrixScroll>
                <MatrixTable>
                  <thead>
                    <tr>
                      <MatrixHeadCell sticky>New hire ({visibleHires.length})</MatrixHeadCell>
                      {visibleSteps.map(s => {
                        const meta = STEP_TYPE_META[s.type];
                        const isFirstInCp =
                          visibleSteps.findIndex(x => x.checkpoint === s.checkpoint) ===
                          visibleSteps.indexOf(s);
                        const HeadCellComponent = isFirstInCp
                          ? MatrixCheckpointHeadCell
                          : MatrixHeadCell;
                        return (
                          <HeadCellComponent key={s.id}>
                            <ColMeta>
                              <HStack gap="0.25rem" align="center">
                                <Icon type={meta.icon} size={12} />
                                <ColTitle>{s.title}</ColTitle>
                              </HStack>
                              <ColMetaSub>
                                Due {s.dueDateLabel} · {ASSIGNEE_LABEL[s.assignee]}
                              </ColMetaSub>
                            </ColMeta>
                          </HeadCellComponent>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleHires.map(h => (
                      <HireMatrixRow
                        key={h.id}
                        hire={h}
                        steps={visibleSteps}
                        theme={theme}
                        onClick={() => setOpenHire(h)}
                      />
                    ))}
                  </tbody>
                </MatrixTable>
              </MatrixScroll>
            </MatrixWrapper>
          </div>

          <SideRail>
            <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
              <RailCardInner>
                <RailTitle>What&apos;s blocked</RailTitle>
                <KpiCaption>
                  Blocked and overdue steps grouped by owner. Route follow-ups from here.
                </KpiCaption>
                {Object.keys(blockedItems).length === 0 && (
                  <KpiCaption>Nothing blocked. Nice.</KpiCaption>
                )}
                {Object.entries(blockedItems).map(([owner, items]) => (
                  <RailGroup key={owner}>
                    <RailGroupTitle>
                      {owner} · {items.length}
                    </RailGroupTitle>
                    {items.map(({ hire, step, status }) => (
                      <RailItem
                        key={`${hire.id}-${step.id}`}
                        onClick={() => setOpenHire(hire)}
                        style={{ cursor: 'pointer' }}
                      >
                        <RailItemTitle>{step.title}</RailItemTitle>
                        <RailItemSub>
                          {hire.name} · {statusLabel(status)} · Due {step.dueDateLabel}
                        </RailItemSub>
                      </RailItem>
                    ))}
                  </RailGroup>
                ))}
              </RailCardInner>
            </Card.Layout>

            <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
              <RailCardInner>
                <RailTitle>Cohort summary</RailTitle>
                <KpiCaption>
                  {hires.length} active hires assigned to <strong>{template.name}</strong>.
                </KpiCaption>
                <KpiCaption>
                  Steps tracked: {template.steps.length} ·{' '}
                  {template.steps.filter(s => s.blocking !== 'non_blocking').length} blocking
                </KpiCaption>
              </RailCardInner>
            </Card.Layout>
          </SideRail>
        </Body>
      </Page>

      <Drawer
        isVisible={openHire !== null}
        onCancel={() => setOpenHire(null)}
        title="Onboarding timeline"
        width={560}
      >
        {openHire && (
          <div>
            <HireDrawerHeader>
              <Avatar title={openHire.initials} size={Avatar.SIZES.M} />
              <div>
                <HireDrawerName>{openHire.name}</HireDrawerName>
                <HireDrawerSub>
                  {openHire.jobTitle} · {openHire.department} · Starts {openHire.startDate}
                </HireDrawerSub>
              </div>
            </HireDrawerHeader>

            {openHire.blockerSummary && (
              <BlockerBanner>
                <Icon
                  type={Icon.TYPES.WARNING_TRIANGLE_OUTLINE}
                  size={20}
                  color={theme.colorError}
                />
                <div>
                  <RailItemTitle>Blocked</RailItemTitle>
                  <RailItemSub>{openHire.blockerSummary}</RailItemSub>
                </div>
              </BlockerBanner>
            )}

            <Timeline>
              {(Object.keys(CHECKPOINT_META) as Checkpoint[])
                .sort((a, b) => CHECKPOINT_META[a].order - CHECKPOINT_META[b].order)
                .map(cp => {
                  const cpSteps = template.steps.filter(s => s.checkpoint === cp);
                  if (cpSteps.length === 0) return null;
                  return (
                    <div key={cp}>
                      <TimelineCheckpointLabel>{CHECKPOINT_META[cp].label}</TimelineCheckpointLabel>
                      {cpSteps.map(s => {
                        const status = openHire.stepStatuses[s.id] ?? 'not_started';
                        return (
                          <TimelineRow key={s.id}>
                            <StatusDot color={statusColor(theme, status)}>
                              <Icon
                                type={statusIcon(status)}
                                size={12}
                                color={
                                  status === 'not_started' ? theme.colorOnSurfaceVariant : '#fff'
                                }
                              />
                            </StatusDot>
                            <div>
                              <RailItemTitle>{s.title}</RailItemTitle>
                              <RailItemSub>
                                {ASSIGNEE_LABEL[s.assignee]} · {describeTrigger(s.trigger)}
                              </RailItemSub>
                            </div>
                            <Status
                              appearance={
                                status === 'completed'
                                  ? Status.APPEARANCES.SUCCESS
                                  : status === 'overdue' || status === 'blocked'
                                    ? Status.APPEARANCES.ERROR
                                    : status === 'in_progress' ||
                                        status === 'sent' ||
                                        status === 'viewed'
                                      ? Status.APPEARANCES.PRIMARY
                                      : Status.APPEARANCES.TERTIARY
                              }
                              text={statusLabel(status)}
                              size={Status.SIZES.S}
                              outlined
                            />
                          </TimelineRow>
                        );
                      })}
                    </div>
                  );
                })}
            </Timeline>

            <div style={{ marginTop: theme.space600, display: 'flex', gap: theme.space200 }}>
              <Button
                appearance={Button.APPEARANCES.OUTLINE}
                size={Button.SIZES.S}
                onClick={() => openReminderModal({ scope: 'single', hireId: openHire.id })}
                isDisabled={
                  !Object.values(openHire.stepStatuses).some(
                    s => s === 'blocked' || s === 'overdue',
                  )
                }
              >
                Send reminder
              </Button>
              <Button appearance={Button.APPEARANCES.OUTLINE} size={Button.SIZES.S}>
                Push start date
              </Button>
              <Button
                appearance={Button.APPEARANCES.GHOST}
                size={Button.SIZES.S}
                onClick={handleOpenBuilder}
              >
                Edit journey config
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isVisible={reminderModal !== null}
        onCancel={closeReminderModal}
        title={
          sendStatus === 'sent'
            ? 'Reminders sent'
            : reminderModal?.scope === 'single'
              ? `Send reminder${reminderItems.length === 1 ? '' : 's'}`
              : 'Send reminders'
        }
        width={560}
        shouldCloseOnBackdropClick
      >
        {sendStatus === 'sent' ? (
          <>
            <SuccessState>
              <SuccessIconWrap>
                <Icon type={Icon.TYPES.CHECK} size={28} color={theme.colorSuccess} />
              </SuccessIconWrap>
              <SuccessTitle>
                {selectedItems.length} reminder{selectedItems.length === 1 ? '' : 's'} sent
              </SuccessTitle>
              <SuccessSub>
                Recipients will receive an email and Slack message within a few minutes. The tracker
                will refresh once any of them responds.
              </SuccessSub>
            </SuccessState>
            <Modal.Footer>
              <ModalFooterRow>
                <span />
                <Button
                  appearance={Button.APPEARANCES.PRIMARY}
                  size={Button.SIZES.M}
                  onClick={closeReminderModal}
                >
                  Done
                </Button>
              </ModalFooterRow>
            </Modal.Footer>
          </>
        ) : (
          <>
            <ReminderModalBody>
              <ReminderModalIntro>
                {reminderModal?.scope === 'single' ? (
                  <>
                    Acme will send a reminder for each item below. Recipients get an email and Slack
                    message based on the journey&apos;s reminder schedule.
                  </>
                ) : (
                  <>
                    {reminderItems.length} blocked or overdue
                    {reminderItems.length === 1 ? ' item' : ' items'} across this cohort. Review and
                    confirm.
                  </>
                )}
              </ReminderModalIntro>

              {reminderItems.length === 0 ? (
                <KpiCaption>Nothing to remind on. This cohort is on track.</KpiCaption>
              ) : (
                <>
                  <ReminderList>
                    {reminderItems.map(item => {
                      const checked = reminderSelections.has(item.key);
                      return (
                        <ReminderRow
                          key={item.key}
                          checked={checked}
                          onClick={e => {
                            const target = e.target as HTMLElement;
                            if (target.closest('input[type="checkbox"], [role="checkbox"]')) {
                              return;
                            }
                            e.preventDefault();
                            toggleReminderSelection(item.key);
                          }}
                        >
                          <Input.Checkbox
                            name={`reminder-${item.key}`}
                            label=""
                            value={checked}
                            onChange={() => toggleReminderSelection(item.key)}
                          />
                          <Avatar title={item.hire.initials} size={Avatar.SIZES.S} />
                          <ReminderRowBody>
                            <ReminderRowTitle>{item.step.title}</ReminderRowTitle>
                            <ReminderRowSub>
                              {item.hire.name} · {ASSIGNEE_LABEL[item.step.assignee]} ·{' '}
                              <Status
                                appearance={Status.APPEARANCES.ERROR}
                                text={statusLabel(item.status)}
                                size={Status.SIZES.S}
                                outlined
                              />
                            </ReminderRowSub>
                          </ReminderRowBody>
                          <ChannelChips>
                            <ChannelChip>
                              <Icon type={Icon.TYPES.EMAIL_OUTLINE} size={10} />
                              Email
                            </ChannelChip>
                            <ChannelChip>
                              <Icon type={Icon.TYPES.SLACK} size={10} />
                              Slack
                            </ChannelChip>
                          </ChannelChips>
                        </ReminderRow>
                      );
                    })}
                  </ReminderList>

                  {selectedItems.length > 0 && selectedItems[0] && (
                    <div>
                      <MessagePreviewLabel>Message preview</MessagePreviewLabel>
                      <MessagePreview>
                        Hi {selectedItems[0].hire.name.split(' ')[0]}, this is a reminder about
                        &ldquo;{selectedItems[0].step.title}&rdquo; for {selectedItems[0].hire.name}
                        &apos;s onboarding. It was due{' '}
                        {humanizeDueDate(selectedItems[0].step.dueDateLabel)} and is currently{' '}
                        {statusLabel(selectedItems[0].status).toLowerCase()}. Please complete it as
                        soon as possible.
                      </MessagePreview>
                    </div>
                  )}
                </>
              )}
            </ReminderModalBody>
            <Modal.Footer>
              <ModalFooterRow>
                <FooterMetaText>
                  {selectedItems.length} of {reminderItems.length} selected
                </FooterMetaText>
                <HStack gap="0.5rem">
                  <Button
                    appearance={Button.APPEARANCES.GHOST}
                    size={Button.SIZES.M}
                    onClick={closeReminderModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance={Button.APPEARANCES.PRIMARY}
                    size={Button.SIZES.M}
                    onClick={handleSendReminders}
                    isDisabled={selectedItems.length === 0 || sendStatus === 'sending'}
                  >
                    {sendStatus === 'sending'
                      ? 'Sending...'
                      : `Send ${selectedItems.length} reminder${selectedItems.length === 1 ? '' : 's'}`}
                  </Button>
                </HStack>
              </ModalFooterRow>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </AppShellLayout>
  );
};

export default JourneyTrackerDemo;
