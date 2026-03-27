import { motion } from "framer-motion";
import { Calendar, Clock, Lock, ChevronRight, Users, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface EventCardProps {
  id: string;
  title: string;
  dept: string;
  date: string;
  time: string;
  isOpen: boolean;
  type: "single" | "team";
  isPaid: boolean;
  amount?: number;
  backgroundImage?: string;
  createdBy?: string;
  registrationCount?: number;
  allowedDepts?: string[];
  onRegister?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewStudents?: () => void;
  onToggleStatus?: () => void;
}

const EventCard = ({ 
  id,
  title, 
  dept, 
  date, 
  time, 
  isOpen, 
  type, 
  isPaid, 
  amount, 
  backgroundImage, 
  createdBy,
  registrationCount = 0,
  allowedDepts,
  onRegister, 
  onEdit, 
  onDelete,
  onViewStudents,
  onToggleStatus 
}: EventCardProps) => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const isOwnEvent = user?.uid === createdBy;

  // Only show the department that created the event
  const deptDisplay = dept || "All";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      {/* Background image area with gradient overlay */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        {backgroundImage && (
          <img src={backgroundImage} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Status badges - Made more visible with better contrast */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge 
            variant="secondary" 
            className="px-3 py-1 text-xs font-bold bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg"
          >
            {deptDisplay}
          </Badge>
          {isPaid && (
            <Badge 
              variant="secondary" 
              className="px-3 py-1 text-xs font-bold bg-emerald-500/80 backdrop-blur-md border border-white/20 text-white shadow-lg"
            >
              ₹{amount}
            </Badge>
          )}
        </div>
        
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge
            className={`text-xs font-bold px-3 py-1 backdrop-blur-md border ${
              isOpen
                ? "bg-emerald-500/80 border-emerald-400/30 text-white"
                : "bg-red-500/80 border-red-400/30 text-white"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </Badge>
          {isAdmin && isOwnEvent && (
            <Badge 
              variant="secondary" 
              className="px-3 py-1 text-xs font-bold bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              {registrationCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-base leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground capitalize mt-1">{type} registration</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {time}
          </span>
        </div>

        {/* Admin Controls */}
        {isAdmin && isOwnEvent ? (
          <div className="flex gap-2 pt-1">
            {onToggleStatus && (
              <Button
                onClick={onToggleStatus}
                variant={isOpen ? "destructive" : "default"}
                size="sm"
                className="flex-1"
              >
                {isOpen ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Close
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Open
                  </>
                )}
              </Button>
            )}
            {onViewStudents && (
              <Button
                onClick={onViewStudents}
                variant="outline"
                size="sm"
              >
                <Users className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                size="sm"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : isOpen ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onRegister}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
              size="sm"
            >
              Register Now
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <Button
            disabled
            variant="secondary"
            size="sm"
            className="w-full group"
          >
            <Lock className="mr-2 h-4 w-4" />
            Registration Closed
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
