import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StyledTheme } from '@/utils/theme';
import { AppShellLayout } from '@/components/app-shell';
import Button from '@rippling/pebble/Button';
import Icon from '@rippling/pebble/Icon';
import Status from '@rippling/pebble/Status';
import Tip from '@rippling/pebble/Tip';
import Drawer from '@rippling/pebble/Drawer';
import Input from '@rippling/pebble/Inputs';
import { HStack } from '@rippling/pebble/Layout/Stack';
import {
  TEMPLATES,
  STEP_TYPE_META,
  CHECKPOINT_META,
  ASSIGNEE_LABEL,
  describeTrigger,
  blockingLabel,
  JourneyStep,
  JourneyTemplate,
  StepType,
  Checkpoint,
} from '@/demos/journey-data';

/**
 * Journey Builder
 *
 * Two-panel composer:
 *   left  → typed step library, grouped by category
 *   right → journey canvas with steps grouped by checkpoint
 *
 * Click any step to open the edit drawer (trigger, assignee, due offset,
 * reminders). Drag-and-drop is mocked — clicking a library item appends
 * it to the canvas under "Day 1 ready" by default.
 *
 * The canvas is the source of truth, written into the same
 * `onboarding_journey` schema described in PRD v2.
 */

const Layout = styled.div`
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: ${({ theme }) => (theme as StyledTheme).space600};
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Panel = styled.div`
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceBright};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
  padding: ${({ theme }) => (theme as StyledTheme).space400};
`;

const PanelTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space300};
`;

const PanelSubtitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
`;

const StepLibraryGroup = styled.div`
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
`;

const StepLibraryGroupTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space200};
`;

const StepLibraryItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  padding: ${({ theme }) => (theme as StyledTheme).space200}
    ${({ theme }) => (theme as StyledTheme).space300};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurface};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  cursor: pointer;
  width: 100%;
  text-align: left;
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space200};
  transition:
    border-color 120ms ease,
    background-color 120ms ease;

  &:hover {
    border-color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const StepLibraryItemLabel = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const Canvas = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space400};
`;

const CanvasHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: ${({ theme }) => (theme as StyledTheme).space400};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const CanvasMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space100};
`;

const AudienceLine = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  display: flex;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
  align-items: center;
`;

const Pill = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  padding: 2px 8px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerSm};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const CheckpointGroup = styled.div`
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceBright};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
  overflow: hidden;
`;

const CheckpointHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => (theme as StyledTheme).space400};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const CheckpointHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
`;

const CheckpointTitleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CheckpointTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const CheckpointSub = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const CheckpointBody = styled.div`
  display: flex;
  flex-direction: column;
`;

const StepRow = styled.div`
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  align-items: center;
  padding: ${({ theme }) => (theme as StyledTheme).space400};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  cursor: pointer;
  transition: background-color 120ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const StepIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StepBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const StepTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const StepMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const StepMetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const StepActions = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as StyledTheme).space100};
  align-items: center;
`;

const AddStepRow = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
  padding: ${({ theme }) => (theme as StyledTheme).space300}
    ${({ theme }) => (theme as StyledTheme).space400};
  width: 100%;
  background: none;
  border: none;
  border-top: 1px dashed ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  cursor: pointer;
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};

  &:hover {
    color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => (theme as StyledTheme).space400};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
`;

const SourceAppNote = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerHigh};
  padding: 2px 8px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerSm};
`;

const DrawerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space600};
`;

const DrawerSectionTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  align-items: center;
`;

const FieldLabel = styled.label`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const ReminderChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => (theme as StyledTheme).space100};
`;

const ReminderChip = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  padding: 4px 10px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerFull};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const SchemaPreview = styled.pre`
  ${({ theme }) => (theme as StyledTheme).typestyleV2CodeSmall};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerHighest};
  padding: ${({ theme }) => (theme as StyledTheme).space400};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  overflow-x: auto;
  margin: 0;
`;

const STEP_LIBRARY_GROUPS: Array<{ title: string; types: StepType[] }> = [
  {
    title: 'Rippling apps',
    types: ['hris', 'background_check', 'device', 'benefits', 'lms', 'app_provisioning'],
  },
  { title: 'Workflow Studio', types: ['notification', 'automation_hook'] },
  { title: 'Tasks', types: ['custom_task'] },
];

function audienceLabel(t: JourneyTemplate): string {
  const parts: string[] = [];
  if (t.audience.workLocation) parts.push(t.audience.workLocation);
  if (t.audience.employmentType) parts.push(t.audience.employmentType);
  if (t.audience.department) parts.push(t.audience.department);
  return parts.join(' · ') || 'No audience configured';
}

function newStepFromType(type: StepType, checkpoint: Checkpoint): JourneyStep {
  const meta = STEP_TYPE_META[type];
  return {
    id: `new-${Date.now()}`,
    type,
    title: `New ${meta.label.toLowerCase()} step`,
    trigger: { kind: 'time_based', anchor: 'role.start_date', offsetDays: 0 },
    assignee: meta.defaultAssignee,
    dueDateLabel: 'role.start_date',
    blocking: 'non_blocking',
    checkpoint,
    workflowStudioSupported: meta.configuredVia !== 'source_app',
  };
}

const JourneyBuilderDemo: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedTemplate = params.get('template') ?? 'tmpl-us-salaried';

  const initialTemplate = TEMPLATES.find(t => t.id === requestedTemplate) ?? TEMPLATES[0];

  const [steps, setSteps] = useState<JourneyStep[]>(initialTemplate.steps);
  const [activeTab, setActiveTab] = useState(0);
  const [editingStep, setEditingStep] = useState<JourneyStep | null>(null);
  const [collapsedCheckpoints, setCollapsedCheckpoints] = useState<Set<Checkpoint>>(new Set());
  const [schemaOpen, setSchemaOpen] = useState(false);

  const stepsByCheckpoint = useMemo(() => {
    const out: Record<Checkpoint, JourneyStep[]> = {
      registered: [],
      day_1_ready: [],
      payroll_ready: [],
      fully_onboarded: [],
    };
    for (const s of steps) out[s.checkpoint].push(s);
    return out;
  }, [steps]);

  const toggleCheckpoint = (cp: Checkpoint) => {
    setCollapsedCheckpoints(prev => {
      const next = new Set(prev);
      if (next.has(cp)) next.delete(cp);
      else next.add(cp);
      return next;
    });
  };

  const addStep = (type: StepType, checkpoint: Checkpoint = 'day_1_ready') => {
    setSteps(prev => [...prev, newStepFromType(type, checkpoint)]);
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = (next: JourneyStep) => {
    setSteps(prev => prev.map(s => (s.id === next.id ? next : s)));
    setEditingStep(next);
  };

  const handleOpenTracker = () => navigate(`/journey-tracker?template=${initialTemplate.id}`);

  const pageActions = (
    <HStack gap="0.5rem">
      <Button
        appearance={Button.APPEARANCES.GHOST}
        size={Button.SIZES.M}
        onClick={() => setSchemaOpen(true)}
      >
        View schema
      </Button>
      <Button
        appearance={Button.APPEARANCES.OUTLINE}
        size={Button.SIZES.M}
        onClick={handleOpenTracker}
      >
        View tracker
      </Button>
      <Button appearance={Button.APPEARANCES.PRIMARY} size={Button.SIZES.M}>
        Save journey
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
      &nbsp;›&nbsp; {initialTemplate.name}
    </span>
  );

  return (
    <AppShellLayout
      pageTitle={initialTemplate.name}
      pageBreadcrumbs={breadcrumbs}
      pageTabs={['Steps', 'Audience', 'Reminders', 'Settings']}
      defaultActiveTab={activeTab}
      onTabChange={setActiveTab}
      pageActions={pageActions}
      defaultAdminMode
      companyName="Acme, Inc."
      userInitial="P"
    >
      <Layout>
        <Panel>
          <PanelTitle>Step library</PanelTitle>
          <PanelSubtitle>
            Click to add to the journey. Each type wraps an existing Rippling primitive.
          </PanelSubtitle>
          {STEP_LIBRARY_GROUPS.map(group => (
            <StepLibraryGroup key={group.title}>
              <StepLibraryGroupTitle>{group.title}</StepLibraryGroupTitle>
              {group.types.map(type => {
                const meta = STEP_TYPE_META[type];
                return (
                  <StepLibraryItem key={type} onClick={() => addStep(type)}>
                    <Icon type={meta.icon} size={16} />
                    <StepLibraryItemLabel>{meta.label}</StepLibraryItemLabel>
                  </StepLibraryItem>
                );
              })}
            </StepLibraryGroup>
          ))}
        </Panel>

        <Canvas>
          <CanvasHeader>
            <CanvasMeta>
              <AudienceLine>
                <Icon type={Icon.TYPES.PEOPLE_HEART_OUTLINE} size={14} />
                <span>Assigned to:</span>
                <Pill>{audienceLabel(initialTemplate)}</Pill>
                <span>· {initialTemplate.activeHires} active hires</span>
              </AudienceLine>
            </CanvasMeta>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Edited {initialTemplate.lastModified} by {initialTemplate.modifiedBy}
            </span>
          </CanvasHeader>

          {(Object.keys(CHECKPOINT_META) as Checkpoint[])
            .sort((a, b) => CHECKPOINT_META[a].order - CHECKPOINT_META[b].order)
            .map(cp => {
              const cpSteps = stepsByCheckpoint[cp];
              const isCollapsed = collapsedCheckpoints.has(cp);
              return (
                <CheckpointGroup key={cp}>
                  <CheckpointHeader onClick={() => toggleCheckpoint(cp)}>
                    <CheckpointHeaderLeft>
                      <Icon
                        type={isCollapsed ? Icon.TYPES.CHEVRON_RIGHT : Icon.TYPES.CHEVRON_DOWN}
                        size={16}
                      />
                      <CheckpointTitleText>
                        <CheckpointTitle>{CHECKPOINT_META[cp].label}</CheckpointTitle>
                        <CheckpointSub>{CHECKPOINT_META[cp].description}</CheckpointSub>
                      </CheckpointTitleText>
                    </CheckpointHeaderLeft>
                    <Pill>
                      {cpSteps.length} {cpSteps.length === 1 ? 'step' : 'steps'}
                    </Pill>
                  </CheckpointHeader>
                  {!isCollapsed && (
                    <CheckpointBody>
                      {cpSteps.map(s => {
                        const meta = STEP_TYPE_META[s.type];
                        return (
                          <StepRow key={s.id} onClick={() => setEditingStep(s)}>
                            <StepIcon>
                              <Icon type={meta.icon} size={14} />
                            </StepIcon>
                            <StepBody>
                              <StepTitle>{s.title}</StepTitle>
                              <StepMeta>
                                <StepMetaItem>
                                  <Icon type={Icon.TYPES.THUNDERBOLT_OUTLINE} size={12} />
                                  {describeTrigger(s.trigger)}
                                </StepMetaItem>
                                <span>·</span>
                                <StepMetaItem>
                                  <Icon type={Icon.TYPES.CALENDAR_OUTLINE} size={12} />
                                  Due {s.dueDateLabel}
                                </StepMetaItem>
                                <span>·</span>
                                <StepMetaItem>
                                  <Icon type={Icon.TYPES.USER_CIRCLE_PLUS_OUTLINE} size={12} />
                                  {ASSIGNEE_LABEL[s.assignee]}
                                </StepMetaItem>
                                {s.blocking !== 'non_blocking' && (
                                  <>
                                    <span>·</span>
                                    <Status
                                      appearance={
                                        s.blocking === 'start'
                                          ? Status.APPEARANCES.WARNING
                                          : Status.APPEARANCES.TERTIARY
                                      }
                                      text={blockingLabel(s.blocking)}
                                      size={Status.SIZES.S}
                                      outlined
                                    />
                                  </>
                                )}
                                {meta.configuredVia === 'source_app' && (
                                  <SourceAppNote>
                                    <Icon type={Icon.TYPES.ARROW_RIGHT} size={10} />
                                    Configured in {meta.label} app
                                  </SourceAppNote>
                                )}
                              </StepMeta>
                            </StepBody>
                            <StepActions>
                              <Tip content="Edit step">
                                <span>
                                  <Button.Icon
                                    icon={Icon.TYPES.EDIT_OUTLINE}
                                    aria-label="Edit step"
                                    appearance={Button.APPEARANCES.GHOST}
                                    size={Button.SIZES.S}
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      setEditingStep(s);
                                    }}
                                  />
                                </span>
                              </Tip>
                              <Tip content="Delete step">
                                <span>
                                  <Button.Icon
                                    icon={Icon.TYPES.TRASH_OUTLINE}
                                    aria-label="Delete step"
                                    appearance={Button.APPEARANCES.GHOST}
                                    size={Button.SIZES.S}
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      removeStep(s.id);
                                    }}
                                  />
                                </span>
                              </Tip>
                            </StepActions>
                          </StepRow>
                        );
                      })}
                      <AddStepRow onClick={() => addStep('custom_task', cp)}>
                        <Icon type={Icon.TYPES.ADD} size={14} />
                        Add step to {CHECKPOINT_META[cp].label}
                      </AddStepRow>
                    </CheckpointBody>
                  )}
                </CheckpointGroup>
              );
            })}

          <FooterBar>
            <span style={{ fontSize: 13 }}>
              Saving will create / update Workflow Studio definitions for supported steps.
              Unsupported steps require config in their source app.
            </span>
            <Button
              appearance={Button.APPEARANCES.OUTLINE}
              size={Button.SIZES.S}
              onClick={handleOpenTracker}
            >
              View cohort tracker
            </Button>
          </FooterBar>
        </Canvas>
      </Layout>

      <Drawer
        isVisible={editingStep !== null}
        onCancel={() => setEditingStep(null)}
        title={editingStep ? `Edit step · ${STEP_TYPE_META[editingStep.type].label}` : ''}
        width={520}
      >
        {editingStep && (
          <div>
            <DrawerSection>
              <DrawerSectionTitle>Basics</DrawerSectionTitle>
              <FieldRow>
                <FieldLabel>Title</FieldLabel>
                <Input.Text
                  value={editingStep.title}
                  onChange={(v: string) => updateStep({ ...editingStep, title: v })}
                  size={Input.Text.SIZES.M}
                />
              </FieldRow>
              <FieldRow>
                <FieldLabel>Checkpoint</FieldLabel>
                <Input.Select
                  list={(Object.keys(CHECKPOINT_META) as Checkpoint[]).map(k => ({
                    label: CHECKPOINT_META[k].label,
                    value: k,
                  }))}
                  value={editingStep.checkpoint}
                  onChange={(v: unknown) =>
                    updateStep({ ...editingStep, checkpoint: v as Checkpoint })
                  }
                />
              </FieldRow>
              <FieldRow>
                <FieldLabel>Blocking</FieldLabel>
                <Input.Select
                  list={[
                    { label: 'Blocks Day 1', value: 'start' },
                    { label: 'Blocks payroll', value: 'payroll' },
                    { label: 'Non-blocking', value: 'non_blocking' },
                  ]}
                  value={editingStep.blocking}
                  onChange={(v: unknown) =>
                    updateStep({
                      ...editingStep,
                      blocking: v as 'start' | 'payroll' | 'non_blocking',
                    })
                  }
                />
              </FieldRow>
            </DrawerSection>

            <DrawerSection>
              <DrawerSectionTitle>Trigger</DrawerSectionTitle>
              <FieldRow>
                <FieldLabel>Type</FieldLabel>
                <Input.Select
                  list={[
                    { label: 'Time-based', value: 'time_based' },
                    { label: 'Data change', value: 'data_change' },
                  ]}
                  value={editingStep.trigger.kind}
                  onChange={(v: unknown) =>
                    updateStep({
                      ...editingStep,
                      trigger: { ...editingStep.trigger, kind: v as 'time_based' | 'data_change' },
                    })
                  }
                />
              </FieldRow>
              {editingStep.trigger.kind === 'time_based' ? (
                <>
                  <FieldRow>
                    <FieldLabel>Anchor</FieldLabel>
                    <Input.Select
                      list={[
                        { label: 'role.start_date', value: 'role.start_date' },
                        { label: 'role.hire_date', value: 'role.hire_date' },
                        { label: 'role.offer_expiry_date', value: 'role.offer_expiry_date' },
                      ]}
                      value={editingStep.trigger.anchor ?? 'role.start_date'}
                      onChange={(v: unknown) =>
                        updateStep({
                          ...editingStep,
                          trigger: {
                            ...editingStep.trigger,
                            anchor: v as
                              | 'role.start_date'
                              | 'role.hire_date'
                              | 'role.offer_expiry_date',
                          },
                        })
                      }
                    />
                  </FieldRow>
                  <FieldRow>
                    <FieldLabel>Offset (days)</FieldLabel>
                    <Input.Text
                      value={String(editingStep.trigger.offsetDays ?? 0)}
                      onChange={(v: string) =>
                        updateStep({
                          ...editingStep,
                          trigger: { ...editingStep.trigger, offsetDays: parseInt(v, 10) || 0 },
                        })
                      }
                      size={Input.Text.SIZES.M}
                    />
                  </FieldRow>
                </>
              ) : (
                <>
                  <FieldRow>
                    <FieldLabel>Field</FieldLabel>
                    <Input.Text
                      value={editingStep.trigger.field ?? ''}
                      onChange={(v: string) =>
                        updateStep({
                          ...editingStep,
                          trigger: { ...editingStep.trigger, field: v },
                        })
                      }
                      size={Input.Text.SIZES.M}
                    />
                  </FieldRow>
                  <FieldRow>
                    <FieldLabel>From → To</FieldLabel>
                    <HStack gap="0.5rem">
                      <Input.Text
                        value={editingStep.trigger.fieldValueBefore ?? ''}
                        onChange={(v: string) =>
                          updateStep({
                            ...editingStep,
                            trigger: { ...editingStep.trigger, fieldValueBefore: v },
                          })
                        }
                        size={Input.Text.SIZES.M}
                      />
                      <Input.Text
                        value={editingStep.trigger.fieldValueAfter ?? ''}
                        onChange={(v: string) =>
                          updateStep({
                            ...editingStep,
                            trigger: { ...editingStep.trigger, fieldValueAfter: v },
                          })
                        }
                        size={Input.Text.SIZES.M}
                      />
                    </HStack>
                  </FieldRow>
                </>
              )}
            </DrawerSection>

            <DrawerSection>
              <DrawerSectionTitle>Assignee</DrawerSectionTitle>
              <FieldRow>
                <FieldLabel>Role</FieldLabel>
                <Input.Select
                  list={(Object.keys(ASSIGNEE_LABEL) as Array<keyof typeof ASSIGNEE_LABEL>).map(
                    k => ({
                      label: ASSIGNEE_LABEL[k],
                      value: k,
                    }),
                  )}
                  value={editingStep.assignee}
                  onChange={(v: unknown) =>
                    updateStep({ ...editingStep, assignee: v as typeof editingStep.assignee })
                  }
                />
              </FieldRow>
              <FieldRow>
                <FieldLabel>Due date</FieldLabel>
                <Input.Text
                  value={editingStep.dueDateLabel}
                  onChange={(v: string) => updateStep({ ...editingStep, dueDateLabel: v })}
                  size={Input.Text.SIZES.M}
                />
              </FieldRow>
            </DrawerSection>

            <DrawerSection>
              <DrawerSectionTitle>Reminders</DrawerSectionTitle>
              <PanelSubtitle>
                Reminders fire automatically based on the schedule below. They write to the same
                schema the v2 PRD specifies.
              </PanelSubtitle>
              <FieldRow>
                <FieldLabel>Before due</FieldLabel>
                <ReminderChips>
                  <ReminderChip>
                    {editingStep.reminders?.primary.fireIfDaysBeforeDueDate ?? '—'} days
                  </ReminderChip>
                </ReminderChips>
              </FieldRow>
              <FieldRow>
                <FieldLabel>After due</FieldLabel>
                <ReminderChips>
                  {(editingStep.reminders?.primary.fireIfDaysAfterDueDate ?? []).map(d => (
                    <ReminderChip key={d}>+{d} days</ReminderChip>
                  ))}
                  {!editingStep.reminders && <ReminderChip>None configured</ReminderChip>}
                </ReminderChips>
              </FieldRow>
            </DrawerSection>

            {STEP_TYPE_META[editingStep.type].configuredVia === 'source_app' && (
              <DrawerSection>
                <DrawerSectionTitle>Configure in source app</DrawerSectionTitle>
                <PanelSubtitle>
                  This step type owns its config in the {STEP_TYPE_META[editingStep.type].label}{' '}
                  app. Click below to deep-link there. Status will reflect back into the journey.
                </PanelSubtitle>
                <Button appearance={Button.APPEARANCES.OUTLINE} size={Button.SIZES.S}>
                  Open {STEP_TYPE_META[editingStep.type].label} settings
                </Button>
              </DrawerSection>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        isVisible={schemaOpen}
        onCancel={() => setSchemaOpen(false)}
        title="onboarding_journey schema"
        width={640}
      >
        <PanelSubtitle>
          The builder writes to the same JSON contract as the AI chat experience. Both surfaces can
          read / write this schema.
        </PanelSubtitle>
        <SchemaPreview>
          {JSON.stringify(
            {
              template_id: initialTemplate.id,
              name: initialTemplate.name,
              audience: initialTemplate.audience,
              steps: steps.map(s => ({
                step_id: s.id,
                type: s.type,
                title: s.title,
                trigger: s.trigger,
                assignee: s.assignee,
                due_date: s.dueDateLabel,
                blocking: s.blocking,
                checkpoint: s.checkpoint,
                reminders: s.reminders,
              })),
            },
            null,
            2,
          )}
        </SchemaPreview>
      </Drawer>
    </AppShellLayout>
  );
};

export default JourneyBuilderDemo;
