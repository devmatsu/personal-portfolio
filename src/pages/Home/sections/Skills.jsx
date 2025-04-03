import PropTypes from 'prop-types';
import { Lightbulb } from 'lucide-react';
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';
import styles from './Skills.module.css';
import {
  FaHtml5, FaCss3, FaReact, FaGitAlt, FaDocker, FaNodeJs, FaAws
} from 'react-icons/fa';
import { 
  SiTypescript, SiExpress, SiMongodb, SiPrisma, SiRedis, SiPrettier, 
  SiPostgresql, SiJest, SiAxios, SiJsonwebtokens, SiEslint, SiPm2, SiMysql,
  SiAmazondynamodb, SiAwslambda, SiServerless, SiAmazonapigateway, SiAmazons3,
  SiAmazonsqs, SiAmazonecs, SiAmazoncloudwatch
} from 'react-icons/si';
import { FaGolang } from "react-icons/fa6";
import { DiMsqlServer } from "react-icons/di";

export default function Skills() {
  return (
    <section id="skills" className={styles.skills}>
      <div className="container">
        <HeadingBadge title="Skills" icon={<Lightbulb size={14} />} />
        <TitleGroup
          title="Tech Stack &"
          highlight="Tools"
          subtitle="What I use to bring ideas to life"
        />

        <div className={styles.categoryWrapper}>
          <SkillCategory title="Core Technologies" items={[
            { name: 'JavaScript', icon: <FaNodeJs /> },
            { name: 'TypeScript', icon: <SiTypescript /> },
            { name: 'Go', icon: <FaGolang />},
            { name: 'HTML', icon: <FaHtml5 /> },
            { name: 'CSS', icon: <FaCss3 /> }
          ]} />

          <SkillCategory title="Libraries & Frameworks" items={[
            { name: 'Node.js', icon: <FaNodeJs /> },
            { name: 'Express', icon: <SiExpress /> },
            { name: 'Serverless', icon: <SiServerless /> },
            { name: 'Axios', icon: <SiAxios /> },
            { name: 'JWT', icon: <SiJsonwebtokens /> },
            { name: 'Jest', icon: <SiJest /> },
            { name: 'Prisma', icon: <SiPrisma /> },
            { name: 'React', icon: <FaReact /> },
          ]} />

          <SkillCategory title="Tools & Cloud Services" items={[
            { name: 'Git', icon: <FaGitAlt /> },
            { name: 'AWS', icon: <FaAws /> },
            { name: 'Lambdas', icon: <SiAwslambda /> },
            { name: 'Docker', icon: <FaDocker /> },
            { name: 'ESLint', icon: <SiEslint /> },
            { name: 'Prettier', icon: <SiPrettier /> },
            { name: 'PM2', icon: <SiPm2 /> },
            { name: 'AWS API Gateway', icon: <SiAmazonapigateway /> },
            { name: 'AWS SQS', icon: <SiAmazonsqs /> },
            { name: 'AWS S3', icon: <SiAmazons3 /> },
            { name: 'AWS ECS', icon: <SiAmazonecs /> },
            { name: 'AWS CloudWatch', icon: <SiAmazoncloudwatch /> },
            
          ]} />

          <SkillCategory title="Databases" items={[
            { name: 'MongoDB', icon: <SiMongodb /> },
            { name: 'DynamoDB', icon: <SiAmazondynamodb /> },
            { name: 'SQL Server', icon: <DiMsqlServer /> },
            { name: 'MySQL', icon: <SiMysql /> },
            { name: 'PostgreSQL', icon: <SiPostgresql /> },
            { name: 'Redis', icon: <SiRedis /> },
          ]} />
        </div>

        <div className={styles.metricsWrapper}>
          <Metric label="Years of Experience" value="8+" />
          <Metric label="API requests handled daily" value="10M+" />
          <Metric label="Logs analyzed" value="∞" />
          <Metric label="Bugs left behind" value="NaN" />
        </div>
      </div>
    </section>
  );
}

const SkillCategory = ({ title, items }) => {
  return (
    <div className={styles.category}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <ul className={styles.skillList}>
        {items.map(({ name, icon }) => (
          <li key={name} className={styles.skillItem}>
            {icon && <span className={styles.iconWrapper}>{icon}</span>}
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

SkillCategory.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    icon: PropTypes.element,
  })).isRequired,
};

const Metric = ({ label, value }) => {
  return (
    <div className={styles.metricBox}>
      <p className={styles.metricValue}>{value}</p>
      <p className={styles.metricLabel}>{label}</p>
    </div>
  );
}

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
