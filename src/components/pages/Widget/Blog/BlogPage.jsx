import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../../../layout/Header';
import { Footer } from '../../../layout/Footer';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
      <div className={styles.container}>
        {post ? (
          <div className={styles.post}>
            <Link to="/blog" className={styles.backButton}>
              Back to Blog
            </Link>
            <img src={post.social_image} alt="Social Image" className={styles.socialImage} />
            <h2>{post.title}</h2>
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      // eslint-disable-next-line react/no-children-prop
                      children={String(children).replace(/\n$/, '')}
                      style={dracula}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {post.body_markdown}
            </ReactMarkdown>
            <Link to="/blog" className={styles.backButton}>
              Back to Blog
            </Link>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
