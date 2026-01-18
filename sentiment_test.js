const NEGATIVE_KEYWORDS = {
  hate: -0.8,
  terrible: -0.8,
  horrible: -0.8,
  awful: -0.8,
  disgusting: -0.8,
  disappointed: -0.7,
  frustrated: -0.7,
  angry: -0.7,
  furious: -0.8,
  annoyed: -0.6,
  irritated: -0.6,
  upset: -0.6,
  worst: -0.7,
  sucks: -0.7,
  broken: -0.6,
  fail: -0.6,
  failure: -0.6,
  problem: -0.4,
  issue: -0.3,
  bug: -0.4,
  error: -0.4,
  crash: -0.6,
  spam: -0.5,
  abuse: -0.7,
  harassment: -0.8,
  harassing: -0.8,
  unsafe: -0.7,
  scam: -0.8,
  fraud: -0.8,
  refund: -0.4,
  cancel: -0.3,
  cannot: -0.3,
  unable: -0.3,
  'not working': -0.6,
  urgent: -0.4,
  immediately: -0.3,
  threat: -0.8,
  lawsuit: -0.8,
  legal: -0.5,
  complaint: -0.5,
  unacceptable: -0.7,
  ridiculous: -0.6,
  pathetic: -0.7,
  shame: -0.6,
  embarrassing: -0.6,
  poor: -0.5,
  waste: -0.5,
  useless: -0.6,
  never: -0.3,
  impossible: -0.5,
};

const POSITIVE_KEYWORDS = {
  love: 0.7,
  great: 0.7,
  awesome: 0.7,
  excellent: 0.7,
  amazing: 0.7,
  wonderful: 0.7,
  fantastic: 0.7,
  perfect: 0.7,
  best: 0.6,
  good: 0.5,
  nice: 0.4,
  happy: 0.6,
  pleased: 0.5,
  satisfied: 0.5,
  helpful: 0.5,
  thanks: 0.4,
  'thank you': 0.5,
  appreciate: 0.5,
  recommend: 0.5,
  beautiful: 0.6,
  enjoy: 0.5,
  easy: 0.4,
  intuitive: 0.5,
  fast: 0.4,
  quick: 0.4,
  improve: 0.3,
  better: 0.3,
  'feature request': 0.3,
  suggestion: 0.2,
  please: 0.1,
  hopefully: 0.2,
};

function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  let score = 0;
  let matchCount = 0;

  for (const [keyword, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      score += weight;
      matchCount++;
    }
  }

  for (const [keyword, weight] of Object.entries(POSITIVE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      score += weight;
      matchCount++;
    }
  }

  if (matchCount === 0) {
    return { score: 0, label: 'neutral' };
  }

  const normalizedScore = Math.max(-1, Math.min(1, score));
  let label = 'neutral';
  if (normalizedScore < -0.3) {
    label = 'negative';
  } else if (normalizedScore > 0.3) {
    label = 'positive';
  }

  return { score: normalizedScore, label };
}

// Test the mock posts
const posts = [
  {
    id: '1',
    title: 'Unable to access my account after password reset',
    bodyContent:
      'I reset my password yesterday but still can not log in. The system keeps saying my credentials are invalid. I have tried clearing my cache, using incognito mode, and even a different browser, but nothing works. I need to access my account urgently for work purposes. Please help me resolve this issue as soon as possible.',
  },
  {
    id: '2',
    title: 'Feature request: Dark mode for mobile app',
    bodyContent:
      'Would love to see a dark mode option in the mobile application. My eyes get tired using the app at night, and the bright white background is really uncomfortable. Many other apps have this feature now, and it would be great if you could implement it. Maybe you could also add an automatic option that switches based on system settings.',
  },
  {
    id: '3',
    title: 'Bug: Images not loading in posts',
    bodyContent:
      'Since the last update, images in community posts are not loading. Just shows a broken image icon where the images should be. This is happening on both desktop and mobile versions. I have tried on different internet connections and the issue persists. It is really frustrating because images are a big part of the community experience.',
  },
  {
    id: '4',
    title: 'Spam account posting promotional content',
    bodyContent:
      'This user keeps posting links to dubious websites. Multiple reports from community members. The posts are clearly spam and contain affiliate links to questionable products. They are posting multiple times per day and it is cluttering up the community feed. Please take action immediately.',
  },
  {
    id: '5',
    title: 'Harassment in community chat',
    bodyContent:
      'URGENT: User is repeatedly sending extremely abusive and threatening messages to other members. This is completely unacceptable and needs immediate intervention. I am terrified for my safety and the safety of others. The harassment includes violent threats, hate speech, and personal attacks. This is the worst harassment I have ever seen. We need to ban this dangerous user immediately before someone gets seriously hurt.',
  },
];

for (const post of posts) {
  const fullText = post.title + ' ' + post.bodyContent;
  const result = analyzeSentiment(fullText);
  console.log('Post ' + post.id + ':');
  console.log('  Score:', result.score);
  console.log('  Label:', result.label);
}
