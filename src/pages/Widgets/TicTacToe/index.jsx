import Header from 'components/Header';
import Breadcrumb from 'components/Breadcrumb';
import PageTransition from 'components/PageTransition';
import TitleGroup from 'components/TitleGroup';
import { TicTacToeApp } from './TicTacToeApp';
import styles from './TicTacToeApp.module.css'

export function TicTacToe() {
  return (
    <div className={styles.page}>
      <Header />
      
      <div className="breadcrumbWrapper">
        <Breadcrumb paths={[{ label: 'Home', path: '/' }, { label: 'Widgets', path: '/Widgets' }, { label: 'Pomodoro' }]} />
      </div>

      <PageTransition>
        <div className={styles.titleWrapper}>
          <TitleGroup
            title=""
            highlight="Tic Tac Toe"
            subtitle=""
          />
        </div>
        <TicTacToeApp />
      </PageTransition>
    </div>
  );
}
