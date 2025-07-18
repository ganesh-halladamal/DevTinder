import React from 'react';
import { motion, PanInfo } from 'framer-motion';

interface Skill {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface Project {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
}

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

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onSwipe }) => {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const direction = info.offset.x > threshold ? 'right' : info.offset.x < -threshold ? 'left' : null;
    
    if (direction) {
      onSwipe(direction);
    }
  };

  const getProficiencyColor = (proficiency: Skill['proficiency']) => {
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
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      className="w-full max-w-md bg-card rounded-xl shadow-lg overflow-hidden"
    >
      {/* Profile Header */}
      <div className="relative h-48">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-accent flex items-center justify-center">
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
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}
                >
                  {skill.name} • {skill.proficiency}
                </span>
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
                <span
                  key={index}
                  className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium"
                >
                  {interest}
                </span>
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
                      <span
                        key={techIndex}
                        className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                      >
                        {tech}
                      </span>
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