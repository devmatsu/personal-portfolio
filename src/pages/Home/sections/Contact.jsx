import { useState } from 'react';
import styles from './Contact.module.css';
import HeadingBadge from 'components/HeadingBadge';
import TitleGroup from 'components/TitleGroup';
import { Toast } from 'components/Toast';
import { MessageSquare, Mail, Check } from 'lucide-react';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { BiLogoDevTo } from 'react-icons/bi';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { SiLeetcode } from "react-icons/si";
import { URLs } from 'assets/constants';
import resume from 'assets/documents/RESUME_RODRIGO_MATAGAWA.pdf';

export default function Contact() {
  const [toasts, setToasts] = useState([]);
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    const email = 'rodrigo.matagawa@gmail.com';
    navigator.clipboard.writeText(email);
    setCopied(true);

    setToasts((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: 'E-mail copied to clipboard!',
        type: 'success',
      },
    ]);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const downloadResume = () => {
    window.open(resume);
  };

  const handleClose = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <section id="contact" className={styles.contact}>
      <div className="container">
        <HeadingBadge title="Contact" icon={<MessageSquare size={14} />} />
        <TitleGroup
          title="Let&apos;s"
          highlight="Connect"
          subtitle="I&apos;m always open to new challenges, exciting projects or just a good tech chat!"
        />

        <div className={styles.box}>
          <h3 className={styles.callout}>Feel free to reach out!</h3>

          <div className={styles.contactActions}>
            <div
              className={`${styles.iconTextButton} ${copied ? styles.copied : ''}`}
              onClick={copyEmail}
              title={copied ? 'Copied!' : 'Click to copy!'}
            >
              {copied ? <Check size={16} /> : <Mail size={16} />}
              <span>{URLs.Email}</span>
            </div>

            <button onClick={downloadResume} className={styles.iconTextButton}>
              <FaCloudDownloadAlt size={16} />
              <span>Download CV</span>
            </button>
          </div>

          <div className={styles.icons}>
            <a href={URLs.LinkedIn} target="_blank" rel="noreferrer">
              <FaLinkedinIn size={32} />
            </a>
            <a href={URLs.GitHub} target="_blank" rel="noreferrer">
              <FaGithub size={32} />
            </a>
            <a href={URLs.Devto} target="_blank" rel="noreferrer">
              <BiLogoDevTo size={32} />
            </a>
            <a href={URLs.Leetcode} target="_blank" rel="noreferrer">
              <SiLeetcode size={32} />
            </a>
          </div>

        </div>
      </div>

      <div className={styles.toastContainer}>
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            index={index}
            message={toast.message}
            type={toast.type}
            onClose={() => handleClose(toast.id)}
          />
        ))}
      </div>
    </section>
  );
}
