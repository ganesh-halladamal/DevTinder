/**
 * Sample seed data for DevTinder profiles
 * This can be used to populate the database with initial data for testing
 */

const bcrypt = require('bcryptjs');

// Sample skills by proficiency level
const skills = {
  beginner: [
    { name: 'HTML', proficiency: 'beginner' },
    { name: 'CSS', proficiency: 'beginner' },
    { name: 'JavaScript', proficiency: 'beginner' },
    { name: 'Git', proficiency: 'beginner' },
  ],
  intermediate: [
    { name: 'React', proficiency: 'intermediate' },
    { name: 'Node.js', proficiency: 'intermediate' },
    { name: 'Express', proficiency: 'intermediate' },
    { name: 'MongoDB', proficiency: 'intermediate' },
    { name: 'TypeScript', proficiency: 'intermediate' },
  ],
  advanced: [
    { name: 'GraphQL', proficiency: 'advanced' },
    { name: 'Docker', proficiency: 'advanced' },
    { name: 'AWS', proficiency: 'advanced' },
    { name: 'CI/CD', proficiency: 'advanced' },
    { name: 'System Design', proficiency: 'advanced' },
  ],
  expert: [
    { name: 'Microservices', proficiency: 'expert' },
    { name: 'Kubernetes', proficiency: 'expert' },
    { name: 'Machine Learning', proficiency: 'expert' },
    { name: 'Distributed Systems', proficiency: 'expert' },
  ],
};

// Sample project ideas
const sampleProjects = [
  {
    title: 'Personal Portfolio Website',
    description: 'A responsive portfolio website showcasing my projects and skills.',
    techStack: ['HTML', 'CSS', 'JavaScript', 'React'],
    repoUrl: 'https://github.com/username/portfolio',
    liveUrl: 'https://portfolio.example.com',
  },
  {
    title: 'Task Management App',
    description: 'A full-stack application for managing tasks and projects with team collaboration features.',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB'],
    repoUrl: 'https://github.com/username/task-manager',
  },
  {
    title: 'E-commerce Platform',
    description: 'An online store with product catalog, cart functionality, and payment processing.',
    techStack: ['React', 'Redux', 'Node.js', 'MongoDB', 'Stripe API'],
    repoUrl: 'https://github.com/username/ecommerce',
    liveUrl: 'https://shop.example.com',
  },
  {
    title: 'Weather Dashboard',
    description: 'A weather application showing current and forecast weather data based on location.',
    techStack: ['JavaScript', 'Weather API', 'HTML', 'CSS'],
    repoUrl: 'https://github.com/username/weather-app',
  },
  {
    title: 'Social Media Clone',
    description: 'A social networking application with profiles, posts, comments, and real-time messaging.',
    techStack: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
    repoUrl: 'https://github.com/username/social-media',
  },
  {
    title: 'Recipe Sharing Platform',
    description: 'A platform for users to share, discover, and save cooking recipes.',
    techStack: ['React', 'Firebase', 'Cloudinary'],
    repoUrl: 'https://github.com/username/recipe-app',
    liveUrl: 'https://recipes.example.com',
  },
];

// Sample user data
const generateSampleUsers = async () => {
  // Generate hashed password for sample users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  return [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: hashedPassword,
      bio: 'Full-stack developer with 3 years of experience. Passionate about React, Node.js, and building scalable web applications.',
      location: 'San Francisco, CA',
      jobRole: 'Full Stack Developer',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      skills: [...skills.intermediate, ...skills.beginner.slice(0, 2)],
      projects: [sampleProjects[0], sampleProjects[3]],
      interests: ['Web Development', 'UI/UX Design', 'Open Source'],
      socialLinks: {
        github: 'https://github.com/alicejohnson',
        linkedin: 'https://linkedin.com/in/alicejohnson',
        twitter: 'https://twitter.com/alicejohnson',
        portfolio: 'https://alice-johnson.dev'
      }
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: hashedPassword,
      bio: 'Backend developer specializing in Node.js and database optimization. Looking to collaborate on open-source projects.',
      location: 'Seattle, WA',
      jobRole: 'Backend Developer',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      skills: [...skills.advanced.slice(0, 2), ...skills.intermediate.slice(0, 3)],
      projects: [sampleProjects[1], sampleProjects[4]],
      interests: ['Backend Development', 'Databases', 'Performance Optimization'],
      socialLinks: {
        github: 'https://github.com/bobsmith',
        linkedin: 'https://linkedin.com/in/bobsmith',
      }
    },
    {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: hashedPassword,
      bio: 'Frontend developer focused on creating accessible and performant user interfaces. React and TypeScript enthusiast.',
      location: 'Austin, TX',
      jobRole: 'Frontend Developer',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      skills: [...skills.intermediate.slice(0, 2), ...skills.beginner],
      projects: [sampleProjects[2], sampleProjects[5]],
      interests: ['Frontend Development', 'Accessibility', 'Design Systems'],
      socialLinks: {
        github: 'https://github.com/charliedavis',
        portfolio: 'https://charlie-davis.me'
      }
    },
    {
      name: 'David Wilson',
      email: 'david@example.com',
      password: hashedPassword,
      bio: 'DevOps engineer with expertise in containerization and cloud infrastructure. Always learning new technologies.',
      location: 'Chicago, IL',
      jobRole: 'DevOps Engineer',
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
      skills: [...skills.expert.slice(0, 2), ...skills.advanced],
      projects: [sampleProjects[1], sampleProjects[4]],
      interests: ['DevOps', 'Cloud Computing', 'Infrastructure as Code'],
      socialLinks: {
        github: 'https://github.com/davidwilson',
        linkedin: 'https://linkedin.com/in/davidwilson',
        twitter: 'https://twitter.com/davidwilson'
      }
    },
    {
      name: 'Emma Roberts',
      email: 'emma@example.com',
      password: hashedPassword,
      bio: 'Mobile app developer specializing in React Native and Flutter. Love creating smooth mobile experiences.',
      location: 'Portland, OR',
      jobRole: 'Mobile Developer',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      skills: [...skills.intermediate.slice(2, 4), ...skills.beginner.slice(0, 3)],
      projects: [sampleProjects[0], sampleProjects[5]],
      interests: ['Mobile Development', 'UI Animation', 'Cross-platform Apps'],
      socialLinks: {
        github: 'https://github.com/emmaroberts',
        linkedin: 'https://linkedin.com/in/emmaroberts',
      }
    },
    {
      name: 'Frank Chen',
      email: 'frank@example.com',
      password: hashedPassword,
      bio: 'Data scientist passionate about machine learning and AI. Looking to collaborate on projects that make a difference.',
      location: 'Boston, MA',
      jobRole: 'Data Scientist',
      avatar: 'https://randomuser.me/api/portraits/men/57.jpg',
      skills: [...skills.expert.slice(2, 4), ...skills.advanced.slice(0, 2)],
      projects: [sampleProjects[3], sampleProjects[4]],
      interests: ['Machine Learning', 'Data Visualization', 'Natural Language Processing'],
      socialLinks: {
        github: 'https://github.com/frankchen',
        linkedin: 'https://linkedin.com/in/frankchen',
        portfolio: 'https://frank-chen.io'
      }
    },
    {
      name: 'Grace Kim',
      email: 'grace@example.com',
      password: hashedPassword,
      bio: 'UX/UI designer with a passion for creating intuitive and beautiful interfaces. I bridge the gap between design and development.',
      location: 'Los Angeles, CA',
      jobRole: 'UX/UI Designer',
      avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      skills: [...skills.intermediate.slice(0, 2), ...skills.beginner],
      projects: [sampleProjects[0], sampleProjects[2]],
      interests: ['UI Design', 'User Research', 'Design Systems', 'Prototyping'],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/gracekim',
        portfolio: 'https://grace-kim.design'
      }
    },
    {
      name: 'Henry Wilson',
      email: 'henry@example.com',
      password: hashedPassword,
      bio: 'Blockchain developer focused on smart contracts and decentralized applications. Excited about the future of Web3.',
      location: 'Miami, FL',
      jobRole: 'Blockchain Developer',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      skills: [...skills.advanced.slice(1, 3), ...skills.intermediate.slice(0, 3)],
      projects: [sampleProjects[1], sampleProjects[4]],
      interests: ['Blockchain', 'Smart Contracts', 'Cryptography', 'Web3'],
      socialLinks: {
        github: 'https://github.com/henrywilson',
        twitter: 'https://twitter.com/henrywilson',
      }
    }
  ];
};

module.exports = {
  generateSampleUsers,
  sampleProjects,
  skills
}; 