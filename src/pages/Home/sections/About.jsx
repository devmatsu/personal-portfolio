import { User } from "lucide-react";
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';
import styles from './About.module.css';

export default function About() {
  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={styles.headingWrapper}>
          <HeadingBadge title="About Me" icon={<User size={14} />} />
          <TitleGroup
            title="Discover My"
            highlight="Story"
            subtitle="Explore my background, experiences and what ignites my passion for development."
          />
        </div>

        <div className={styles.card}>
          <div className={styles.block}>
            <h4 className={styles.heading}>
              <span className={styles.bullet}></span>
              Who I Am
            </h4>
            <p className={styles.text}>A passionate backend engineer who enjoys solving real-world problems through code. While my focus is backend development, I also explore frontend technologies like React, including building this portfolio. I find joy in creating things that people actually use and I&apos;m always diving deep into tech topics to stay sharp and grow.</p>
          </div>

          <div className={styles.block}>
            <h4 className={styles.heading}>
              <span className={styles.bullet}></span>
              My Journey
            </h4>
            <p className={styles.text}>It all started in 2012 with a Rubik&apos;s Cube. A friend showed me how he solved it and I took on the challenge. In less than 24 hours, I learned basic algorithm and was able to solve the cube entirely on my own without needing to look it up again. That moment sparked a deep interest in problem-solving and figuring things out for myself.</p>
            <p className={styles.text}>A year later, I took a course in Web Design that introduced me to the creative side of coding. That led me to pursue a degree in Computer Science in 2014. By 2017, I landed an internship where I started working with VB.NET and C#. But the real turning point came in 2019, when I joined a new company and started working with Node.js.</p>
            <p className={styles.text}>Although I quickly connected with the JavaScript ecosystem, I believe that solving problems is more important than the language used. While Node.js remains my main focus, I value a language-agnostic mindset, choosing the right tools for the job rather than being tied to one stack.</p>
          </div>

          <div className={styles.block}>
            <h4 className={styles.heading}>
              <span className={styles.bullet}></span>
              Beyond Coding
            </h4>
            <p className={styles.text}>Outside of work, I&apos;m deeply into self-development. I wake up early, read personal growth books, go to the gym and do my best to maintain a disciplined routine — including meditation and a healthy diet (though I&apos;ll admit, it&apos;s not always easy).</p>
            <p className={styles.text}>I&apos;m competitive by nature and I love channeling that through games like Counter-Strike with friends or sitting at the poker table for a live game. I enjoy quiet, cozy environments, but I&apos;m also down for a good night out or a meal with close friends. And whenever I have time, I&apos;m always learning something new especially when it&apos;s tech-related.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
