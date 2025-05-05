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
          'Leading the design and development of scalable backend systems using Node.js, TypeScript and AWS to support core backend applications with high performance and reliability.',
          'Architecting cloud-native solutions with Serverless Framework, AWS Lambda, DynamoDB and SQS, improving uptime, reducing operational costs and enabling fault-tolerant communication at scale.',
          'Implemented Dead Letter Queues (DLQ) and structured retry mechanisms to ensure 100% message delivery and seamless recovery from failures.',
          'Mentoring and supporting junior engineers by promoting clean code, SOLID principles and best practices across the codebase.',
          'Continuously identifying and eliminating performance bottlenecks through observability, code profiling and system monitoring.',
          'Collaborating with cross-functional teams to align technical delivery with business goals, streamline deployment workflows and enforce CI/CD pipelines with tools like CodePipeline, Jest, ESLint and Prettier.'
        ],
      },
      {
        role: 'Software Engineer',
        startDate: '2020-03-01',
        endDate: '2024-06-30',
        description: [
          'Migrated and modernized legacy backend systems to AWS using Serverless Framework, Lambda, DynamoDB and CloudWatch, improving scalability and increasing service uptime.',
          'Developed microservices in Node.js and TypeScript, focusing on performance, observability and maintainability across distributed systems.',
          'Re-architected a legacy monolithic messaging system written in C#, redesigning it as a set of microservices in Node.js to improve performance, scalability and maintainability. Enabled reliable delivery of over 1M+ SMS per day.',
          'Integrated third-party APIs (e.g., Messaging Brokers for WhatsApp, SMS, and Email), enabling seamless communication and enhanced system functionality.',
          'Recreated and optimized stored procedures in SQL Server, resulting in improved reporting performance and faster query execution.',
        ],
      },
      {
        role: 'Junior Software Engineer',
        startDate: '2019-03-01',
        endDate: '2020-02-29',
        description: [
          'Developed and maintained billing, sales and FAQ chatbots using Node.js and NLP tools, improving customer engagement and reducing manual support needs.', 
          'Trained and integrated AI models to improve chatbot accuracy in natural language understanding (NLU) and response quality.', 
          'Implemented structured logging in Node.js services to reduce debugging time and improve system reliability.', 
          'Enhanced Power BI dashboards by optimizing SQL queries and building actionable data visualizations for clearer insights and improved analytical decision-making.', 
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
          'Automated mainframe scripts and internal tools to streamline daily workflows, reducing manual efforts and improving process reliability.', 
          'Enhanced CRM system features built with VB.NET, optimizing performance and usability.', 
          'Collaborated on chatbot development using JavaScript and integrated AI models with Microsoft LUIS to improve natural language understanding.', 
          'Performed quality assurance testing on CRM and chatbot products to ensure alignment with customer homologation and delivery standards.', 
          'Analyzed application logs and supported incident resolution, contributing to faster troubleshooting and improved operational stability.', 
        ],
      },
      {
        role: 'Software Engineer Intern',
        startDate: '2017-02-01',
        endDate: '2018-06-30',
        description: [
          'Created internal manuals and handbooks to support onboarding and improve daily operational workflows across the engineering team.', 
          'Conducted quality testing for CRM systems developed in VB.NET, ensuring successful delivery aligned with customer homologation requirements.', 
          'Maintained and tested browser-based WhatsApp chatbot extensions written in JavaScript, supporting frontend behavior and QA validations.', 
          'Assisted in documenting technical processes and operational improvements, contributing to product quality and user satisfaction.', 
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
