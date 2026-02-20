import { useState } from 'react';
import styles from './Experience.module.css';
import { Briefcase, Calendar, ChevronRight, Building } from 'lucide-react';
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';
import TechTags from 'components/TechTags';
import { experiences } from 'assets/experienceData';

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

const formatDuration = (years, months) => {
  if (years === 0) {
    return `${months} ${months === 1 ? 'mo' : 'mos'}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'yr' : 'yrs'}`;
  }

  return `${years} ${years === 1 ? 'yr' : 'yrs'} ${months} ${months === 1 ? 'mo' : 'mos'}`;
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
                    {formatDuration(years, months)}
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
