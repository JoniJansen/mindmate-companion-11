export interface TopicStep {
  id: number;
  title: string;
  description: string;
  type: 'reflection' | 'exercise' | 'journal' | 'chat';
}

export interface TopicExercise {
  id: string;
  title: string;
  duration: string;
  description: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  description: string;
  longDescription: string;
  color: 'calm' | 'gentle' | 'primary' | 'accent' | 'warm';
  steps: TopicStep[];
  exercises: TopicExercise[];
}

export const topics: Topic[] = [
  {
    id: 'stress-overwhelm',
    title: 'Stress & Overwhelm',
    icon: '🌊',
    description: 'When everything feels like too much',
    longDescription: 'Stress is your body\'s natural response to demands, but chronic overwhelm can drain your energy and clarity. This path helps you understand your stress patterns and build sustainable coping strategies.',
    color: 'calm',
    steps: [
      { id: 1, title: 'Name what\'s weighing on you', description: 'Identify the specific sources of your stress', type: 'journal' },
      { id: 2, title: 'Explore your stress signals', description: 'Recognize how stress shows up in your body and mind', type: 'reflection' },
      { id: 3, title: 'Try a grounding exercise', description: 'Practice a calming technique to reduce immediate tension', type: 'exercise' },
      { id: 4, title: 'Identify one small change', description: 'Find one thing you can adjust or let go of', type: 'chat' },
      { id: 5, title: 'Create a stress-relief plan', description: 'Build a personalized toolkit for managing overwhelm', type: 'journal' },
    ],
    exercises: [
      { id: 'breathing', title: '4-7-8 Breathing', duration: '3 min', description: 'A calming breath pattern to activate your parasympathetic nervous system' },
      { id: 'body-scan', title: 'Body Scan', duration: '5 min', description: 'Release tension by bringing awareness to each part of your body' },
    ],
  },
  {
    id: 'relationships',
    title: 'Relationships',
    icon: '💜',
    description: 'Navigating connections with others',
    longDescription: 'Healthy relationships require communication, boundaries, and self-awareness. This path helps you explore your relationship patterns and develop deeper, more authentic connections.',
    color: 'gentle',
    steps: [
      { id: 1, title: 'Reflect on a relationship', description: 'Choose one relationship to explore more deeply', type: 'reflection' },
      { id: 2, title: 'Identify your needs', description: 'What do you need from this relationship?', type: 'journal' },
      { id: 3, title: 'Explore communication patterns', description: 'How do you express yourself? What could shift?', type: 'chat' },
      { id: 4, title: 'Practice a conversation', description: 'Prepare for a difficult or important conversation', type: 'exercise' },
      { id: 5, title: 'Set an intention', description: 'Define one small step to improve this connection', type: 'reflection' },
    ],
    exercises: [
      { id: 'empathy', title: 'Perspective Taking', duration: '5 min', description: 'See a situation from another person\'s point of view' },
      { id: 'gratitude', title: 'Relationship Gratitude', duration: '3 min', description: 'Acknowledge what you appreciate about someone' },
    ],
  },
  {
    id: 'family',
    title: 'Family',
    icon: '🏠',
    description: 'Complex dynamics and healing',
    longDescription: 'Family relationships can be our deepest source of both joy and pain. This path helps you navigate complex family dynamics with more clarity and peace.',
    color: 'warm',
    steps: [
      { id: 1, title: 'Map your family landscape', description: 'Explore the key relationships and dynamics', type: 'journal' },
      { id: 2, title: 'Identify inherited patterns', description: 'What behaviors or beliefs did you learn from family?', type: 'reflection' },
      { id: 3, title: 'Process a specific memory', description: 'Work through a moment that still affects you', type: 'chat' },
      { id: 4, title: 'Rewrite a narrative', description: 'Find a new perspective on an old story', type: 'journal' },
      { id: 5, title: 'Choose your response', description: 'Decide how you want to show up going forward', type: 'reflection' },
      { id: 6, title: 'Practice self-compassion', description: 'Release guilt or shame about family relationships', type: 'exercise' },
    ],
    exercises: [
      { id: 'letter', title: 'Unsent Letter', duration: '10 min', description: 'Write what you wish you could say to a family member' },
      { id: 'boundaries', title: 'Boundary Visualization', duration: '5 min', description: 'Imagine healthy boundaries with a family member' },
    ],
  },
  {
    id: 'self-esteem',
    title: 'Self-Esteem',
    icon: '✨',
    description: 'Building a kinder relationship with yourself',
    longDescription: 'Self-esteem isn\'t about being perfect—it\'s about accepting yourself as you are while growing into who you want to become. This path helps you build genuine self-worth.',
    color: 'primary',
    steps: [
      { id: 1, title: 'Notice your inner critic', description: 'Become aware of negative self-talk patterns', type: 'reflection' },
      { id: 2, title: 'Challenge a limiting belief', description: 'Question one thing you believe about yourself', type: 'chat' },
      { id: 3, title: 'Acknowledge your strengths', description: 'Recognize what you bring to the world', type: 'journal' },
      { id: 4, title: 'Practice self-compassion', description: 'Treat yourself as you would a good friend', type: 'exercise' },
      { id: 5, title: 'Celebrate small wins', description: 'Notice and appreciate your daily accomplishments', type: 'journal' },
      { id: 6, title: 'Create an affirmation', description: 'Write a statement that reflects your true worth', type: 'reflection' },
    ],
    exercises: [
      { id: 'mirror', title: 'Mirror Work', duration: '3 min', description: 'Practice speaking kindly to yourself' },
      { id: 'wins', title: 'Daily Wins Journal', duration: '2 min', description: 'List three things you did well today' },
    ],
  },
  {
    id: 'work-burnout',
    title: 'Work & Burnout',
    icon: '🔥',
    description: 'Finding balance and preventing exhaustion',
    longDescription: 'Burnout happens when demands consistently exceed your resources. This path helps you recognize warning signs, set better boundaries, and rediscover meaning in your work.',
    color: 'accent',
    steps: [
      { id: 1, title: 'Assess your burnout level', description: 'Recognize where you are on the exhaustion spectrum', type: 'reflection' },
      { id: 2, title: 'Identify energy drains', description: 'What aspects of work deplete you most?', type: 'journal' },
      { id: 3, title: 'Find your energy sources', description: 'Discover what recharges you at work and outside', type: 'chat' },
      { id: 4, title: 'Set one boundary', description: 'Choose one limit to protect your wellbeing', type: 'exercise' },
      { id: 5, title: 'Reconnect with purpose', description: 'Remember why your work matters to you', type: 'reflection' },
    ],
    exercises: [
      { id: 'unplug', title: 'Digital Sunset', duration: '30 min', description: 'Disconnect from work devices before bed' },
      { id: 'micro-break', title: 'Micro-Break Practice', duration: '2 min', description: 'Take regular small breaks throughout the day' },
    ],
  },
  {
    id: 'decisions-direction',
    title: 'Decisions & Direction',
    icon: '🧭',
    description: 'Finding clarity when feeling stuck',
    longDescription: 'Making decisions can feel paralyzing, especially when you\'re unsure of what you want. This path helps you connect with your values and gain clarity on your next steps.',
    color: 'calm',
    steps: [
      { id: 1, title: 'Define the decision', description: 'Get clear on what you\'re actually deciding', type: 'journal' },
      { id: 2, title: 'Explore your fears', description: 'What are you afraid might happen?', type: 'reflection' },
      { id: 3, title: 'Connect with your values', description: 'What matters most to you in this situation?', type: 'chat' },
      { id: 4, title: 'Imagine both paths', description: 'Visualize yourself in each scenario', type: 'exercise' },
      { id: 5, title: 'Listen to your body', description: 'Notice what feels right physically', type: 'reflection' },
      { id: 6, title: 'Take one small step', description: 'Commit to the next tiny action', type: 'journal' },
    ],
    exercises: [
      { id: 'future-self', title: 'Future Self Visualization', duration: '5 min', description: 'Imagine your future self and ask for advice' },
      { id: 'values', title: 'Values Clarification', duration: '10 min', description: 'Identify your top 5 core values' },
    ],
  },
  {
    id: 'loneliness',
    title: 'Loneliness',
    icon: '🌙',
    description: 'Feeling connected even when alone',
    longDescription: 'Loneliness is a signal that our need for connection isn\'t being met. This path helps you understand your loneliness and find meaningful ways to connect—with others and yourself.',
    color: 'gentle',
    steps: [
      { id: 1, title: 'Acknowledge the feeling', description: 'Give yourself permission to feel lonely', type: 'journal' },
      { id: 2, title: 'Explore what\'s missing', description: 'What kind of connection do you crave?', type: 'reflection' },
      { id: 3, title: 'Practice self-connection', description: 'Build a relationship with yourself', type: 'exercise' },
      { id: 4, title: 'Identify connection opportunities', description: 'Where could you find the connection you need?', type: 'chat' },
      { id: 5, title: 'Take a small social step', description: 'Reach out in one small way', type: 'reflection' },
    ],
    exercises: [
      { id: 'self-date', title: 'Self-Date', duration: '30 min', description: 'Do something you enjoy, just for yourself' },
      { id: 'reach-out', title: 'Connection Challenge', duration: '5 min', description: 'Send a message to someone you\'ve been thinking about' },
    ],
  },
  {
    id: 'boundaries',
    title: 'Boundaries',
    icon: '🛡️',
    description: 'Protecting your energy and peace',
    longDescription: 'Boundaries aren\'t walls—they\'re the guidelines that help you preserve your wellbeing while maintaining healthy relationships. This path helps you set and maintain boundaries with compassion.',
    color: 'primary',
    steps: [
      { id: 1, title: 'Recognize where boundaries are needed', description: 'Identify situations where you feel drained or resentful', type: 'journal' },
      { id: 2, title: 'Understand your boundary style', description: 'Explore how you currently handle boundaries', type: 'reflection' },
      { id: 3, title: 'Define a specific boundary', description: 'Get clear on what limit you want to set', type: 'chat' },
      { id: 4, title: 'Practice saying no', description: 'Rehearse boundary-setting language', type: 'exercise' },
      { id: 5, title: 'Handle pushback', description: 'Prepare for resistance from others', type: 'reflection' },
      { id: 6, title: 'Maintain your boundary', description: 'Stay consistent over time', type: 'journal' },
    ],
    exercises: [
      { id: 'scripts', title: 'Boundary Scripts', duration: '5 min', description: 'Write and practice phrases for setting limits' },
      { id: 'energy-audit', title: 'Energy Audit', duration: '10 min', description: 'Review which people and activities drain vs. energize you' },
    ],
  },
  {
    id: 'breakups',
    title: 'Breakups',
    icon: '💔',
    description: 'Healing and moving forward',
    longDescription: 'Breakups can shake our sense of self and future. This path helps you process the pain, learn from the experience, and open yourself to new possibilities.',
    color: 'warm',
    steps: [
      { id: 1, title: 'Allow yourself to grieve', description: 'Give space to all the emotions', type: 'journal' },
      { id: 2, title: 'Process the story', description: 'Make sense of what happened', type: 'chat' },
      { id: 3, title: 'Reclaim your identity', description: 'Remember who you are outside the relationship', type: 'reflection' },
      { id: 4, title: 'Practice self-care', description: 'Nurture yourself through the transition', type: 'exercise' },
      { id: 5, title: 'Find the lessons', description: 'What have you learned about yourself and love?', type: 'reflection' },
      { id: 6, title: 'Envision your future', description: 'Open to new possibilities', type: 'journal' },
      { id: 7, title: 'Create closure', description: 'Release the past with intention', type: 'exercise' },
    ],
    exercises: [
      { id: 'release', title: 'Release Ritual', duration: '10 min', description: 'Symbolically let go of what no longer serves you' },
      { id: 'new-chapter', title: 'New Chapter Journal', duration: '15 min', description: 'Write about who you\'re becoming' },
    ],
  },
  {
    id: 'anxiety',
    title: 'Anxiety',
    icon: '🌿',
    description: 'Calming the worried mind',
    longDescription: 'Anxiety is your mind trying to protect you, but sometimes it goes into overdrive. This path helps you understand your anxiety, reduce its intensity, and find more peace.',
    color: 'calm',
    steps: [
      { id: 1, title: 'Identify your triggers', description: 'Notice what situations spark your anxiety', type: 'journal' },
      { id: 2, title: 'Understand your anxiety', description: 'Explore what your anxiety is trying to tell you', type: 'reflection' },
      { id: 3, title: 'Learn a calming technique', description: 'Practice a tool to reduce anxiety in the moment', type: 'exercise' },
      { id: 4, title: 'Challenge anxious thoughts', description: 'Question the accuracy of worried thoughts', type: 'chat' },
      { id: 5, title: 'Build your toolkit', description: 'Create a personalized anxiety management plan', type: 'journal' },
    ],
    exercises: [
      { id: '5-4-3-2-1', title: '5-4-3-2-1 Grounding', duration: '3 min', description: 'Use your senses to anchor to the present moment' },
      { id: 'worry-time', title: 'Scheduled Worry Time', duration: '10 min', description: 'Contain worry to a designated time' },
    ],
  },
];

export const getTopicById = (id: string): Topic | undefined => {
  return topics.find(t => t.id === id);
};
