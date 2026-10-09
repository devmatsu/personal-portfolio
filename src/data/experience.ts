export interface ExperienceEntry {
  company: string;
  title: string;
  start: string;
  end: string | null;
  summary: string;
  tags: string[];
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: '1Global',
    title: 'Senior Software Engineer',
    start: '2025-08-11',
    end: null,
    summary: 'Modernizing a legacy Python IoT platform with NestJS microservices — CDR processing, device state and billing at telecom scale. Full ownership of service design.',
    tags: ['NestJS', 'Kafka', 'Kubernetes', 'PostgreSQL'],
  },
  {
    company: 'Code7',
    title: 'Junior → Senior Software Engineer',
    start: '2019-03-01',
    end: '2025-08-08',
    summary: 'Led serverless architecture on AWS with DLQs and retries for 100% message delivery. Rebuilt a C# messaging monolith into Node.js microservices sending 1M+ SMS a day. Mentored junior engineers.',
    tags: ['Lambda', 'DynamoDB', 'SQS', 'Serverless'],
  },
  {
    company: 'TQS',
    title: 'Intern → Junior Software Engineer',
    start: '2017-02-01',
    end: '2019-02-28',
    summary: 'Where it started: VB.NET and C#, learning how real software ships.',
    tags: [],
  },
];