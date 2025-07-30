import React, { useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
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

  const getProficiencyColor = useCallback((proficiency: Skill['proficiency']) => {
    switch (proficiency) {
      case 'beginner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'intermediate':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'expert':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  /**
   * SkillTag represents a single skill badge with proficiency level
   */
  const SkillTag = ({ skill }: { skill: Skill }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}
      aria-label={`${skill.name} skill level ${skill.proficiency}`}
    >
      {skill.name} • {skill.proficiency}
    </span>
  );

  const InterestTag = ({ interest }: { interest: string }) => (
    <span
      className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium"
      aria-label={`Interest: ${interest}`}
    >
      {interest}
    </span>
  );

  const TechTag = ({ tech }: { tech: string }) => (
    <span
      className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
      aria-label={`Technology: ${tech}`}
    >
      {tech}
    </span>
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
      <div className="relative h-48" aria-label="Profile picture">
        {user.avatar && user.avatar.trim() !== '' ? (
          <motion.img
            src={formatAvatarUrl(user.avatar)}
            alt={`Profile picture of ${user.name}`}
            className="w-full h-full object-cover"
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
                <div key={index} className="bg-accent/10 rounded-lg p-4">
                  <h4 className="font-medium text-card-foreground">{project.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.techStack.map((tech, techIndex) => (
                      <TechTag key={techIndex} tech={tech} />
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Repository
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swipe Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground">
        Swipe right to connect, left to pass
      </div>
    </motion.div>
  );
};

export default ProfileCard;