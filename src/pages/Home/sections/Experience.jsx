import { useState } from 'react';
import styles from './Experience.module.css';
import { Briefcase, Calendar, ChevronRight } from 'lucide-react';
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';

const experiences = [
  {
    role: 'Senior Software Engineer',
    company: 'Code7',
    period: 'Jul 2024 - Present',
    description: [
      'Led the development of scalable backend services using Node.js and AWS.',
      'Designed and implemented messaging APIs handling over 10M requests/day.',
      'Worked closely with cross-functional teams to deliver high-impact features with reliability and performance in mind.',
    ],
    tags: ['Node.js', 'AWS', 'TypeScript', 'System Design', 'Microservices'],
  },
  {
    role: 'Software Engineer',
    company: 'Code7',
    period: 'Mar 2020 - Jun 2024',
    description: [
      'Developed features for high-throughput communication systems including SMS, RCS, and email flows.',
      'Improved logging and observability using Elasticsearch and Kibana.',
      'Participated in code reviews and architecture discussions to ensure clean, maintainable code.',
    ],
    tags: ['Node.js', 'AWS Lambda', 'Serverless Framework', 'Redis', 'MongoDB'],
  },
  {
    role: 'Junior Software Engineer',
    company: 'Code7',
    period: 'Mar 2019 - Feb 2020',
    description: [
      'Maintained and enhanced legacy systems using Express and PostgreSQL.',
      'Contributed to early refactoring efforts to migrate services to a serverless architecture.',
      'Implemented unit and integration tests to improve system reliability.',
    ],
    tags: ['JavaScript', 'Node.js', 'Express.js', 'PM2', 'SQL Server'],
  },
  {
    role: 'Junior Software Engineer',
    company: 'TQS',
    period: 'Jul 2018 - Feb 2019',
    description: [
      'Developed internal tools and automation scripts in C# and VB.NET.',
      'Supported product teams with system integrations and troubleshooting.',
      'Participated in the migration of on-prem systems to modern web-based platforms.',
    ],
    tags: ['C#', 'VB.NET', 'JavaScript', 'SQL Server', 'MySQL', 'Linux'],
  },
  {
    role: 'Intern Software Engineer',
    company: 'TQS',
    period: 'Feb 2017 - Jun 2018',
    description: [
      'Assisted in the maintenance of structural engineering software solutions.',
      'Created test routines and documentation to support QA processes.',
      'Learned foundational software engineering principles in a production environment.',
    ],
    tags: ['C#', 'VB.NET', 'SQL Server', 'MySQL', 'CRM'],
  },
];

export default function Experience() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="experience" className={styles.experience}>
      <div className="container">
        <HeadingBadge title="Experience" icon={<Briefcase size={14} />} />
        <TitleGroup
          title="Work"
          highlight="Experience"
          subtitle="Companies I&apos;ve worked with and the projects I&apos;ve been involved in"
        />

        <div className={styles.cardWrapper}>
          {experiences.map((exp, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`${styles.card} ${isOpen ? styles.active : ''}`}
                onClick={() => toggle(index)}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{exp.role}</h3>
                    <p className={styles.company}>
                      <Briefcase size={14} /> {exp.company}
                    </p>
                  </div>
                  <div className={styles.right}>
                  <span className={styles.periodPill}>
                    <Calendar size={14} />
                    {exp.period}
                  </span>
                    <ChevronRight
                      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                      size={16}
                    />
                  </div>
                </div>

                <div
                  className={`${styles.cardBodyWrapper} ${
                    isOpen ? styles.cardBodyOpen : ''
                  }`}
                >
                  <div className={styles.cardBody}>
                    <ul className={styles.description}>
                      {exp.description.map((item, i) => (
                        <li
                          key={i}
                          style={{ transitionDelay: `${i * 60}ms` }}
                          className={isOpen ? styles.fadeIn : styles.fadeOut}
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                    <div className={styles.tags}>
                      {exp.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            transitionDelay: isOpen ? `${i * 80 + 300}ms` : '0ms',
                          }}
                          className={isOpen ? styles.tagIn : styles.tagOut}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
