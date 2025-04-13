import { useState } from 'react';
import styles from './Experience.module.css';
import { Briefcase, Calendar, ChevronRight, Building } from 'lucide-react';
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';
import TechTags from 'components/TechTags';

const experiences = [
  {
    company: 'Code7',
    tags: [
      'Node.js', 'JavaScript', 'TypeScript', 'Express.js', 'Serverless',
      'MongoDB', 'AWS Lambda', 'AWS API Gateway', 'AWS DynamoDB', 'AWS SQS', 
      'AWS CloudWatch', 'ECS', 'CI/CD', 'DevOps', 'Git', 'Docker', 'SQL Server',
      'Prettier', 'ESLint', 'SCRUM', 'Microservices'
    ],
    roles: [
      {
        role: 'Senior Software Engineer',
        startDate: '2024-07-01',
        endDate: 'Present',
        description: [
          'Led the development of scalable backend services using Node.js and AWS.',
          'Designed and implemented messaging APIs handling over 10M requests/day.',
          'Worked closely with cross-functional teams to deliver high-impact features with reliability and performance in mind.',
        ],
      },
      {
        role: 'Software Engineer',
        startDate: '2020-03-01',
        endDate: '2024-06-30',
        description: [
          'Developed features for high-throughput communication systems including SMS, RCS, and email flows.',
          'Improved logging and observability using Elasticsearch and Kibana.',
          'Participated in code reviews and architecture discussions to ensure clean, maintainable code.',
        ],
      },
      {
        role: 'Junior Software Engineer',
        startDate: '2019-03-01',
        endDate: '2020-02-29',
        description: [
          'Maintained and enhanced legacy systems using Express and PostgreSQL.',
          'Contributed to early refactoring efforts to migrate services to a serverless architecture.',
          'Implemented unit and integration tests to improve system reliability.',
        ],
      },
    ],
  },
  {
    company: 'TQS',
    tags: [
      'JavaScript', 'C#', 'VB.NET', 'SQL Server', 'MySQL', 'Linux', 'Automation', 
      'Mainframe', 'Technical Documentation', 'CRM (Customer Relationship Management)',
      'Quality Assurance (QA)', 'Microsoft LUIS', 'Engineering Support'
    ],
    roles: [
      {
        role: 'Junior Software Engineer',
        startDate: '2018-07-01',
        endDate: '2019-02-28',
        description: [
          'Developed internal tools and automation scripts in C# and VB.NET.',
          'Supported product teams with system integrations and troubleshooting.',
          'Participated in the migration of on-prem systems to modern web-based platforms.',
        ],
      },
      {
        role: 'Software Engineer Intern',
        startDate: '2017-02-01',
        endDate: '2018-06-30',
        description: [
          'Assisted in the maintenance of structural engineering software solutions.',
          'Created test routines and documentation to support QA processes.',
          'Learned foundational software engineering principles in a production environment.',
        ],
      },
    ],
  },
];

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = endDate === 'Present' ? new Date() : new Date(endDate);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months };
};

const formatDate = (date) => {
  if (date === 'Present') return 'Present';
  const [year, month] = date.split('-');
  return `${month}/${year}`;
};

const getMinMaxDates = (exp) => {
  const startDates = exp.roles.map((role) => role.startDate);
  const endDates = exp.roles.map((role) => role.endDate);

  const minStartDate = Math.min(...startDates.map((date) => new Date(date).getTime()));
  const maxEndDate = Math.max(
    ...endDates.map(
      (date) => (date === 'Present' ? new Date().getTime() : new Date(date).getTime())
    )
  );

  return { minStartDate: new Date(minStartDate), maxEndDate: new Date(maxEndDate) };
};

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
            const { minStartDate, maxEndDate } = getMinMaxDates(exp);
            const { years, months } = calculateDuration(minStartDate, maxEndDate);

            return (
              <div key={index} className={styles.companyWrapper}>
                <div className={styles.companyHeader}>
                  <div className={styles.companyTitle}>
                    <Building size={24} /> {exp.company}
                  </div>
                  <p className={styles.companyDuration}>
                  {years} {years === 1 ? 'yr' : 'yrs'} {months} {months === 1 ? 'mo' : 'mos'}
                  </p>
                </div>

                <TechTags className={styles.tags} tags={exp.tags} />

                {exp.roles.map((role, i) => {
                  const isOpen = openIndex === `${index}-${i}`;

                  return (
                    <div
                      key={`${index}-${i}`}
                      className={`${styles.card} ${isOpen ? styles.active : ''}`}
                      onClick={() => toggle(`${index}-${i}`)}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <h3>{role.role}</h3>
                        </div>
                        <div className={styles.right}>
                          <span className={styles.periodPill}>
                            <Calendar size={14} />
                            {formatDate(role.startDate)} - {formatDate(role.endDate)}
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
                            {role.description.map((item, i) => (
                              <li
                                key={i}
                                style={{ transitionDelay: `${i * 60}ms` }}
                                className={isOpen ? styles.fadeIn : styles.fadeOut}
                              >
                                • {item}
                              </li>
                            ))}
                          </ul>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
