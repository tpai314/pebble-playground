import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { usePebbleTheme, StyledTheme } from '@/utils/theme';
import { useNavigate } from 'react-router-dom';
import Icon from '@rippling/pebble/Icon';
import Card from '@rippling/pebble/Card';
import Status from '@rippling/pebble/Status';
import Button from '@rippling/pebble/Button';
import Drawer from '@rippling/pebble/Drawer';
import TableBasic from '@rippling/pebble/TableBasic';
import Tabs from '@rippling/pebble/Tabs';
import Tip from '@rippling/pebble/Tip';
import ActionCard from '@rippling/pebble/ActionCard';
import { HStack } from '@rippling/pebble/Layout/Stack';

/**
 * Index Page
 *
 * Landing page for the Pebble Playground showing all available demos.
 */

type DemoCategory = 'template' | 'prototype';

interface DemoCard {
  title: string;
  description: string;
  path: string;
  icon: string;
  category: DemoCategory;
}

// All demos in the playground
const ALL_DEMOS: DemoCard[] = [
  {
    title: 'Onboarding Journey Gallery',
    description:
      'Browse active onboarding journeys and Rippling templates. Entry point for the Journey Builder.',
    path: '/journey-gallery',
    icon: Icon.TYPES.PEOPLE_HEART_OUTLINE,
    category: 'prototype',
  },
  {
    title: 'Onboarding Journey Builder',
    description:
      'Compose onboarding journeys from a typed step library — alternative to the AI chat builder in PRD v2.',
    path: '/journey-builder',
    icon: Icon.TYPES.HIERARCHY_HORIZONTAL_OUTLINE,
    category: 'prototype',
  },
  {
    title: 'Onboarding Journey Tracker',
    description: 'Cohort-specific tracker. Per-step status matrix with a "what\'s blocked" rail.',
    path: '/journey-tracker',
    icon: Icon.TYPES.CLIPBOARD_CROSS_CHECK_OUTLINE,
    category: 'prototype',
  },
  // Templates - starting points you copy
  {
    title: 'App Shell Template',
    description:
      'The main template to copy when creating a new demo. Includes navigation, sidebar, and content areas.',
    path: '/app-shell-template',
    icon: Icon.TYPES.HIERARCHY_HORIZONTAL_OUTLINE,
    category: 'template',
  },
];

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurface};
  padding: ${({ theme }) => (theme as StyledTheme).space1600}
    ${({ theme }) => (theme as StyledTheme).space800};
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space1000};
`;

const GreetingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
`;

const GreetingText = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  opacity: 0.7;
`;

const Title = styled.h1`
  ${({ theme }) => (theme as StyledTheme).typestyleV2DisplayMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin: 0 0 ${({ theme }) => (theme as StyledTheme).space400} 0;
`;

const Description = styled.div`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  max-width: 800px;
  line-height: 1.6;

  a {
    color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ShareGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space200};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => (theme as StyledTheme).space800};
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space600};
`;

const ViewToggleButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerLg};
  cursor: pointer;
  transition: background-color 150ms ease;
  background-color: ${({ theme, isActive }) =>
    isActive ? (theme as StyledTheme).colorSurfaceContainerHigh : 'transparent'};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};

  &:hover {
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${({ theme }) => (theme as StyledTheme).space600};
`;

const DemoTableWrapper = styled.div`
  margin-top: ${({ theme }) => (theme as StyledTheme).space200};

  /* Hover effect for table rows */
  tr {
    transition: background-color 150ms ease;

    &:hover {
      background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
    }
  }
`;

const DemoTableName = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
`;

const DemoTableDescription = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const DemoCardWrapper = styled.div`
  cursor: pointer;
  transition: transform 150ms ease;

  &:hover {
    transform: translateY(-4px);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerFull};
  background-color: ${({ theme }) => (theme as StyledTheme).colorPrimaryVariant};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space400};
`;

const CardTitle = styled.h2`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin: 0 0 ${({ theme }) => (theme as StyledTheme).space200} 0;
`;

const CardDescription = styled.p`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin: 0;
  line-height: 1.5;
`;

const DrawerContent = styled.div``;

const InstructionSection = styled.div`
  margin-bottom: ${({ theme }) => (theme as StyledTheme).space800};

  &:last-child {
    margin-bottom: 0;
  }
`;

const InstructionTitle = styled.h3`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin: 0 0 ${({ theme }) => (theme as StyledTheme).space400} 0;
`;

const InstructionText = styled.p`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin: 0 0 ${({ theme }) => (theme as StyledTheme).space300} 0;
  line-height: 1.6;
`;

const CodeSnippet = styled.code`
  ${({ theme }) => (theme as StyledTheme).typestyleV2CodeMedium};
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  padding: ${({ theme }) => (theme as StyledTheme).space200}
    ${({ theme }) => (theme as StyledTheme).space300};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCornerM};
  color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
  display: inline-block;
  margin: ${({ theme }) => (theme as StyledTheme).space200} 0;
`;

const StepNumber = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2LabelLarge};
  color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
  font-weight: 600;
  margin-right: ${({ theme }) => (theme as StyledTheme).space200};
`;

const EmptyStateWrapper = styled.div`
  border: 2px dashed ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  border-radius: ${({ theme }) => (theme as StyledTheme).shapeCorner2xl};
  padding: ${({ theme }) => (theme as StyledTheme).space400};
  overflow: hidden;
`;

const CreateNewCard = styled.div`
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

  &:hover {
    border-color: ${({ theme }) => (theme as StyledTheme).colorOutline};
    background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceContainerLow};
  }
`;

const CreateNewTitle = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin-top: ${({ theme }) => (theme as StyledTheme).space400};
`;

const CreateNewCaption = styled.span`
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyMedium};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
  margin-top: ${({ theme }) => (theme as StyledTheme).space100};
`;

const GuidesSection = styled.div`
  margin-top: ${({ theme }) => (theme as StyledTheme).space800};
  padding-top: ${({ theme }) => (theme as StyledTheme).space600};
  border-top: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
`;

const GuidesTitle = styled.h3`
  ${({ theme }) => (theme as StyledTheme).typestyleV2TitleSmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurface};
  margin: 0 0 ${({ theme }) => (theme as StyledTheme).space300} 0;
`;

const GuidesList = styled.ul`
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SkillsSection = styled.div`
  margin-top: ${({ theme }) => (theme as StyledTheme).space600};
`;

const SkillsList = styled.ul`
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodySmall};
  color: ${({ theme }) => (theme as StyledTheme).colorOnSurfaceVariant};
`;

const GuideLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => (theme as StyledTheme).colorPrimary};
  ${({ theme }) => (theme as StyledTheme).typestyleV2BodyMedium};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const DemoTableView: React.FC<{
  demos: DemoCard[];
  navigate: (path: string) => void;
  theme: any;
}> = ({ demos, navigate, theme }) => (
  <DemoTableWrapper>
    <TableBasic>
      <TableBasic.THead>
        <TableBasic.Tr>
          <TableBasic.Th>Name</TableBasic.Th>
          <TableBasic.Th>Description</TableBasic.Th>
        </TableBasic.Tr>
      </TableBasic.THead>
      <TableBasic.TBody>
        {demos.map(demo => (
          <TableBasic.Tr
            key={demo.path}
            onClick={() => navigate(demo.path)}
            style={{ cursor: 'pointer' }}
          >
            <TableBasic.Td>
              <HStack gap="0.5rem">
                <Icon type={demo.icon} size={16} color={theme.colorPrimary} />
                <DemoTableName theme={theme}>{demo.title}</DemoTableName>
              </HStack>
            </TableBasic.Td>
            <TableBasic.Td>
              <DemoTableDescription theme={theme}>{demo.description}</DemoTableDescription>
            </TableBasic.Td>
          </TableBasic.Tr>
        ))}
      </TableBasic.TBody>
    </TableBasic>
  </DemoTableWrapper>
);

const IndexPage: React.FC = () => {
  const { theme } = usePebbleTheme();
  const navigate = useNavigate();
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeployDrawerOpen, setIsDeployDrawerOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copied, setCopied] = useState(false);

  const shareableUrl =
    import.meta.env.VITE_DEPLOY_URL ||
    (window.location.hostname.includes('localhost') ? '' : window.location.origin);
  const hasShareableUrl = !!shareableUrl;

  const copyPlaygroundUrl = useCallback(() => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareableUrl]);

  // Tab configuration: Prototypes (default), Templates, Design System
  type TabKey = 'prototype' | 'template' | 'design-system';
  const tabKeys: TabKey[] = ['prototype', 'template', 'design-system'];
  const activeTab = tabKeys[activeTabIndex];
  const prototypes = ALL_DEMOS.filter(d => d.category === 'prototype');
  const templates = ALL_DEMOS.filter(d => d.category === 'template');

  // Get user preferences from environment (with safe fallbacks)
  const userName = import.meta.env.VITE_USER_NAME;

  // Create personalized greeting with fallback to "Rippler"
  const firstName = userName ? userName.split(' ')[0] : 'Rippler';

  return (
    <PageContainer theme={theme}>
      <ContentWrapper>
        <Header theme={theme}>
          <GreetingRow theme={theme}>
            <GreetingText theme={theme}>Hi {firstName}</GreetingText>
            <ShareGroup>
              {hasShareableUrl ? (
                <>
                  <Status
                    appearance={Status.APPEARANCES.SUCCESS}
                    text="Preview URL ready"
                    size={Status.SIZES.XL}
                    outlined
                  />
                  <Tip content={copied ? 'Copied!' : 'Copy link'} placement={Tip.PLACEMENTS.BOTTOM}>
                    <span>
                      <Button.Icon
                        icon={copied ? Icon.TYPES.CHECK : Icon.TYPES.COPY_OUTLINE}
                        aria-label="Copy playground URL"
                        appearance={Button.APPEARANCES.GHOST}
                        size={Button.SIZES.XS}
                        onClick={copyPlaygroundUrl}
                      />
                    </span>
                  </Tip>
                </>
              ) : (
                <Tip
                  content="Push to GitHub, then run: npm run preview-url"
                  placement={Tip.PLACEMENTS.BOTTOM}
                >
                  <span>
                    <Status
                      appearance={Status.APPEARANCES.WARNING}
                      text="No preview URL"
                      size={Status.SIZES.XL}
                      outlined
                    />
                  </span>
                </Tip>
              )}
            </ShareGroup>
          </GreetingRow>
          <Title theme={theme}>Welcome to your playground</Title>
          <Description theme={theme}>
            A prototyping environment for exploring and building with Rippling's Pebble Design
            System. Experiment with components, tokens, and patterns in an interactive sandbox.{' '}
            <GuideLink onClick={() => setIsGettingStartedOpen(true)}>
              Learn how to get started
            </GuideLink>{' '}
            creating your own demos.
          </Description>
        </Header>

        {/* Tabs and View Toggle */}
        <SectionHeader theme={theme}>
          <Tabs.SWITCH
            activeIndex={activeTabIndex}
            onChange={index => setActiveTabIndex(Number(index))}
          >
            <Tabs.Tab title="Prototypes" />
            <Tabs.Tab title="Templates" />
            <Tabs.Tab title="Design System" />
          </Tabs.SWITCH>

          {(activeTab === 'prototype' || activeTab === 'template') && (
            <HStack gap="0.25rem">
              <Tip content="Grid view" placement={Tip.PLACEMENTS.BOTTOM}>
                <ViewToggleButton
                  theme={theme}
                  isActive={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Icon type={Icon.TYPES.BENTO_BOX} size={16} />
                </ViewToggleButton>
              </Tip>
              <Tip content="Table view" placement={Tip.PLACEMENTS.BOTTOM}>
                <ViewToggleButton
                  theme={theme}
                  isActive={viewMode === 'table'}
                  onClick={() => setViewMode('table')}
                  aria-label="Table view"
                >
                  <Icon type={Icon.TYPES.LIST_OUTLINE} size={16} />
                </ViewToggleButton>
              </Tip>
            </HStack>
          )}
        </SectionHeader>

        {/* Prototypes Tab */}
        {activeTab === 'prototype' &&
          (prototypes.length === 0 ? (
            <EmptyStateWrapper theme={theme}>
              <ActionCard
                icon={Icon.TYPES.ADD_CIRCLE_OUTLINE}
                title="No prototypes yet"
                caption='Create your first prototype by copying the app shell template. Ask your AI tool: "Create a new demo called My Feature"'
                primaryAction={{
                  title: 'How to create a prototype',
                  onClick: () => setIsDrawerOpen(true),
                }}
              />
            </EmptyStateWrapper>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <DemoGrid theme={theme}>
                  {prototypes.map(demo => (
                    <DemoCardWrapper key={demo.path} onClick={() => navigate(demo.path)}>
                      <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                        <CardContent>
                          <CardIcon theme={theme}>
                            <Icon type={demo.icon} size={24} color={theme.colorPrimary} />
                          </CardIcon>
                          <CardTitle theme={theme}>{demo.title}</CardTitle>
                          <CardDescription theme={theme}>{demo.description}</CardDescription>
                        </CardContent>
                      </Card.Layout>
                    </DemoCardWrapper>
                  ))}
                  <CreateNewCard onClick={() => setIsDrawerOpen(true)} theme={theme}>
                    <Icon type={Icon.TYPES.ADD_CIRCLE_OUTLINE} size={24} />
                    <CreateNewTitle theme={theme}>New prototype</CreateNewTitle>
                    <CreateNewCaption theme={theme}>
                      Copy the template to start building
                    </CreateNewCaption>
                  </CreateNewCard>
                </DemoGrid>
              ) : (
                <DemoTableView demos={prototypes} navigate={navigate} theme={theme} />
              )}
            </>
          ))}

        {/* Templates Tab */}
        {activeTab === 'template' &&
          (viewMode === 'grid' ? (
            <DemoGrid theme={theme}>
              {templates.map(demo => (
                <DemoCardWrapper key={demo.path} onClick={() => navigate(demo.path)}>
                  <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                    <CardContent>
                      <CardIcon theme={theme}>
                        <Icon type={demo.icon} size={24} color={theme.colorPrimary} />
                      </CardIcon>
                      <CardTitle theme={theme}>{demo.title}</CardTitle>
                      <CardDescription theme={theme}>{demo.description}</CardDescription>
                    </CardContent>
                  </Card.Layout>
                </DemoCardWrapper>
              ))}
            </DemoGrid>
          ) : (
            <DemoTableView demos={templates} navigate={navigate} theme={theme} />
          ))}

        {/* Design System Tab */}
        {activeTab === 'design-system' && (
          <DemoGrid theme={theme}>
            <DemoCardWrapper
              onClick={() =>
                window.open(
                  'https://rippling.design/pebble?path=/docs/overview-design-tokens-tokens--docs',
                  '_blank',
                )
              }
            >
              <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                <CardContent>
                  <CardIcon theme={theme}>
                    <Icon
                      type={Icon.TYPES.PAINT_ROLLER_OUTLINE}
                      size={24}
                      color={theme.colorPrimary}
                    />
                  </CardIcon>
                  <CardTitle theme={theme}>Tokens</CardTitle>
                  <CardDescription theme={theme}>
                    Design tokens for colors, spacing, typography, and shape. The foundation of all
                    Pebble styling.
                  </CardDescription>
                </CardContent>
              </Card.Layout>
            </DemoCardWrapper>

            <DemoCardWrapper
              onClick={() => window.open('https://rippling.design/pebble', '_blank')}
            >
              <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                <CardContent>
                  <CardIcon theme={theme}>
                    <Icon
                      type={Icon.TYPES.PUZZLE_PIECE_OUTLINE}
                      size={24}
                      color={theme.colorPrimary}
                    />
                  </CardIcon>
                  <CardTitle theme={theme}>Web Components</CardTitle>
                  <CardDescription theme={theme}>
                    Browse all Pebble web components, their props, and interactive examples.
                  </CardDescription>
                </CardContent>
              </Card.Layout>
            </DemoCardWrapper>

            <DemoCardWrapper
              onClick={() => window.open('https://rippling.design/pebble-mobile', '_blank')}
            >
              <Card.Layout padding={Card.Layout.PADDINGS.PX_24}>
                <CardContent>
                  <CardIcon theme={theme}>
                    <Icon type={Icon.TYPES.IPHONE_OUTLINE} size={24} color={theme.colorPrimary} />
                  </CardIcon>
                  <CardTitle theme={theme}>Mobile Components</CardTitle>
                  <CardDescription theme={theme}>
                    Pebble's mobile component library for iOS and Android.
                  </CardDescription>
                </CardContent>
              </Card.Layout>
            </DemoCardWrapper>
          </DemoGrid>
        )}

        {/* Guides */}
        <GuidesSection theme={theme}>
          <GuidesTitle theme={theme}>Guides</GuidesTitle>
          <GuidesList>
            <li>
              <GuideLink onClick={() => setIsGettingStartedOpen(true)}>Getting started</GuideLink>
            </li>
            <li>
              <GuideLink onClick={() => setIsDrawerOpen(true)}>Creating a prototype</GuideLink>
            </li>
            <li>
              <GuideLink onClick={() => setIsDeployDrawerOpen(true)}>
                Deploying &amp; sharing
              </GuideLink>
            </li>
          </GuidesList>
        </GuidesSection>

        <SkillsSection theme={theme}>
          <GuidesTitle theme={theme}>Skills</GuidesTitle>
          <SkillsList theme={theme}>
            <li>
              New playground — <strong>"Start a new playground for Q2 explorations"</strong> or{' '}
              <strong>"Create a workspace for the Benefits Redesign"</strong>
            </li>
            <li>
              New prototype — <strong>"Add a prototype called Employee Onboarding"</strong> or{' '}
              <strong>"Build me a benefits dashboard"</strong>
            </li>
            <li>
              Deploy — <strong>"Deploy my playground"</strong> or{' '}
              <strong>"Share my workspace"</strong>
            </li>
          </SkillsList>
        </SkillsSection>
      </ContentWrapper>

      {/* Getting Started Drawer */}
      <Drawer
        isVisible={isGettingStartedOpen}
        onCancel={() => setIsGettingStartedOpen(false)}
        title="Getting Started"
        width={600}
      >
        <DrawerContent theme={theme}>
          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>What is the Playground?</InstructionTitle>
            <InstructionText theme={theme}>
              The Playground is a space where anyone can build interactive prototypes using real
              Rippling components. You describe what you want in plain English, and an AI assistant
              builds it for you — no coding experience required.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>Playgrounds and prototypes</InstructionTitle>
            <InstructionText theme={theme}>
              Two concepts to know:
              <br />
              <br />A <strong>playground</strong> (also called a workspace) is your personal space
              for a project or theme — like "Q2 Explorations" or "Benefits Redesign". It's a branch
              that gets its own shareable URL when deployed.
              <br />
              <br />A <strong>prototype</strong> is a single demo page within your playground — like
              "Employee Onboarding" or "Time-Off Dashboard". You can have many prototypes in one
              playground, and they all share the same deploy URL.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>What you need</InstructionTitle>
            <InstructionText theme={theme}>
              • <strong>Cursor</strong> or <strong>Claude Code</strong> — your AI-powered editor
              <br />
              • This project cloned to your computer (ask your team if you need help)
              <br />• That's it. The AI handles everything else.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>Your first 5 minutes</InstructionTitle>
            <InstructionText theme={theme}>
              <strong>1.</strong> Open this project in Cursor or Claude Code.
              <br />
              <br />
              <strong>2.</strong> Create a playground for your project:
              <br />
            </InstructionText>
            <CodeSnippet theme={theme}>Create a workspace for the Benefits Redesign</CodeSnippet>
            <InstructionText theme={theme}>
              <strong>3.</strong> Add your first prototype:
              <br />
            </InstructionText>
            <CodeSnippet theme={theme}>
              Build me a prototype called "Plan Comparison Dashboard"
            </CodeSnippet>
            <InstructionText theme={theme}>
              <strong>4.</strong> The AI scaffolds a page with Rippling's navigation, sidebar, and
              content area. Now describe what you want to see:
            </InstructionText>
            <CodeSnippet theme={theme}>
              Show a dashboard with cards for medical, dental, and vision plans
            </CodeSnippet>
            <InstructionText theme={theme}>
              <strong>5.</strong> Keep iterating. Add more prototypes to the same playground
              anytime:
            </InstructionText>
            <CodeSnippet theme={theme}>Add another prototype called "Enrollment Flow"</CodeSnippet>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>Tips for great prompts</InstructionTitle>
            <InstructionText theme={theme}>
              • <strong>Be specific:</strong> "Show a table of employees with name, department, and
              start date" works better than "add a table"
              <br />• <strong>Reference real features:</strong> "Make it look like Rippling's
              time-off request page" gives the AI helpful context
              <br />• <strong>Iterate freely:</strong> You can always say "undo that" or "try a
              different approach"
              <br />• <strong>Share a screenshot:</strong> Paste a Figma screenshot and say "build
              this" — the AI can work from visual references
            </InstructionText>
          </InstructionSection>
        </DrawerContent>
      </Drawer>

      {/* Create Prototype Drawer */}
      <Drawer
        isVisible={isDrawerOpen}
        onCancel={() => setIsDrawerOpen(false)}
        title="Creating a Prototype"
        width={600}
      >
        <DrawerContent theme={theme}>
          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 1:</StepNumber>
              Start a playground
            </InstructionTitle>
            <InstructionText theme={theme}>
              A playground (or workspace) is your personal space for a project — a branch where you
              can build one or more prototypes. Start by telling the AI:
            </InstructionText>
            <CodeSnippet theme={theme}>Start a new playground for Q2 explorations</CodeSnippet>
            <CodeSnippet theme={theme}>Create a workspace for the Onboarding Redesign</CodeSnippet>
            <InstructionText theme={theme}>
              The AI creates a branch like <strong>proto/yourname/q2-explorations</strong> and
              you're ready to go. If you already have a playground, skip this step — just keep
              building on it.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 2:</StepNumber>
              Add a prototype
            </InstructionTitle>
            <InstructionText theme={theme}>Tell the AI what you want to build:</InstructionText>
            <CodeSnippet theme={theme}>
              Create a new prototype called "Employee Onboarding Flow"
            </CodeSnippet>
            <InstructionText theme={theme}>
              The AI scaffolds a new page with Rippling's app shell (navigation, sidebar, content
              area) and wires it up. You can add as many prototypes as you want to the same
              playground.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 3:</StepNumber>
              Describe what you want to see
            </InstructionTitle>
            <InstructionText theme={theme}>
              Now the fun part — just describe the UI you're imagining:
            </InstructionText>
            <CodeSnippet theme={theme}>
              Add a stepper at the top showing 4 steps: Personal Info, Documents, Benefits, Review
            </CodeSnippet>
            <CodeSnippet theme={theme}>
              Show a form for the first step with fields for name, email, and department
            </CodeSnippet>
            <InstructionText theme={theme}>
              You can paste Figma screenshots, reference existing Rippling pages, or just describe
              the experience you're going for.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 4:</StepNumber>
              Keep iterating
            </InstructionTitle>
            <InstructionText theme={theme}>
              Prototyping is all about iteration. Refine the layout, swap components, add
              interactions — just keep the conversation going:
            </InstructionText>
            <CodeSnippet theme={theme}>Make the sidebar collapsible</CodeSnippet>
            <CodeSnippet theme={theme}>
              Add a success confirmation when the form is submitted
            </CodeSnippet>
            <InstructionText theme={theme}>
              Each change takes seconds. Experiment freely — nothing here affects production.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>Playgrounds vs. prototypes</InstructionTitle>
            <InstructionText theme={theme}>
              A <strong>playground</strong> is a branch — your personal workspace that gets its own
              deploy URL. A <strong>prototype</strong> is a demo page within that branch. One
              playground can hold many prototypes, all sharing the same shareable link.
              <br />
              <br />
              When you're ready to share, just say "deploy my playground" and the AI handles the
              rest.
            </InstructionText>
          </InstructionSection>
        </DrawerContent>
      </Drawer>

      {/* Deploy & Share Drawer */}
      <Drawer
        isVisible={isDeployDrawerOpen}
        onCancel={() => setIsDeployDrawerOpen(false)}
        title="Deploying & Sharing"
        width={600}
      >
        <DrawerContent theme={theme}>
          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>Why deploy?</InstructionTitle>
            <InstructionText theme={theme}>
              Deploying gives you a shareable link that anyone can open in their browser — no setup
              needed on their end. Perfect for design reviews, stakeholder feedback, or async
              collaboration across timezones.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 1:</StepNumber>
              Save your work
            </InstructionTitle>
            <InstructionText theme={theme}>
              Ask the AI to deploy for you — it handles the technical details:
            </InstructionText>
            <CodeSnippet theme={theme}>Deploy my playground</CodeSnippet>
            <InstructionText theme={theme}>
              The AI will save your changes, push them to GitHub, and kick off an automatic deploy.
              You can also do this manually by committing and pushing your branch.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 2:</StepNumber>
              Wait a couple of minutes
            </InstructionTitle>
            <InstructionText theme={theme}>
              The deploy takes about 2 minutes. The AI will let you know when it's done and give you
              the link. You'll also see "Preview URL ready" appear at the top of this page.
            </InstructionText>
          </InstructionSection>

          <InstructionSection theme={theme}>
            <InstructionTitle theme={theme}>
              <StepNumber theme={theme}>Step 3:</StepNumber>
              Share the link
            </InstructionTitle>
            <InstructionText theme={theme}>
              Copy the preview URL from the top of this page and share it anywhere — Slack, email, a
              design doc, or a presentation. The link is public, so anyone with it can view your
              prototype.
              <br />
              <br />
              Every time you push new changes, the link automatically updates with your latest
              version.
            </InstructionText>
          </InstructionSection>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
};

export default IndexPage;
