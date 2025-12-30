import { motion } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Heart, 
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";

const crisisLines = [
  {
    name: "National Suicide Prevention Lifeline",
    number: "988",
    tel: "tel:988",
    description: "24/7, free and confidential support",
    available: "24/7",
    isText: false,
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    tel: "sms:741741?body=HOME",
    description: "Free, 24/7 crisis support via text",
    available: "24/7",
    isText: true,
  },
  {
    name: "SAMHSA National Helpline",
    number: "1-800-662-4357",
    tel: "tel:1-800-662-4357",
    description: "Treatment referrals and information",
    available: "24/7",
    isText: false,
  },
  {
    name: "International Association for Suicide Prevention",
    number: "Find local resources",
    tel: "https://www.iasp.info/resources/Crisis_Centres/",
    description: "Crisis centers worldwide",
    available: "Varies by location",
    isText: false,
    isLink: true,
  },
];

const resources = [
  {
    title: "Find a Therapist Near You",
    description: "Search for licensed mental health professionals",
    icon: MapPin,
  },
  {
    title: "Understanding Crisis Signs",
    description: "Learn about warning signs and how to help",
    icon: AlertTriangle,
  },
  {
    title: "Self-Care During Difficult Times",
    description: "Coping strategies and immediate relief techniques",
    icon: Heart,
  },
];

export default function Safety() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Safety & Support" 
        subtitle="You're not alone"
        showBack 
        backTo="/chat"
      />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Emergency banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  If you're in immediate danger
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Please call emergency services (911) or go to your nearest emergency room.
                </p>
                <Button variant="destructive" size="sm" asChild>
                  <a href="tel:911">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 911
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Crisis lines */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Crisis Support Lines
          </h2>
          
          <div className="space-y-3">
            {crisisLines.map((line, index) => (
              <motion.div
                key={line.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <CalmCard variant="elevated">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">{line.name}</h3>
                      <p className="text-lg font-bold text-primary mb-1">{line.number}</p>
                      <p className="text-sm text-muted-foreground">{line.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {line.available}
                      </div>
                    </div>
                    <Button variant="calm" size="icon" asChild>
                      <a href={line.tel} target={line.isLink ? "_blank" : undefined} rel={line.isLink ? "noopener noreferrer" : undefined}>
                        {line.isText ? (
                          <MessageCircle className="w-4 h-4" />
                        ) : line.isLink ? (
                          <ExternalLink className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </a>
                    </Button>
                  </div>
                </CalmCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reassurance message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <CalmCard variant="gentle">
            <div className="text-center py-2">
              <Heart className="w-8 h-8 text-gentle mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">
                It's okay to ask for help
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reaching out takes courage. Whatever you're going through, trained professionals are ready to listen and support you without judgment.
              </p>
            </div>
          </CalmCard>
        </motion.div>

        {/* Additional resources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Additional Resources
          </h2>
          
          <div className="space-y-3">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <CalmCard 
                  key={resource.title}
                  variant="default" 
                  className="cursor-pointer hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CalmCard>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
