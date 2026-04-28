import React from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { StyledTheme } from '@/utils/theme';
import { AppShellLayout } from '@/components/app-shell';
import Button from '@rippling/pebble/Button';
import Card from '@rippling/pebble/Card';
import Icon from '@rippling/pebble/Icon';
import Status from '@rippling/pebble/Status';
import Tip from '@rippling/pebble/Tip';
import { HStack } from '@rippling/pebble/Layout/Stack';
import { TEMPLATES, JourneyTemplate, CHECKPOINT_META } from '@/demos/journey-data';

/**
 * Journey Gallery
 *
 * Entry point for the Onboarding Journeys experience. Shows:
 * - Active journeys (cohort + audience + # active hires + last modified)
 * - Rippling default templates (clone to start)
 * - Discovered Workflow Studio workflows that look onboarding-related
 *
 * Click a journey card → opens the Builder.
 * Click "View tracker" on an active journey → opens the Tracker.
 */

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space800};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
`;

const SectionTitle = styled.h2`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin: 0;
`;

const SectionSubtitle = styled.p`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin: 0 0 ${({ theme }) => (theme as StyledTheme).space400} 0;
  max-width: 720px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: ${({ theme }) => (theme as StyledTheme).space400};
`;

const TemplateCardClickable = styled.div`
  cursor: pointer;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CardInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  height: 100%;
`;

const CardTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
`;

const TemplateName = styled.h3`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin: 0;
`;

const TemplateDescription = styled.p`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin: 0;
`;

const AudienceChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => (theme as StyledTheme).space100};
  margin-top: ${({ theme }) => (theme as StyledTheme).space200};
`;

const AudienceChip = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  padding: ${({ theme }) => (theme as StyledTheme).space100}
    ${({ theme }) => (theme as StyledTheme).space200};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerSm};
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: ${({ theme }) => (theme as StyledTheme).space300};
  border-top: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const FooterMeta = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const TrackerLink = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerSm};

  &:hover {
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
    text-decoration: underline;
  }
`;

const StepCount = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const NewTemplateCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => (theme as StyledTheme).space800};
  border: 2px dashed ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
  height: 100%;
  min-height: 200px;

  &:hover {
    border-color: ${({ theme }) => (theme as StyledTheme).colorOutline};
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const NewTemplateTitle = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin-top: ${({ theme }) => (theme as StyledTheme).space300};
`;

const NewTemplateCaption = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin-top: ${({ theme }) => (theme as StyledTheme).space100};
  max-width: 240px;
`;

const InfoBanner = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
  padding: ${({ theme }) => (theme as StyledTheme).space400};
  border: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
`;

const InfoBannerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space100};
  flex: 1;
`;

const InfoBannerTitle = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const InfoBannerText = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

function audienceChips(t: JourneyTemplate): string[] {
  const out: string[] = [];
  if (t.audience.workLocation) out.push(t.audience.workLocation);
  if (t.audience.employmentType) out.push(t.audience.employmentType);
  if (t.audience.department) out.push(t.audience.department);
  return out;
}

function checkpointSummary(t: JourneyTemplate): string {
  const used = new Set(t.steps.map(s => s.checkpoint));
  const ordered = (Object.keys(CHECKPOINT_META) as Array<keyof typeof CHECKPOINT_META>)
    .filter(k => used.has(k))
    .sort((a, b) => CHECKPOINT_META[a].order - CHECKPOINT_META[b].order);
  return ordered.map(k => CHECKPOINT_META[k].label).join(' → ');
}

const JourneyGalleryDemo: React.FC = () => {
  const navigate = useNavigate();

  const activeTemplates = TEMPLATES.filter(t => t.status === 'active');
  const ripplingDefaults = TEMPLATES.filter(t => t.status === 'rippling_default');

  const handleOpenBuilder = (templateId: string) =>
    navigate(`/journey-builder?template=${templateId}`);
  const handleOpenTracker = (templateId: string) =>
    navigate(`/journey-tracker?template=${templateId}`);

  const pageActions = (
    <HStack gap="0.5rem">
      <Button appearance={Button.APPEARANCES.OUTLINE} size={Button.SIZES.M}>
        Import journey
      </Button>
      <Button
        appearance={Button.APPEARANCES.PRIMARY}
        size={Button.SIZES.M}
        onClick={() => handleOpenBuilder('tmpl-default-rippling')}
      >
        Create journey
      </Button>
    </HStack>
  );

  return (
    <AppShellLayout
      pageTitle="Onboarding journeys"
      pageBreadcrumbs={
        <span style={{ fontSize: 13, color: 'inherit' }}>
          HR &nbsp;›&nbsp; Onboarding &nbsp;›&nbsp; Journeys
        </span>
      }
      pageActions={pageActions}
      defaultAdminMode
      companyName="Acme, Inc."
      userInitial="P"
      showNotificationBadge
      notificationCount={3}
    >
      <Page>
        <InfoBanner>
          <Icon type={Icon.TYPES.THUNDERBOLT_OUTLINE} size={20} />
          <InfoBannerBody>
            <InfoBannerTitle>
              3 existing Workflow Studio workflows look onboarding-related
            </InfoBannerTitle>
            <InfoBannerText>
              We found workflows triggered by <code>role.start_date</code> and onboarding state
              changes. Attach them to a journey to avoid duplicates, or ignore.
            </InfoBannerText>
          </InfoBannerBody>
          <Button appearance={Button.APPEARANCES.GHOST} size={Button.SIZES.S}>
            Review
          </Button>
        </InfoBanner>

        <section>
          <SectionHeader>
            <div>
              <SectionTitle>Active journeys</SectionTitle>
            </div>
            <SectionSubtitle as="span" style={{ margin: 0 }}>
              {activeTemplates.length} templates ·{' '}
              {activeTemplates.reduce((a, t) => a + t.activeHires, 0)} active hires
            </SectionSubtitle>
          </SectionHeader>

          <Grid>
            {activeTemplates.map(t => (
              <TemplateCardClickable key={t.id} onClick={() => handleOpenBuilder(t.id)}>
                <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                  <CardInner>
                    <CardTopRow>
                      <div>
                        <TemplateName>{t.name}</TemplateName>
                      </div>
                      <Status
                        appearance={Status.APPEARANCES.SUCCESS}
                        text="Active"
                        size={Status.SIZES.S}
                        outlined
                      />
                    </CardTopRow>
                    <TemplateDescription>{t.description}</TemplateDescription>
                    <AudienceChips>
                      {audienceChips(t).map(c => (
                        <AudienceChip key={c}>{c}</AudienceChip>
                      ))}
                    </AudienceChips>
                    <StepCount>
                      <Icon type={Icon.TYPES.HIERARCHY_HORIZONTAL_OUTLINE} size={14} />
                      <span>
                        {t.steps.length} steps · {checkpointSummary(t)}
                      </span>
                    </StepCount>
                    <Footer>
                      <FooterMeta>
                        {t.activeHires} active · edited {t.lastModified}
                      </FooterMeta>
                      <Tip content="Open tracker for this cohort" placement={Tip.PLACEMENTS.TOP}>
                        <TrackerLink
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenTracker(t.id);
                          }}
                        >
                          View tracker
                          <Icon type={Icon.TYPES.ARROW_RIGHT} size={12} />
                        </TrackerLink>
                      </Tip>
                    </Footer>
                  </CardInner>
                </Card.Layout>
              </TemplateCardClickable>
            ))}

            <NewTemplateCard onClick={() => handleOpenBuilder('tmpl-default-rippling')}>
              <Icon type={Icon.TYPES.ADD_CIRCLE_OUTLINE} size={24} />
              <NewTemplateTitle>New journey</NewTemplateTitle>
              <NewTemplateCaption>
                Start blank or clone a Rippling default. Assign to a cohort by audience.
              </NewTemplateCaption>
            </NewTemplateCard>
          </Grid>
        </section>

        <section>
          <SectionHeader>
            <div>
              <SectionTitle>Rippling templates</SectionTitle>
            </div>
          </SectionHeader>
          <SectionSubtitle>
            Pre-built journeys you can clone and adapt. Each ships with sensible defaults for
            triggers, assignees, and reminders.
          </SectionSubtitle>

          <Grid>
            {ripplingDefaults.map(t => (
              <TemplateCardClickable key={t.id} onClick={() => handleOpenBuilder(t.id)}>
                <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                  <CardInner>
                    <CardTopRow>
                      <div>
                        <TemplateName>{t.name}</TemplateName>
                      </div>
                      <Status
                        appearance={Status.APPEARANCES.TERTIARY}
                        text="Rippling"
                        size={Status.SIZES.S}
                        outlined
                      />
                    </CardTopRow>
                    <TemplateDescription>{t.description}</TemplateDescription>
                    <StepCount>
                      <Icon type={Icon.TYPES.HIERARCHY_HORIZONTAL_OUTLINE} size={14} />
                      <span>
                        {t.steps.length} steps · {checkpointSummary(t)}
                      </span>
                    </StepCount>
                    <Footer>
                      <FooterMeta>{t.lastModified}</FooterMeta>
                      <TrackerLink
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenBuilder(t.id);
                        }}
                      >
                        Clone & customize
                        <Icon type={Icon.TYPES.ARROW_RIGHT} size={12} />
                      </TrackerLink>
                    </Footer>
                  </CardInner>
                </Card.Layout>
              </TemplateCardClickable>
            ))}
          </Grid>
        </section>
      </Page>
    </AppShellLayout>
  );
};

export default JourneyGalleryDemo;
