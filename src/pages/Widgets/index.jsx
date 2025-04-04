import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from 'components/PageTransition';
import Header from 'components/Header';
import Breadcrumb from 'components/Breadcrumb';
import TitleGroup from 'components/TitleGroup';
import styles from './Widgets.module.css';

const widgets = [
  {
    name: 'Pomodoro',
    description: 'Focus timer to boost your productivity',
    tags: ['Productivity', 'Timer'],
    route: '/widgets/pomodoro',
    preview: '/images/pomodoro_preview.png'
  },
  {
    name: 'Tic Tac Toe',
    description: 'Classic X and O game',
    tags: ['Game', 'Fun'],
    route: '/widgets/tictactoe',
    preview: '/images/tictactoe_preview.png'
  },
  {
    name: 'GitHub Graph',
    description: 'A creative platform where you can design your GitHub contribution graph by drawing patterns. Generate the necessary JSON data to commit and push to your repository, giving you full control and customization over your GitHub activity chart.',
    tags: ['Util', 'Hack'],
    route: '/widgets/githubgraph',
    preview: '/images/contribution_graph_preview.png'
  },
];

export default function WidgetsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Matsu | Widgets';
  }, []);

  return (
    <div className={styles.page}>
      <Header />
      <div className="breadcrumbWrapper">
        <Breadcrumb paths={[{ label: 'Home', path: '/' }, { label: 'Widgets' }]} />
        <TitleGroup
          title="Playground &"
          highlight="Tools"
          subtitle="Explore tools I have built for fun, focus and creativity."
        />
      </div>
      <div className={styles.content}>
        <PageTransition>
          <div className={styles.grid}>
            {widgets.map((widget) => (
              <div
                key={widget.name}
                className={styles.card}
                onClick={() => navigate(widget.route)}
              >
                {widget.preview && (
                  <img
                    src={widget.preview}
                    alt={`${widget.name} preview`}
                    className={styles.preview}
                  />
                )}

                <h2 className={styles.title}>{widget.name}</h2>
                <p className={styles.description}>{widget.description}</p>
                <div className={styles.tags}>
                  {widget.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
