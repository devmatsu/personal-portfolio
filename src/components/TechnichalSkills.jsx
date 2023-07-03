import styles from './TechnichalSkills.module.css'

import { skills, cloudServices, databases } from '../assets/skills-logos'


export function TechnichalSkills() {

  return(
    <div className={styles.skills}>

      <header className={styles.title}>
        <p className={styles.chevron}>&lt;</p>
        TechnicalSkills
        <p className={styles.chevron}>&#47;&gt;</p>
      </header>

      <div className={styles.container}>
        <fieldset className={styles.stack}>
          <legend>Stacks</legend>
          {skills.map((skill) => (
            <div key={skill.id} className={styles.content}>
              <img src={skill.image}/>
              <p className={styles.description}>
                {skill.name}
              </p>
            </div>
          ))}
        </fieldset>

        <fieldset className={styles.cloud}>
          <legend>Cloud</legend>        
          {cloudServices.map((service) => (
            <div key={service.id} className={styles.content}>
              <img src={service.image}/>
              <p className={styles.description}>
                {service.name}
              </p>
            </div>
          ))}
        </fieldset>
        
        <fieldset className={styles.database}>
          <legend>Databases</legend>
          {databases.map((database) => (
            <div key={database.id} className={styles.content}>
              <img src={database.image}/>
              <p className={styles.description}>
                {database.name}
              </p>
            </div>
          ))}
        </fieldset>
      </div>
    </div>
  )
}