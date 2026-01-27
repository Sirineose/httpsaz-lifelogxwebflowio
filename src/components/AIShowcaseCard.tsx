import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface AIShowcaseCardProps {
  title: string;
  description: string;
  category: string;
  image: string;
  gradient: "cyan" | "violet" | "pink";
  delay?: number;
}

const gradientStyles = {
  cyan: "from-cyan-400/20 to-transparent",
  violet: "from-violet-400/20 to-transparent", 
  pink: "from-pink-400/20 to-transparent",
};

const accentStyles = {
  cyan: "bg-cyan-400",
  violet: "bg-violet-400",
  pink: "bg-pink-400",
};

export const AIShowcaseCard = ({
  title,
  description,
  category,
  image,
  gradient,
  delay = 0,
}: AIShowcaseCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative glass-card rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradientStyles[gradient]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Image container */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        
        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="glass-card px-3 py-1.5 rounded-full text-xs font-medium text-foreground/80 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {category}
          </span>
        </div>
        
        {/* Arrow icon */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className={`${accentStyles[gradient]} p-2 rounded-full`}>
            <ArrowUpRight className="w-4 h-4 text-background" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="font-display text-xl font-semibold mb-2 group-hover:gradient-text transition-all duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accentStyles[gradient]} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
    </motion.div>
  );
};
