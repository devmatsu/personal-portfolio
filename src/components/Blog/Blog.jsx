import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { Header } from '../General/Header';
import { Title } from '../General/Title';
import { Footer } from '../General/Footer';
import styles from './Blog.module.css';

export function Blog() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('https://dev.to/api/articles?username=devmatsu');
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <Header />
      <Title text="Blog" className={styles.title} />

      <div className={styles.blogContainer}>
        {posts.map((post) => (
          <div key={post.id} className={styles.post}>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <div className={styles.postFooter}>
              <span className={styles.postDate}>{post.readable_publish_date}</span>
              <Link to={`/blog/post/${post.id}`} className={styles.postLink}>
                Read more
              </Link>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
