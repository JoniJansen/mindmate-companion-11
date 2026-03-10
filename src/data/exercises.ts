import { 
  Wind, 
  Brain, 
  BookOpen, 
  Compass, 
  Shield, 
  Anchor,
  LucideIcon
} from "lucide-react";

export interface ExerciseStep {
  instruction: string;
  duration?: number; // in seconds
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  duration: string;
  durationSeconds: number;
  icon: LucideIcon;
  category: 'breathing' | 'cognitive' | 'journaling' | 'values' | 'boundaries' | 'grounding';
  color: string;
  steps: ExerciseStep[];
  prompts?: string[];
}

export const exercises: Exercise[] = [
  {
    id: 'breathing-60',
    title: '60-Second Breathing',
    description: 'Quick calm when you need it most',
    longDescription: 'A rapid relaxation technique using deep diaphragmatic breathing. Perfect for moments of acute stress or before important situations.',
    duration: '2.5 min',
    durationSeconds: 152,
    icon: Wind,
    category: 'breathing',
    color: 'calm',
    steps: [
      { instruction: 'Find a comfortable position and close your eyes', duration: 10 },
      { instruction: 'Breathe in slowly through your nose', duration: 12 },
      { instruction: 'Hold gently', duration: 7 },
      { instruction: 'Exhale slowly through your mouth', duration: 14 },
      { instruction: 'Breathe in again, feeling calm enter your body', duration: 12 },
      { instruction: 'Hold softly', duration: 7 },
      { instruction: 'Exhale, releasing tension', duration: 14 },
      { instruction: 'Breathe in once more, deep and slow', duration: 12 },
      { instruction: 'Hold gently', duration: 7 },
      { instruction: 'Exhale completely, letting go', duration: 14 },
      { instruction: 'One last deep breath in', duration: 12 },
      { instruction: 'Hold for a moment', duration: 7 },
      { instruction: 'And release, letting go completely', duration: 14 },
      { instruction: 'Gently open your eyes. Notice how you feel.', duration: 10 },
    ],
  },
  {
    id: 'thought-reframing',
    title: 'Thought Reframing',
    description: 'Challenge unhelpful thinking patterns',
    longDescription: 'Based on Cognitive Behavioral Therapy (CBT), this exercise helps you identify, examine, and reframe thoughts that may be causing distress.',
    duration: '5 min',
    durationSeconds: 300,
    icon: Brain,
    category: 'cognitive',
    color: 'primary',
    steps: [
      { instruction: 'Think of a situation that\'s been bothering you', duration: 25 },
      { instruction: 'What thought comes up about this situation?', duration: 25 },
      { instruction: 'How does this thought make you feel? Rate the intensity from low to high', duration: 20 },
      { instruction: 'What evidence supports this thought?', duration: 35 },
      { instruction: 'What evidence goes against this thought?', duration: 35 },
      { instruction: 'Is there another way to look at this situation?', duration: 35 },
      { instruction: 'What would you tell a friend who had this thought?', duration: 35 },
      { instruction: 'Create a more balanced thought about this situation', duration: 45 },
      { instruction: 'How do you feel now? Notice any shift in intensity', duration: 20 },
      { instruction: 'Even small changes matter. Well done.', duration: 15 },
    ],
    prompts: [
      'What thought is troubling you right now?',
      'Is this thought completely true, or might there be exceptions?',
      'What\'s the worst that could happen? Could you cope with it?',
      'What\'s the best that could happen?',
      'What\'s most likely to happen?',
    ],
  },
  {
    id: 'journaling-prompts',
    title: 'Guided Journaling',
    description: 'Reflective prompts for self-discovery',
    longDescription: 'Structured prompts to help you explore your thoughts and feelings. Writing helps process emotions and gain clarity.',
    duration: '10 min',
    durationSeconds: 600,
    icon: BookOpen,
    category: 'journaling',
    color: 'gentle',
    steps: [
      { instruction: 'Find a quiet space and something to write with', duration: 15 },
      { instruction: 'Take a few deep breaths to center yourself', duration: 18 },
      { instruction: 'Choose a prompt that resonates with you', duration: 20 },
      { instruction: 'Write freely without editing or judging', duration: 300 },
      { instruction: 'Read what you\'ve written with compassion', duration: 60 },
      { instruction: 'Underline any insights or patterns you notice', duration: 45 },
      { instruction: 'Write one thing you want to remember from this', duration: 45 },
    ],
    prompts: [
      'What am I feeling right now, and where do I feel it in my body?',
      'What would I do if I knew I couldn\'t fail?',
      'What am I avoiding, and why?',
      'What do I need to forgive myself for?',
      'What brings me energy, and what drains it?',
      'What would my wisest self say to me right now?',
      'What am I grateful for today, even if it\'s small?',
    ],
  },
  {
    id: 'values-clarification',
    title: 'Values Clarification',
    description: 'Discover what truly matters to you',
    longDescription: 'Understanding your core values helps guide decisions and brings meaning to daily life. This exercise helps you identify and prioritize what matters most.',
    duration: '8 min',
    durationSeconds: 480,
    icon: Compass,
    category: 'values',
    color: 'accent',
    steps: [
      { instruction: 'Think of a time when you felt truly alive and fulfilled', duration: 35 },
      { instruction: 'What was happening? What values were you honoring?', duration: 50 },
      { instruction: 'Now think of a time when you felt frustrated or off-track', duration: 35 },
      { instruction: 'What value might have been compromised?', duration: 35 },
      { instruction: 'From the list below, choose your top ten values', duration: 65 },
      { instruction: 'Now narrow it down to your top five', duration: 50 },
      { instruction: 'Finally, identify your top three core values', duration: 50 },
      { instruction: 'For each value, think of one way you can honor it this week', duration: 95 },
      { instruction: 'Reflect: How aligned is your life with these values?', duration: 50 },
    ],
    prompts: [
      'Authenticity • Adventure • Balance • Compassion • Courage',
      'Creativity • Family • Freedom • Growth • Health',
      'Honesty • Independence • Joy • Justice • Kindness',
      'Knowledge • Love • Peace • Purpose • Security',
      'Service • Spirituality • Success • Trust • Wisdom',
    ],
  },
  {
    id: 'boundary-prep',
    title: 'Boundary Setting',
    description: 'Prepare to communicate your limits',
    longDescription: 'Setting boundaries can feel challenging but is essential for wellbeing. This exercise helps you prepare for boundary conversations with clarity and confidence.',
    duration: '7 min',
    durationSeconds: 420,
    icon: Shield,
    category: 'boundaries',
    color: 'primary',
    steps: [
      { instruction: 'Think of a situation where you need to set a boundary', duration: 25 },
      { instruction: 'What specifically is happening that doesn\'t feel okay?', duration: 35 },
      { instruction: 'How does this situation affect you emotionally, physically, or practically?', duration: 45 },
      { instruction: 'What do you need instead?', duration: 35 },
      { instruction: 'Try this format: "When this happens, I feel this way, and I need this"', duration: 65 },
      { instruction: 'Practice saying it out loud, calmly and clearly', duration: 50 },
      { instruction: 'Anticipate possible responses. How will you stay firm?', duration: 50 },
      { instruction: 'Remind yourself: Setting boundaries is an act of self-respect', duration: 25 },
      { instruction: 'Visualize the conversation going well', duration: 50 },
      { instruction: 'Notice how it feels to advocate for yourself', duration: 30 },
    ],
    prompts: [
      '"I\'m not available for that."',
      '"I need some time to think about this."',
      '"That doesn\'t work for me."',
      '"I understand, and my answer is still no."',
      '"I care about you, and I also need to take care of myself."',
    ],
  },
  {
    id: 'grounding-54321',
    title: '5-4-3-2-1 Grounding',
    description: 'Anchor to the present moment',
    longDescription: 'A sensory-based grounding technique that quickly brings you back to the present moment. Especially helpful during anxiety or overwhelm.',
    duration: '4 min',
    durationSeconds: 240,
    icon: Anchor,
    category: 'grounding',
    color: 'calm',
    steps: [
      { instruction: 'Take a slow, deep breath', duration: 10 },
      { instruction: 'Look around and name five things you can see', duration: 30 },
      { instruction: 'Take your time noticing colors, shapes, and textures', duration: 18 },
      { instruction: 'Now notice four things you can touch', duration: 30 },
      { instruction: 'Feel the textures, temperatures, and sensations', duration: 18 },
      { instruction: 'Listen for three things you can hear', duration: 28 },
      { instruction: 'Notice sounds near and far', duration: 18 },
      { instruction: 'Notice two things you can smell', duration: 25 },
      { instruction: 'And one thing you can taste', duration: 18 },
      { instruction: 'Take another deep breath', duration: 10 },
      { instruction: 'Notice how you feel now, grounded in this moment', duration: 18 },
    ],
  },
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find(e => e.id === id);
};

export const getExercisesByCategory = (category: Exercise['category']): Exercise[] => {
  return exercises.filter(e => e.category === category);
};
