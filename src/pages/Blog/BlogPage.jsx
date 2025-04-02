import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyBlock, dracula } from 'react-code-blocks';
import axios from 'axios';

import Header from 'components/Header';
import Breadcrumb from 'components/BreadCrumb';
import Footer from 'components/Footer';

import styles from './BlogPage.module.css';

export function BlogPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`https://dev.to/api/articles/${id}`);
        setPost(response.data);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [id]);

  return (
    <div>
      <Header />
      <div className={styles.wrapper}>
        <Breadcrumb paths={[{ label: 'Home', path: '/' }, { label: 'Posts', path: '/blog' }, { label: post?.title || 'Loading...' }]} />
      </div>
      <div className={styles.container}>
        {post ? (
          <div className={styles.post}>
            <img src={post.social_image} alt="Social Image" className={styles.socialImage} />
            <h2>{post.title}</h2>
            <div className={styles.cardContainer}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children }) {
                    const codeContent = String(children).trim();
                    const languageMatch = /```(\w+)/.exec(codeContent);
                  
                    const isBlock = codeContent.includes('\n');
                  
                    if (!inline && (className || isBlock)) {
                      const cleanedCode = codeContent
                      .replace(/^```[\w]*\n/, '')
                      .replace(/```$/, '')
                      .trim();
                
                      return (
                        <CopyBlock
                          text={cleanedCode}
                          language={(className || languageMatch?.[1] || 'javascript').replace('language-', '')}
                          theme={dracula}
                          wrapLines
                          showLineNumbers={false}
                        />
                      );
                    }
                  
                    return <code className={styles.inlineCode}>{children}</code>;
                  },
                }}
              >
                {post.body_markdown}
              </ReactMarkdown>
            </div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={styles.backToTop}>
              Back to Top ↑
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
