// Team 1710 Pit Display Image Registry
// Categories appear in this order in the control panel
// First category (TeamIdentity) is used for auto-play

export const categories = [
  {
    key: 'TeamIdentity',
    displayName: 'Team Identity',
    images: [
      { filename: 'TeamIdentity_We_Are_Team_1710.png', displayName: 'We Are Team 1710' },
      { filename: 'TeamIdentity_All_Together_Now.png', displayName: 'All Together Now' },
      { filename: 'TeamIdentity_Kansas_Coalition.png', displayName: 'Kansas Coalition' },
      { filename: 'TeamIdentity_Leadership_Award.png', displayName: 'Leadership Award' },
    ]
  },
  {
    key: 'RobotTechnical',
    displayName: 'Robot Information',
    images: [
      { filename: 'RobotTechnical_Nimbus.png', displayName: 'Nimbus' },
    ]
  },
  {
    key: 'CommunityOutreach',
    displayName: 'Community Outreach',
    images: [
      { filename: 'CommunityOutreach_FIRST_Fund.png', displayName: 'FIRST Fund' },
      { filename: 'CommunityOutreach_Legislation.png', displayName: 'Legislation' },
      { filename: 'CommunityOutreach_Outreach_Stats.png', displayName: 'Outreach Stats' },
    ]
  },
  {
    key: 'Finance',
    displayName: 'Finance',
    images: [
      { filename: 'Finance_Budget.png', displayName: 'Budget' },
      { filename: 'Finance_Sponsors.png', displayName: 'Sponsors' },
    ]
  },
  {
    key: 'Initiatives',
    displayName: 'Initiatives',
    images: [
      { filename: 'Initiatives_Goof_Proof.png', displayName: 'Goof Proof' },
      { filename: 'Initiatives_LEGO_Drive.png', displayName: 'LEGO Drive' },
      { filename: 'Initiatives_Rainbow_Alliance.png', displayName: 'Rainbow Alliance' },
      { filename: 'Initiatives_You_Are_Not_Alone.png', displayName: 'You Are Not Alone' },
      { filename: 'Initiatives_You_Go_Girl.png', displayName: 'You Go Girl' },
    ]
  },
];

// Auto-play configuration
export const autoplayConfig = {
  inactivityTimeoutMs: 1 * 10 * 1000, // 3 minutes
  imageIntervalMs: 10 * 1000, // 30 seconds
  defaultCategoryKey: 'TeamIdentity',
};

// Helper function to find an image by category and index
export function findImage(categoryKey, imageIndex) {
  const category = categories.find(c => c.key === categoryKey);
  if (!category) return null;
  return category.images[imageIndex] || null;
}

// Helper function to get the first image of the default category
export function getDefaultImage() {
  const defaultCategory = categories.find(c => c.key === autoplayConfig.defaultCategoryKey);
  return defaultCategory?.images[0] || null;
}
