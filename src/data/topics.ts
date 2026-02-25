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

export interface TopicLearnSection {
  title: string;
  content: string;
  reflectionQuestion?: string;
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
  learn: TopicLearnSection[];
}

export const topics: Topic[] = [
  {
    id: 'stress-overwhelm',
    title: 'Stress & Overwhelm',
    icon: '🌊',
    description: 'When everything feels like too much',
    longDescription: 'Stress is your body\'s natural response to demands, but chronic overwhelm can drain your energy and clarity. This path helps you understand your stress patterns and build sustainable coping strategies.',
    color: 'calm',
    learn: [
      {
        title: 'What is stress, really?',
        content: 'Stress is your nervous system\'s alarm response. When your brain perceives a threat—real or imagined—it triggers the fight-or-flight response, flooding your body with cortisol and adrenaline. This was useful when we faced physical dangers, but today, the same system activates for emails, deadlines, and social conflicts.\n\nChronic stress keeps your body in a state of heightened alertness, which over time can lead to fatigue, anxiety, difficulty concentrating, and even physical symptoms like headaches or muscle tension.',
        reflectionQuestion: 'When you feel stressed, where do you notice it first in your body?',
      },
      {
        title: 'The stress cycle',
        content: 'Dr. Emily Nagoski describes stress as a cycle that needs to be completed. The stressor (the thing causing stress) and the stress response (what your body feels) are two separate things. Even after the stressor is gone, the stress may still live in your body.\n\nPhysical movement, deep breathing, creative expression, laughter, and human connection are all ways to "complete" the stress cycle and signal safety to your nervous system.',
        reflectionQuestion: 'What usually helps you release tension? Do you give yourself permission to do it?',
      },
      {
        title: 'Overwhelm vs. stress',
        content: 'Overwhelm happens when demands exceed your perceived capacity to cope. It\'s not just about having too much to do—it\'s about feeling like you can\'t handle it. This perception is key: sometimes reframing what\'s truly urgent, letting go of perfectionism, or asking for help can shift overwhelm back into manageable stress.\n\nOne practical technique: the "2-minute rule." If something takes less than 2 minutes, do it now. Otherwise, write it down and schedule it. This reduces mental load significantly.',
        reflectionQuestion: 'What on your plate right now is truly urgent, and what could wait?',
      },
    ],
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
    learn: [
      {
        title: 'Attachment styles',
        content: 'Your early relationships with caregivers shaped how you connect with others today. Psychologist John Bowlby identified four attachment styles:\n\n• Secure: Comfortable with intimacy and independence\n• Anxious: Fear of abandonment, need for reassurance\n• Avoidant: Discomfort with closeness, value independence\n• Disorganized: Mix of anxious and avoidant patterns\n\nUnderstanding your attachment style isn\'t about labeling yourself—it\'s about recognizing patterns so you can consciously choose how to respond rather than react.',
        reflectionQuestion: 'Which attachment pattern feels most familiar to you?',
      },
      {
        title: 'The four horsemen of conflict',
        content: 'Relationship researcher John Gottman identified four communication patterns that predict relationship breakdown:\n\n1. Criticism: Attacking character instead of addressing behavior\n2. Contempt: Mockery, eye-rolling, superiority\n3. Defensiveness: Deflecting responsibility\n4. Stonewalling: Shutting down and withdrawing\n\nThe antidotes: Use "I" statements, express appreciation, take responsibility, and take breaks when overwhelmed. Small shifts in communication can transform relationship dynamics.',
        reflectionQuestion: 'Which of these patterns do you recognize in your own communication?',
      },
      {
        title: 'Healthy vs. unhealthy connection',
        content: 'Healthy relationships involve mutual respect, trust, honest communication, and space for individual growth. They don\'t require perfection—conflict is normal. What matters is how you repair after disagreements.\n\nSigns of unhealthy dynamics include: feeling like you\'re walking on eggshells, consistently sacrificing your needs, feeling controlled or manipulated, or losing touch with your own identity. Noticing these patterns is the first step toward change.',
        reflectionQuestion: 'In your closest relationships, do you feel free to be yourself?',
      },
    ],
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
    learn: [
      {
        title: 'Family systems thinking',
        content: 'Family therapist Murray Bowen proposed that families operate as emotional systems. Each member plays a role, and when one person changes, the whole system shifts. Roles like "the caretaker," "the peacemaker," or "the rebel" often develop unconsciously to maintain family balance.\n\nRecognizing these roles can help you understand why you react certain ways in family situations and give you the freedom to choose differently.',
        reflectionQuestion: 'What role did you play in your family growing up? Do you still play it?',
      },
      {
        title: 'Intergenerational patterns',
        content: 'Research shows that trauma, communication styles, and emotional patterns can be passed down through generations—not just through DNA, but through learned behavior. Your parents likely raised you with the tools they had, which were shaped by their own upbringing.\n\nThis isn\'t about blame—it\'s about understanding. When you recognize inherited patterns, you gain the power to break cycles and create new, healthier ones for yourself and future generations.',
        reflectionQuestion: 'What patterns from your family do you want to keep, and which would you like to change?',
      },
    ],
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
    learn: [
      {
        title: 'Self-esteem vs. self-compassion',
        content: 'Self-esteem is how you evaluate yourself—often in comparison to others. The problem? It fluctuates with success and failure. Dr. Kristin Neff suggests that self-compassion is more sustainable: treating yourself with the same kindness you\'d offer a good friend.\n\nSelf-compassion has three components:\n• Self-kindness (vs. self-criticism)\n• Common humanity (recognizing everyone struggles)\n• Mindfulness (acknowledging pain without over-identifying with it)',
        reflectionQuestion: 'How do you speak to yourself when you make a mistake? Would you say the same thing to a friend?',
      },
      {
        title: 'The inner critic',
        content: 'Everyone has an inner critic—a voice that judges, compares, and catastrophizes. This voice often developed as a protective mechanism: by criticizing yourself first, you tried to avoid criticism from others.\n\nThe key isn\'t to silence the critic, but to notice it, understand its origin, and consciously choose a different response. When you catch yourself in self-criticism, try: "I notice I\'m being hard on myself right now. What would compassion sound like instead?"',
        reflectionQuestion: 'What does your inner critic most often say? Where might that voice have originated?',
      },
      {
        title: 'Building genuine confidence',
        content: 'True confidence isn\'t about never doubting yourself—it\'s about trusting that you can handle whatever comes. It grows through:\n\n• Taking small risks and surviving the outcome\n• Keeping promises to yourself\n• Acknowledging your strengths and efforts (not just results)\n• Setting boundaries that honor your values\n• Accepting imperfection as part of being human\n\nConfidence is built through action, not affirmation alone.',
        reflectionQuestion: 'What is one small promise you could make to yourself today—and keep?',
      },
    ],
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
    learn: [
      {
        title: 'The three dimensions of burnout',
        content: 'The WHO classifies burnout as an occupational phenomenon with three dimensions:\n\n1. Exhaustion: Physical and emotional depletion\n2. Cynicism: Detachment from work, negative or indifferent attitude\n3. Reduced efficacy: Feeling incompetent or unproductive\n\nBurnout doesn\'t happen overnight—it\'s a gradual process. Early warning signs include dreading Monday mornings, feeling emotionally numb about work, difficulty sleeping, and losing interest in things you used to enjoy.',
        reflectionQuestion: 'On a scale of 1-10, how would you rate yourself on each of these three dimensions right now?',
      },
      {
        title: 'Recovery isn\'t just vacation',
        content: 'Research shows that vacations alone don\'t cure burnout—the effects wear off within weeks. Sustainable recovery requires structural changes:\n\n• Micro-recovery: Regular breaks throughout the day (not scrolling—actual rest)\n• Boundary setting: Clear start/end times, "no" to non-essential requests\n• Meaning reconnection: Remembering why your work matters\n• Social support: Connection with colleagues who understand\n• Physical care: Sleep, movement, nutrition\n\nThe goal isn\'t to become more productive—it\'s to become more sustainable.',
        reflectionQuestion: 'What is one boundary at work you\'ve been afraid to set?',
      },
    ],
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
    learn: [
      {
        title: 'Why decisions feel hard',
        content: 'Decision paralysis often stems from fear—fear of making the wrong choice, missing out, or regretting the outcome. Psychologist Barry Schwartz calls this the "paradox of choice": more options can lead to less satisfaction and more anxiety.\n\nThe truth is, most decisions are reversible or adjustable. And research shows that people who make "good enough" decisions (satisficers) are generally happier than those who try to make the "best" decision (maximizers).',
        reflectionQuestion: 'What\'s the worst that could realistically happen if you chose "wrong"?',
      },
      {
        title: 'Values as a compass',
        content: 'When you\'re clear on your values, decisions become easier. Values aren\'t goals—they\'re directions. A goal is "get promoted," but the underlying value might be "growth," "security," or "recognition."\n\nTry this: For any decision, ask "Which option brings me closer to the person I want to be?" This shifts the focus from outcomes (which are uncertain) to alignment (which you can feel right now).',
        reflectionQuestion: 'What are the 3 values that matter most to you in life right now?',
      },
    ],
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
    learn: [
      {
        title: 'The science of loneliness',
        content: 'Loneliness is not the same as being alone. You can be surrounded by people and still feel lonely, or be alone and feel deeply content. Neuroscientist John Cacioppo showed that loneliness is actually a biological alarm signal—like hunger or thirst—telling us we need social connection.\n\nChronic loneliness affects health as much as smoking 15 cigarettes a day. But the solution isn\'t just "being around people"—it\'s about the quality and depth of connection.',
        reflectionQuestion: 'Do you feel more lonely when you\'re alone, or when you\'re with others?',
      },
      {
        title: 'Types of connection we need',
        content: 'Research identifies three types of social connection:\n\n• Intimate: Deep, vulnerable sharing with a close person\n• Relational: Regular interaction with friends, colleagues\n• Collective: Belonging to a group, community, or cause\n\nMost people who feel lonely aren\'t missing all three—they\'re missing one specific type. Identifying which type of connection you need helps you take targeted action rather than generic "socializing."',
        reflectionQuestion: 'Which type of connection feels most missing in your life right now?',
      },
    ],
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
    learn: [
      {
        title: 'Why boundaries feel hard',
        content: 'Many people struggle with boundaries because they were taught that saying "no" is selfish or unkind. In reality, boundaries are an act of self-respect and ultimately make relationships healthier.\n\nBoundary difficulty often stems from:\n• Fear of rejection or conflict\n• People-pleasing patterns learned in childhood\n• Guilt about prioritizing your own needs\n• Unclear sense of what you actually need\n\nRemember: you can be kind and have boundaries. They\'re not mutually exclusive.',
        reflectionQuestion: 'What was the message you received about boundaries growing up?',
      },
      {
        title: 'Types of boundaries',
        content: 'Boundaries exist in many areas:\n\n• Physical: Personal space, touch, physical needs\n• Emotional: Protecting your emotional energy, not absorbing others\' feelings\n• Time: How you spend your time, saying no to commitments\n• Digital: Screen time, social media, availability expectations\n• Conversational: Topics you\'re not willing to discuss\n\nA good boundary has three parts: identify the behavior, communicate your need, state the consequence. Example: "When you call me after 10pm (behavior), I feel overwhelmed (need). I won\'t answer calls after 10pm (consequence)."',
        reflectionQuestion: 'In which area of your life do you most need to set a boundary right now?',
      },
    ],
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
    learn: [
      {
        title: 'Why breakups hurt so much',
        content: 'Brain imaging studies show that the pain of a breakup activates the same neural pathways as physical pain. Your brain literally grieves the loss of a partner like a physical wound. Additionally, love triggers the brain\'s reward system (dopamine), so losing a partner can feel like withdrawal.\n\nThis is why "just get over it" doesn\'t work. Your brain needs time to rewire. The grief process is real, valid, and necessary.',
        reflectionQuestion: 'What emotion is strongest for you right now—sadness, anger, relief, or something else?',
      },
      {
        title: 'The stages of heartbreak recovery',
        content: 'Recovery isn\'t linear, but common phases include:\n\n1. Shock & denial: "This can\'t be happening"\n2. Bargaining: "What if I had done things differently?"\n3. Anger: "How could they do this?"\n4. Sadness: Deep grief for what was lost\n5. Acceptance: Making peace with reality\n6. Growth: Discovering who you are now\n\nYou might cycle through these multiple times. Each cycle usually feels less intense. Be patient with yourself—healing takes longer than you think it should.',
        reflectionQuestion: 'Which stage resonates most with where you are right now?',
      },
    ],
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
    learn: [
      {
        title: 'Understanding your anxious brain',
        content: 'Anxiety is essentially your brain\'s threat detection system working overtime. The amygdala—your brain\'s alarm center—can\'t distinguish between a real threat and an imagined one. So your body responds to "what if I fail?" the same way it would respond to an actual danger.\n\nThis isn\'t a malfunction—it\'s a feature that kept our ancestors alive. But in modern life, it often fires too frequently and too intensely. Understanding this can help you relate to anxiety with curiosity rather than fear: "My brain is trying to protect me. I\'m not in actual danger."',
        reflectionQuestion: 'What is your anxiety usually trying to protect you from?',
      },
      {
        title: 'Cognitive distortions in anxiety',
        content: 'Anxious thinking follows predictable patterns that therapists call "cognitive distortions":\n\n• Catastrophizing: Imagining the worst possible outcome\n• Mind reading: Assuming you know what others think\n• Fortune telling: Predicting negative futures with certainty\n• All-or-nothing thinking: "If it\'s not perfect, it\'s a failure"\n• Should statements: "I should be able to handle this"\n\nThe technique of cognitive restructuring involves catching these patterns and asking: "Is this thought a fact or an interpretation? What evidence supports or contradicts it? What would I tell a friend in this situation?"',
        reflectionQuestion: 'Which of these thinking patterns is most familiar to you?',
      },
      {
        title: 'The window of tolerance',
        content: 'Dr. Dan Siegel describes the "window of tolerance" as the zone where you can think clearly, feel emotions without being overwhelmed, and respond rather than react. Anxiety pushes you above your window (hyperarousal: racing thoughts, panic) or below it (hypoarousal: numbness, disconnection).\n\nThe goal isn\'t to eliminate anxiety—it\'s to widen your window of tolerance so you can handle more without losing your center. This grows through regular practices like mindfulness, grounding, and gradual exposure to uncomfortable situations.',
        reflectionQuestion: 'What helps you return to your "window of tolerance" when anxiety spikes?',
      },
    ],
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
