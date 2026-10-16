export interface ExperienceEntry {
  company: string;
  /** Current or final role at the company. */
  title: string;
  /** Roles held at the company, earliest first, ending with `title`. Only for companies with a promotion to show. */
  progression?: string[];
  /** ISO dates (YYYY-MM-DD); `end` is null for the current role. */
  start: string;
  end: string | null;
  /** One short paragraph: the scope of the role and its strongest technical work. */
  description: string;
  tags: string[];
}

// Source: résumé (public/files/RESUME_RODRIGO_MATAGAWA.pdf). Tags not listed there (Kafka, Kubernetes, PostgreSQL at 1Global;
// C# and SQL at TQS) come from the previous version of this page or were added by Matsu; Herdr and OMP are the agentic
// engineering tools used at 1Global. Code7's "Mid-level" is the résumé's "Software Engineer" role.
export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: '1Global',
    title: 'Senior Software Engineer',
    start: '2025-08-11',
    end: null,
    description: 'Modernizing a legacy IoT platform for millions of connected devices, rebuilding its high-volume telecom services as NestJS microservices. Owning service design end to end and applying Agentic Engineering across the development process.',
    tags: ['NestJS', 'Kafka', 'Kubernetes', 'PostgreSQL', 'Herdr', 'OMP'],
  },
  {
    company: 'Code7',
    title: 'Senior Software Engineer',
    // Junior Software Engineer 03/2019, Software Engineer 03/2020, Senior Software Engineer 07/2024.
    progression: ['Junior', 'Mid-level', 'Senior'],
    start: '2019-03-01',
    end: '2025-08-08',
    description: 'Re-architected a C# messaging monolith into Node.js microservices delivering over a million SMS a day, and built fault-tolerant serverless backends on AWS. Mentored junior engineers on clean code and SOLID design.',
    tags: ['Node.js', 'TypeScript', 'Serverless', 'AWS', 'DynamoDB', 'SQS'],
  },
  {
    company: 'TQS',
    title: 'Junior Software Engineer',
    // Software Engineer Intern 02/2017, Junior Software Engineer 07/2018.
    progression: ['Intern', 'Junior'],
    start: '2017-02-01',
    end: '2019-02-28',
    description: 'Improved a VB.NET CRM and automated the mainframe scripts behind daily operations, while helping build JavaScript chatbots on Microsoft LUIS.',
    tags: ['SQL', 'VB.NET', 'C#', 'JavaScript', 'Microsoft LUIS'],
  },
];

/**
 * Time in a role as "6 yrs 5 mos", counting whole months: a month counts once its day of the month is reached.
 * `end` null means the role is ongoing, measured up to `today`.
 */
export function tenure(start: string, end: string | null, today = new Date()): string {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end ? end.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  const months = Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth) - (endDay < startDay ? 1 : 0));
  if (months === 0) return 'Less than a month';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years > 0 ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : '',
    rest > 0 ? `${rest} ${rest === 1 ? 'mo' : 'mos'}` : '',
  ].filter(Boolean).join(' ');
}
