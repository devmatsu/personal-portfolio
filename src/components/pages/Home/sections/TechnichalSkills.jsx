import { Title } from '../../../layout/Title';
import styles from './TechnichalSkills.module.css'
import { skills, cloudServices, databases } from '../../../../assets/skills-logos'

export function TechnichalSkills() {

  return(
    <div className={styles.skills}>
      <Title text="TechnicalSkills" />

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
      </div>

      <div className={styles.containerSolo}>
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
