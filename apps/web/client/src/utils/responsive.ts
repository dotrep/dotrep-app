// Responsive utilities for FSN platform
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};

export const isMobile = () => window.innerWidth < breakpoints.mobile;
export const isTablet = () => window.innerWidth >= breakpoints.mobile && window.innerWidth < breakpoints.tablet;
export const isDesktop = () => window.innerWidth >= breakpoints.desktop;

export const getResponsiveValue = <T>(mobileValue: T, tabletValue: T, desktopValue: T): T => {
  if (isMobile()) return mobileValue;
  if (isTablet()) return tabletValue;
  return desktopValue;
};

export const getResponsiveGrid = () => ({
  columns: getResponsiveValue('repeat(1, 1fr)', 'repeat(2, 1fr)', 'repeat(3, 1fr)'),
  gap: getResponsiveValue('15px', '20px', '25px'),
  padding: getResponsiveValue('15px 20px', '20px 25px', '20px 30px')
});

export const getResponsiveNavigation = () => ({
  gap: getResponsiveValue('20px', '35px', '50px'),
  fontSize: getResponsiveValue('14px', '15px', '16px'),
  padding: getResponsiveValue('8px 12px', '10px 16px', '12px 20px')
});

export const getResponsivePanel = () => ({
  width: getResponsiveValue('95%', '85%', '750px'),
  maxWidth: getResponsiveValue('400px', '600px', '750px'),
  padding: getResponsiveValue('15px 20px', '18px 25px', '20px 30px'),
  height: getResponsiveValue('300px', '340px', '380px')
});

export const getResponsiveDashboard = () => ({
  gap: getResponsiveValue('60px', '100px', '140px'),
  containerWidth: getResponsiveValue('100%', '1200px', '1400px'),
  flexDirection: getResponsiveValue('column', 'row', 'row') as 'column' | 'row',
  padding: getResponsiveValue('10px', '20px', '40px')
});