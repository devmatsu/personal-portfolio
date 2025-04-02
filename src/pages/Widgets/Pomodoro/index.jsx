import Header from 'components/Header';
import PageTransition from 'components/PageTransition';
import Breadcrumb from 'components/Breadcrumb';
import TitleGroup from 'components/TitleGroup';
import { PomodoroApp } from './PomodoroApp';
import styles from './PomodoroApp.module.css'

export function Pomodoro() {
  return (
    <div className={styles.page}>
      <Header /> 
      <div className="breadcrumbWrapper">
        <Breadcrumb paths={[{ label: 'Home', path: '/' }, { label: 'Widgets', path: '/Widgets' }, { label: 'Pomodoro' }]} />
      </div>

      <PageTransition>
        <main className={styles.main}>
          <div className={styles.titleWrapper}>
            <TitleGroup
              title=""
              highlight="Pomodoro"
              subtitle=""
            />
          </div>
          <PomodoroApp />
        </main>
      </PageTransition>
    </div>
  );
}
