import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wind, 
  Brain, 
  Sparkles,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/toolbox/ExerciseCard";
import { ExercisePlayer } from "@/components/toolbox/ExercisePlayer";
import { exercises, Exercise } from "@/data/exercises";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { id: 'all', label: 'All' },
  { id: 'breathing', label: 'Breathing' },
  { id: 'cognitive', label: 'Cognitive' },
  { id: 'grounding', label: 'Grounding' },
  { id: 'journaling', label: 'Journaling' },
  { id: 'values', label: 'Values' },
  { id: 'boundaries', label: 'Boundaries' },
];

export default function Toolbox() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [suggestedExercises, setSuggestedExercises] = useState<Exercise[]>([]);
  const { toast } = useToast();

  // Load completed exercises from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('completed_exercises');
    if (saved) {
      setCompletedExercises(new Set(JSON.parse(saved)));
    }
  }, []);

  // Generate suggestions (max 2)
  useEffect(() => {
    const uncompleted = exercises.filter(e => !completedExercises.has(e.id));
    const shuffled = [...uncompleted].sort(() => Math.random() - 0.5);
    setSuggestedExercises(shuffled.slice(0, 2));
  }, [completedExercises]);

  const handleExerciseComplete = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    newCompleted.add(exerciseId);
    setCompletedExercises(newCompleted);
    localStorage.setItem('completed_exercises', JSON.stringify([...newCompleted]));
    
    toast({
      title: "Exercise completed",
      description: "Great job taking care of yourself.",
    });
  };

  const filteredExercises = activeCategory === 'all' 
    ? exercises 
    : exercises.filter(e => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Toolbox" subtitle="Evidence-based exercises" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* AI Suggestions */}
        {suggestedExercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Suggested for you</span>
            </div>
            
            <div className="grid gap-3">
              {suggestedExercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CalmCard 
                    variant={index === 0 ? "calm" : "gentle"} 
                    className="cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 rounded-full -mr-8 -mt-8" />
                    <div className="relative flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${index === 0 ? 'bg-calm/20' : 'bg-gentle/20'} flex items-center justify-center`}>
                        <exercise.icon className={`w-6 h-6 ${index === 0 ? 'text-calm' : 'text-gentle'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{exercise.title}</h3>
                        <p className="text-sm text-muted-foreground">{exercise.duration}</p>
                      </div>
                      <Button size="sm" variant={index === 0 ? "calm" : "soft"}>
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CalmCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="shrink-0"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Exercise list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {activeCategory === 'all' ? 'All Exercises' : categories.find(c => c.id === activeCategory)?.label}
          </h2>
          
          <div className="space-y-3">
            {filteredExercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={() => setSelectedExercise(exercise)}
                index={index}
                isCompleted={completedExercises.has(exercise.id)}
              />
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <CalmCard variant="gentle" className="text-center py-8">
              <p className="text-muted-foreground">No exercises in this category</p>
            </CalmCard>
          )}
        </motion.div>

        {/* Quick tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <CalmCard variant="gentle">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Start with shorter exercises. Even 60 seconds of breathing can shift your state.
                </p>
              </div>
            </div>
          </CalmCard>
        </motion.div>
      </div>

      {/* Exercise Player Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <ExercisePlayer
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            onComplete={() => handleExerciseComplete(selectedExercise.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
