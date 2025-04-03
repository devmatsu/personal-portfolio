import styles from './Projects.module.css';
import ProjectCard from './ProjectCard';
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';
import { TerminalSquare } from 'lucide-react';

const projects = [
  {
    title: 'Widgets',
    description: 'A collection of interactive mini-apps built with React to boost productivity and explore creative ideas.',
    image: '/images/widgets_preview.png',
    stack: ['React.js', 'Mini Projects', 'UI/UX'],
    link: '/widgets', 
  },
  {
    title: 'Blog',
    description: 'Articles and technical notes on JavaScript, backend development and the journey of becoming a better engineer.',
    image: '/images/blog_preview.png',
    stack: ['Node.js', 'API integration', 'Technical Writing'],
    link: '/blog', 
  },
];

export default function Projects() {
  return (
    <section id="projects" className={styles.projects}>
      <div className="container">
        <HeadingBadge title="Projects" icon={<TerminalSquare size={14} />} />
        <TitleGroup
          title="My"
          highlight="Projects"
          subtitle="Explore some of my personal projects."
        />

        <div className={styles.cardsWrapper}>
          {projects.map((project, i) => (
            <ProjectCard key={i} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
