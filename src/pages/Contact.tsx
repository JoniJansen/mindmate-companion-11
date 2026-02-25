import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Send, 
  Loader2,
  CheckCircle,
  Phone,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { CalmCard } from "@/components/shared/CalmCard";
import { StandalonePage } from "@/components/layout/StandalonePage";

export default function Contact() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const content = {
    en: {
      title: "Contact Us",
      subtitle: "We're here to help",
      intro: "Have a question, feedback, or need support? We'd love to hear from you.",
      form: {
        name: "Your Name",
        email: "Email Address",
        subject: "Subject",
        message: "Your Message",
        submit: "Send Message",
        sending: "Sending...",
      },
      success: {
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you within 24-48 hours.",
        button: "Send Another Message",
      },
      directContact: {
        title: "Direct Contact",
        email: "Email",
        phone: "Phone",
        address: "Address",
      },
      subjects: [
        "General Inquiry",
        "Technical Support",
        "Billing Question",
        "Feature Request",
        "Bug Report",
        "Other",
      ],
    },
    de: {
      title: "Kontakt",
      subtitle: "Wir sind für dich da",
      intro: "Hast du eine Frage, Feedback oder brauchst Unterstützung? Wir freuen uns von dir zu hören.",
      form: {
        name: "Dein Name",
        email: "E-Mail-Adresse",
        subject: "Betreff",
        message: "Deine Nachricht",
        submit: "Nachricht senden",
        sending: "Wird gesendet...",
      },
      success: {
        title: "Nachricht gesendet!",
        description: "Vielen Dank für deine Nachricht. Wir antworten innerhalb von 24-48 Stunden.",
        button: "Weitere Nachricht senden",
      },
      directContact: {
        title: "Direkter Kontakt",
        email: "E-Mail",
        phone: "Telefon",
        address: "Adresse",
      },
      subjects: [
        "Allgemeine Anfrage",
        "Technischer Support",
        "Abrechnungsfrage",
        "Feature-Anfrage",
        "Fehlermeldung",
        "Sonstiges",
      ],
    },
  };

  const t = content[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: language === "de" 
          ? "Bitte fülle alle Pflichtfelder aus." 
          : "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate sending (in production, this would call an edge function)
    // For now, we'll use mailto as a fallback
    try {
      const mailtoLink = `mailto:service@soulvay.com?subject=${encodeURIComponent(
        formData.subject || (language === "de" ? "Kontaktanfrage" : "Contact Inquiry")
      )}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      )}`;
      
      // Open mail client
      window.location.href = mailtoLink;
      
      // Show success after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
      }, 500);
    } catch (error) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: language === "de" 
          ? "Nachricht konnte nicht gesendet werden." 
          : "Failed to send message.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitted(false);
  };

  return (
    <StandalonePage>
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        {/* Intro */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground mb-8"
        >
          {t.intro}
        </motion.p>

        {isSubmitted ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t.success.title}</h2>
            <p className="text-muted-foreground mb-6">{t.success.description}</p>
            <Button onClick={resetForm} variant="outline">
              {t.success.button}
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-5">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-3"
            >
              <CalmCard className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t.form.name} *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.form.name}
                      className="bg-background"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t.form.email} *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.form.email}
                      className="bg-background"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t.form.subject}
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                    >
                      <option value="">{language === "de" ? "Bitte auswählen..." : "Please select..."}</option>
                      {t.subjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t.form.message} *
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={t.form.message}
                      rows={5}
                      className="bg-background resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.form.sending}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t.form.submit}
                      </>
                    )}
                  </Button>
                </form>
              </CalmCard>
            </motion.div>

            {/* Direct Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 space-y-4"
            >
              <h3 className="font-semibold text-foreground">{t.directContact.title}</h3>
              
              <div className="space-y-3">
                <a
                  href="mailto:service@soulvay.com"
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.directContact.email}</p>
                    <p className="text-sm font-medium text-foreground">service@soulvay.com</p>
                  </div>
                </a>
                
                <a
                  href="tel:+4917644680467"
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.directContact.phone}</p>
                    <p className="text-sm font-medium text-foreground">+49 176 44680467</p>
                  </div>
                </a>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.directContact.address}</p>
                    <p className="text-sm font-medium text-foreground">
                      Petersbergstraße 11<br />
                      53604 Bad Honnef
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Time Note */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {language === "de" 
                      ? "Wir antworten in der Regel innerhalb von 24-48 Stunden auf Anfragen."
                      : "We typically respond to inquiries within 24-48 hours."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
    </StandalonePage>
  );
}
