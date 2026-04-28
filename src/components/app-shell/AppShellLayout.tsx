import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import { usePebbleTheme, StyledTheme } from '@/utils/theme';
import Page from '@rippling/pebble/Page';
import Tabs from '@rippling/pebble/Tabs';
import { TopNavBar } from './TopNavBar';
import { Sidebar } from './Sidebar';
import { ExpansionPanel, ExpansionPanelType } from './ExpansionPanel';
import { DecagonChatWidget } from './DecagonChatWidget';
import { NavSectionData } from './types';
import {
  HOME_TOP_SECTION,
  HOME_MAIN_SECTION,
  HOME_PLATFORM_SECTION,
  PLATFORM_FOOTER_SECTION,
  SUPER_APP_NAV_CONFIGS,
} from './superAppNavConfigs';

interface AppShellLayoutProps {
  children: React.ReactNode;

  // ─── Page config ─────────────────────────────────────────────────────────
  pageTitle: string;
  pageTabs?: string[];
  defaultActiveTab?: number;
  onTabChange?: (index: number) => void;
  pageActions?: React.ReactNode;
  pageBreadcrumbs?: React.ReactNode;
  /** Replace the entire header (Page.Header + tabs) with custom content */
  headerContent?: React.ReactNode;

  // ─── Navigation config (optional overrides) ─────────────────────────────
  /** Override the auto-generated main nav sections */
  mainNavSections?: NavSectionData[];
  /** Override the auto-generated platform/footer section */
  platformNavSection?: NavSectionData;

  // ─── Top nav / theming ───────────────────────────────────────────────────
  companyName?: string;
  userInitial?: string;
  searchPlaceholder?: string;
  /**
   * Initial super-app context. Defaults to "Home".
   * Internally managed after first render — clicking nav items updates this.
   */
  superAppName?: string;
  onLogoClick?: () => void;
  showNotificationBadge?: boolean;
  notificationCount?: number;
  defaultAdminMode?: boolean;
  defaultSidebarCollapsed?: boolean;
}

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurface};
  overflow: hidden;
`;

const MainContent = styled.main<{
  sidebarCollapsed: boolean;
  expansionPanelWidth: number;
  isResizing: boolean;
}>`
  position: fixed;
  left: ${({ sidebarCollapsed }) => (sidebarCollapsed ? '56px' : '266px')};
  top: 56px;
  right: ${({ expansionPanelWidth }) => expansionPanelWidth}px;
  bottom: 0;
  transition: ${({ isResizing }) =>
    isResizing ? 'left 200ms ease' : 'left 200ms ease, right 250ms ease-out'};
  overflow: auto;
`;

const PageContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
`;

const PageHeaderContainer = styled.div`
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurfaceBright};
  border-bottom: 1px solid ${({ theme }) => (theme as StyledTheme).colorOutlineVariant};
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const BreadcrumbWrap = styled.div`
  padding-top: ${({ theme }) => (theme as StyledTheme).space600};
  padding-bottom: ${({ theme }) => (theme as StyledTheme).space200};
`;

const PageHeaderWrapper = styled.div`
  padding-left: ${({ theme }) => (theme as StyledTheme).space1400};
  padding-right: ${({ theme }) => (theme as StyledTheme).space1400};

  & > div {
    margin-bottom: 0 !important;
  }

  & div[class*='Content'] {
    margin-top: ${({ theme }) => (theme as StyledTheme).space1000} !important;
    margin-bottom: ${({ theme }) => (theme as StyledTheme).space200} !important;
  }
`;

const PageHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as StyledTheme).space300};
`;

const TabsWrapper = styled.div`
  padding: 0 ${({ theme }) => (theme as StyledTheme).space1400};

  & > div,
  & div[class*='StyledScroll'],
  & div[class*='StyledTabContainer'] {
    box-shadow: none !important;
  }
`;

const PageContent = styled.div`
  background-color: ${({ theme }) => (theme as StyledTheme).colorSurface};
  padding: ${({ theme }) =>
    `${(theme as StyledTheme).space800} ${(theme as StyledTheme).space1400}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => (theme as StyledTheme).space600};
  flex: 1;
`;

export const AppShellLayout: React.FC<AppShellLayoutProps> = ({
  children,
  pageTitle,
  pageTabs,
  defaultActiveTab = 0,
  onTabChange,
  pageActions,
  pageBreadcrumbs,
  headerContent,
  mainNavSections: mainNavSectionsOverride,
  platformNavSection: platformNavSectionOverride,
  companyName = 'Acme, Inc.',
  userInitial = 'A',
  searchPlaceholder = 'Search or jump to...',
  superAppName: initialSuperApp = 'Home',
  onLogoClick,
  showNotificationBadge = false,
  notificationCount = 0,
  defaultAdminMode = true,
  defaultSidebarCollapsed = false,
}) => {
  const { theme, mode: currentMode } = usePebbleTheme();
  const [sidebarPinned, setSidebarPinned] = useState(defaultSidebarCollapsed === false);
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [adminMode, setAdminMode] = useState(defaultAdminMode);

  // ─── Super app & active nav state ──────────────────────────────────────────
  const [currentSuperApp, setCurrentSuperApp] = useState(initialSuperApp);
  const [activeNavItemId, setActiveNavItemId] = useState<string | null>(null);

  const isHome = currentSuperApp === 'Home';
  const superAppConfig = !isHome ? SUPER_APP_NAV_CONFIGS[currentSuperApp] : null;

  // Derive nav sections — use overrides if provided, otherwise build from configs
  const { resolvedMainSections, resolvedPlatformSection } = useMemo(() => {
    if (mainNavSectionsOverride) {
      return {
        resolvedMainSections: mainNavSectionsOverride,
        resolvedPlatformSection: platformNavSectionOverride,
      };
    }

    if (isHome) {
      const ADMIN_ONLY_IDS = ['hire', 'offboard'];
      const topSection = adminMode
        ? HOME_TOP_SECTION
        : {
            ...HOME_TOP_SECTION,
            items: HOME_TOP_SECTION.items.filter(item => !ADMIN_ONLY_IDS.includes(item.id)),
          };
      return {
        resolvedMainSections: [topSection, HOME_MAIN_SECTION],
        resolvedPlatformSection: HOME_PLATFORM_SECTION,
      };
    }

    if (superAppConfig) {
      const sections: NavSectionData[] = [];
      if (superAppConfig.topSection.items.length > 0) {
        sections.push(superAppConfig.topSection);
      }
      sections.push(superAppConfig.mainSection);
      return {
        resolvedMainSections: sections,
        resolvedPlatformSection: PLATFORM_FOOTER_SECTION,
      };
    }

    return {
      resolvedMainSections: [HOME_TOP_SECTION, HOME_MAIN_SECTION],
      resolvedPlatformSection: HOME_PLATFORM_SECTION,
    };
  }, [isHome, adminMode, superAppConfig, mainNavSectionsOverride, platformNavSectionOverride]);

  // Set first item active when entering a super app
  useEffect(() => {
    if (!isHome && superAppConfig && !mainNavSectionsOverride) {
      const firstItem = superAppConfig.topSection.items[0] ?? superAppConfig.mainSection.items[0];
      if (firstItem) {
        setActiveNavItemId(firstItem.id);
      }
    } else if (isHome) {
      setActiveNavItemId(null);
    }
  }, [currentSuperApp, isHome, superAppConfig, mainNavSectionsOverride]);

  const handleSuperAppChange = useCallback((appName: string) => {
    setCurrentSuperApp(appName);
  }, []);

  const handleNavItemClick = useCallback((itemId: string) => {
    setActiveNavItemId(itemId);
  }, []);

  const handleLogoClick = useCallback(() => {
    setCurrentSuperApp('Home');
    setActiveNavItemId(null);
    onLogoClick?.();
  }, [onLogoClick]);

  useEffect(() => {
    if (pageTabs?.length) {
      setActiveTab(defaultActiveTab ?? 0);
    }
  }, [defaultActiveTab, pageTabs]);

  // Expansion panel state (AI / Help)
  const [expansionPanelType, setExpansionPanelType] = useState<ExpansionPanelType>(null);
  const [expansionPanelHistory, setExpansionPanelHistory] = useState<ExpansionPanelType[]>([]);
  const [expansionPanelWidth, setExpansionPanelWidth] = useState(0);
  const [isExpansionPanelResizing, setIsExpansionPanelResizing] = useState(false);
  const [isDecagonOpen, setIsDecagonOpen] = useState(false);
  const [decagonPayload, setDecagonPayload] = useState<string | null>(null);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    onTabChange?.(index);
  };

  const handleToggleExpansionPanel = (type: ExpansionPanelType) => {
    if (type === 'ai' && isDecagonOpen) {
      setIsDecagonOpen(false);
    }

    if (expansionPanelType === type) {
      setExpansionPanelType(null);
      setExpansionPanelWidth(0);
      setExpansionPanelHistory([]);
    } else if (expansionPanelType !== null && type !== null) {
      setExpansionPanelHistory(prev => [...prev, expansionPanelType]);
      setExpansionPanelType(type);
    } else {
      setExpansionPanelType(type);
      setExpansionPanelHistory([]);
    }
  };

  const handleCloseExpansionPanel = () => {
    setExpansionPanelType(null);
    setExpansionPanelWidth(0);
    setExpansionPanelHistory([]);
  };

  const handleNavigateBack = () => {
    if (expansionPanelHistory.length > 0) {
      const previousType = expansionPanelHistory[expansionPanelHistory.length - 1];
      setExpansionPanelHistory(prev => prev.slice(0, -1));
      setExpansionPanelType(previousType);
    }
  };

  const handleCloseDecagon = () => {
    setIsDecagonOpen(false);
    setDecagonPayload(null);
  };

  const handleCreateTicket = (summary: string) => {
    handleCloseExpansionPanel();
    setDecagonPayload(summary);
    setIsDecagonOpen(true);
  };

  return (
    <AppContainer theme={theme}>
      {/* Top Navigation */}
      <TopNavBar
        companyName={companyName}
        userInitial={userInitial}
        adminMode={adminMode}
        currentMode={currentMode as 'light' | 'dark'}
        searchPlaceholder={searchPlaceholder}
        superAppName={currentSuperApp}
        onAdminModeToggle={() => setAdminMode(!adminMode)}
        onLogoClick={handleLogoClick}
        showNotificationBadge={showNotificationBadge}
        notificationCount={notificationCount}
        onOpenAIPanel={() => handleToggleExpansionPanel('ai')}
        onOpenSupportChat={() => {
          handleCloseExpansionPanel();
          setIsDecagonOpen(true);
        }}
        theme={theme}
      />

      {/* Left Sidebar */}
      <Sidebar
        mainSections={resolvedMainSections}
        platformSection={resolvedPlatformSection}
        isPinned={sidebarPinned}
        onTogglePin={() => setSidebarPinned(!sidebarPinned)}
        isHome={isHome}
        activeNavItemId={activeNavItemId}
        onSuperAppChange={handleSuperAppChange}
        onNavItemClick={handleNavItemClick}
        countrySelector={superAppConfig?.countrySelector}
        theme={theme}
      />

      {/* Main Content Area */}
      <MainContent
        theme={theme}
        sidebarCollapsed={!sidebarPinned}
        expansionPanelWidth={expansionPanelWidth}
        isResizing={isExpansionPanelResizing}
      >
        <PageContentContainer theme={theme}>
          {headerContent ? (
            <PageHeaderContainer theme={theme}>{headerContent}</PageHeaderContainer>
          ) : (
            (pageTitle || (pageTabs && pageTabs.length > 0)) && (
              <PageHeaderContainer theme={theme}>
                {pageTitle && (
                  <PageHeaderWrapper theme={theme}>
                    {pageBreadcrumbs && (
                      <BreadcrumbWrap theme={theme}>{pageBreadcrumbs}</BreadcrumbWrap>
                    )}
                    <Page.Header
                      title={pageTitle}
                      shouldBeUnderlined={false}
                      size={Page.Header.SIZES.FLUID}
                      actions={
                        pageActions ? (
                          <PageHeaderActions theme={theme}>{pageActions}</PageHeaderActions>
                        ) : undefined
                      }
                    />
                  </PageHeaderWrapper>
                )}

                {pageTabs && pageTabs.length > 0 && (
                  <TabsWrapper theme={theme}>
                    <Tabs.LINK
                      activeIndex={activeTab}
                      onChange={index => handleTabChange(Number(index))}
                    >
                      {pageTabs.map((tab, index) => (
                        <Tabs.Tab key={`tab-${index}`} title={tab} />
                      ))}
                    </Tabs.LINK>
                  </TabsWrapper>
                )}
              </PageHeaderContainer>
            )
          )}

          <PageContent theme={theme}>{children}</PageContent>
        </PageContentContainer>
      </MainContent>

      {/* Expansion Panel (AI / Help) */}
      <ExpansionPanel
        isOpen={expansionPanelType !== null}
        panelType={expansionPanelType}
        onClose={handleCloseExpansionPanel}
        onWidthChange={setExpansionPanelWidth}
        onResizingChange={setIsExpansionPanelResizing}
        canGoBack={expansionPanelHistory.length > 0}
        previousPanelType={expansionPanelHistory[expansionPanelHistory.length - 1] || null}
        onNavigateBack={handleNavigateBack}
        onSwitchToAI={() => handleToggleExpansionPanel('ai')}
        onCreateTicket={handleCreateTicket}
        theme={theme}
      />

      {/* Decagon Support Chat Widget */}
      <DecagonChatWidget
        isOpen={isDecagonOpen}
        onClose={handleCloseDecagon}
        onStartNewChat={() => {
          setDecagonPayload(null);
          setIsDecagonOpen(false);
          setTimeout(() => setIsDecagonOpen(true), 100);
        }}
        theme={theme}
        isConversationClosed={!decagonPayload}
        initialMessage={decagonPayload}
        onInitialMessageSent={() => {}}
      />
    </AppContainer>
  );
};
