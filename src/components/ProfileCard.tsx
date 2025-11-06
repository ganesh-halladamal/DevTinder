import React, { useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Star, Sparkles, Zap, BookOpen, Github, ExternalLink } from 'lucide-react';
import { formatAvatarUrl } from '../utils/imageUtils';

/**
 * Skill represents a technical skill with proficiency level
 */
interface Skill {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Project represents a developer project with related links
 */
interface Project {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
}

/**
 * ProfileCardProps defines the props for the ProfileCard component
 */
interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    location?: string;
    skills: Skill[];
    projects: Project[];
    interests: string[];
  };
  onSwipe: (direction: 'left' | 'right') => void;
}

/**
 * Represents a single profile card component with swipe functionality
 */
const ProfileCard: React.FC<ProfileCardProps> = ({ user, onSwipe }) => {
  const SWIPE_THRESHOLD = 100;

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const direction = 
        info.offset.x > SWIPE_THRESHOLD ? 'right' 
        : info.offset.x < -SWIPE_THRESHOLD ? 'left' 
        : null;
      
      if (direction) {
        onSwipe(direction);
      }
    },
    [onSwipe]
  );

  // Using centralized formatAvatarUrl from imageUtils

  const getProficiencyStyle = useCallback((proficiency: Skill['proficiency']) => {
    switch (proficiency) {
      case 'beginner':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-200 border border-blue-200 dark:border-blue-700';
      case 'intermediate':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/50 dark:to-green-800/50 dark:text-green-200 border border-green-200 dark:border-green-700';
      case 'advanced':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/50 dark:to-purple-800/50 dark:text-purple-200 border border-purple-200 dark:border-purple-700';
      case 'expert':
        return 'bg-gradient-to-r from-amber-100 via-orange-100 to-red-100 text-orange-800 dark:from-amber-900/50 dark:via-orange-900/50 dark:to-red-900/50 dark:text-orange-200 border border-orange-200 dark:border-orange-700 shadow-orange-200/50 dark:shadow-orange-700/50';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/50 dark:to-gray-800/50 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
    }
  }, []);

  /**
   * SkillTag represents a single skill badge with proficiency level
   */
  const SkillTag = ({ skill }: { skill: Skill }) => (
    <motion.span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getProficiencyStyle(skill.proficiency)} transition-all duration-300 cursor-pointer`}
      aria-label={`${skill.name} skill level ${skill.proficiency}`}
      whileHover={{ scale: 1.1, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {skill.proficiency === 'expert' && (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mr-1"
        >
          <Star className="w-3.5 h-3.5 drop-shadow-sm" fill="currentColor" />
        </motion.div>
      )}
      {skill.proficiency === 'advanced' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mr-1"
        >
          <Sparkles className="w-3.5 h-3.5 drop-shadow-sm" />
        </motion.div>
      )}
      {skill.proficiency === 'intermediate' && (
        <motion.div
          animate={{ x: [-1, 1, -1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="mr-1"
        >
          <Zap className="w-3.5 h-3.5 drop-shadow-sm" fill="currentColor" />
        </motion.div>
      )}
      {skill.proficiency === 'beginner' && (
        <BookOpen className="w-3.5 h-3.5 mr-1 drop-shadow-sm" />
      )}
      <span className="font-semibold">{skill.name}</span>
    </motion.span>
  );

  const InterestTag = ({ interest }: { interest: string }) => (
    <motion.span
      className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium border border-accent/50"
      aria-label={`Interest: ${interest}`}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {interest}
    </motion.span>
  );

  const TechTag = ({ tech }: { tech: string }) => (
    <motion.span
      className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-medium border border-primary/30"
      aria-label={`Technology: ${tech}`}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary), 0.3)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {tech}
    </motion.span>
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      className="w-full max-w-md bg-card rounded-xl shadow-lg overflow-hidden"
      role="article"
      aria-label={`Profile card for ${user.name}`}
    >
      {/* Profile Header */}
      <div className="relative h-48 overflow-hidden" aria-label="Profile picture">
        {user.avatar && user.avatar.trim() !== '' ? (
          <motion.img
            src={formatAvatarUrl(user.avatar)}
            alt={`Profile picture of ${user.name}`}
            className="w-full h-full object-cover animate-parallax"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            loading="lazy"
            onError={(e) => {
              // Fallback to letter if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.fallback-letter')?.classList.remove('hidden');
            }}
          />
        ) : null}
        {(!user.avatar || user.avatar.trim() === '') && (
          <div
            className="w-full h-full bg-accent flex items-center justify-center fallback-letter"
            aria-hidden="true"
          >
            <span className="text-4xl">{user.name[0]}</span>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-card-foreground">{user.name}</h2>
        {user.location && (
          <p className="text-sm text-muted-foreground mt-1">{user.location}</p>
        )}
        {user.bio && (
          <p className="text-card-foreground mt-4">{user.bio}</p>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <SkillTag key={index} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {user.interests.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <InterestTag key={index} interest={interest} />
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {user.projects.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Projects</h3>
            <div className="space-y-4">
              {user.projects.map((project, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-br from-card/50 to-accent/10 rounded-lg p-4 border border-accent/20 hover:border-primary/30 transition-all duration-300"
                  whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h4 className="font-semibold text-card-foreground mb-1">{project.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.techStack.map((tech, techIndex) => (
                      <TechTag key={techIndex} tech={tech} />
                    ))}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {project.repoUrl && (
                      <motion.a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-md text-xs font-medium hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-sm hover:shadow-md"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Github className="w-3.5 h-3.5 mr-1.5" />
                        Repository
                      </motion.a>
                    )}
                    {project.liveUrl && (
                      <motion.a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground rounded-md text-xs font-medium hover:from-secondary/90 hover:to-secondary/70 transition-all duration-200 shadow-sm hover:shadow-md"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Live Demo
                      </motion.a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swipe Instructions */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent font-medium">
          Swipe right to connect
        </span>
        <span className="text-muted-foreground mx-1">•</span>
        <span className="text-muted-foreground">left to pass</span>
      </motion.div>
    </motion.div>
  );
};

export default ProfileCard;