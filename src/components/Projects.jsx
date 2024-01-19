import styles from './Projects.module.css'

export function Projects() {
  return(
    <div className={styles.projects}>
      <header className="title">
        <p className={styles.chevron}>&lt;</p>
        Projects
        <p className={styles.chevron}>&#47;&gt;</p>
      </header>

      <strong> 🚧 ... In construction ... 🚧 </strong>
    </div>
  )
}