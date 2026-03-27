import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I register for an event?",
    answer: "Browse the events on your dashboard, click on an event you're interested in, and tap the Register button. Fill in your details and you're all set!"
  },
  {
    question: "How do I get my certificate?",
    answer: "After attending an event, the admin will upload your certificate. You can find it in the Certificates section on your dashboard."
  },
  {
    question: "What is the Scanner feature for?",
    answer: "The Scanner allows event organizers to mark your attendance at the venue. Simply show the QR code to the event staff."
  },
  {
    question: "How do I create an event as an admin?",
    answer: "Tap the + button in the bottom navigation or go to Create Event from the menu. Fill in all the event details and submit."
  },
  {
    question: "Can I edit my profile information?",
    answer: "Yes! Go to Profile from the menu. You can edit your name, mobile number, and email address. Department and year cannot be changed."
  },
  {
    question: "How do I contact event organizers?",
    answer: "For any event-related queries, please contact your college administration or the event coordinator directly."
  }
];

interface FAQAccordionProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

const FAQAccordion = ({ item, isOpen, onToggle, index }: FAQAccordionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border/50 last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className="font-medium text-foreground pr-4 group-hover:text-primary transition-colors">
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FAQDialog = ({ open, onOpenChange }: FAQDialogProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg max-h-[80vh] rounded-2xl border border-border bg-card shadow-premium overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">FAQ</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-2">
                {faqData.map((item, index) => (
                  <FAQAccordion
                    key={index}
                    item={item}
                    index={index}
                    isOpen={openIndex === index}
                    onToggle={() => handleToggle(index)}
                  />
                ))}
              </div>
              <div className="border-t border-border px-5 py-4">
                <p className="text-center text-sm text-muted-foreground">
                  Still have questions? Contact your administrator
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const FAQButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="mr-2 h-4 w-4" />
      FAQ
    </Button>
  );
};

export default FAQDialog;
