import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { Header } from '../../../layout/Header';
import { Title } from '../../../layout/Title';
import { Footer } from '../../../layout/Footer';
import styles from './Blog.module.css';

export function Blog() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const perPage = 10;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`https://dev.to/api/articles?username=devmatsu&page=${page}&per_page=${perPage}`);
        const fetchedPosts = response.data;
        setPosts(fetchedPosts);

        if (fetchedPosts.length < perPage) {
          setHasMorePosts(false);
        } else {
          setHasMorePosts(true);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, [page]);

  const handleNextPage = () => {
    if (posts.length === perPage) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div>
      <Header />
      <Title text="Blog" className={styles.title} />

      <div className={styles.blogSession}>
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

        <div className={styles.pagination}>
          <button onClick={handlePrevPage} disabled={page === 1}>Previous</button>
          <button onClick={handleNextPage} disabled={!hasMorePosts}>Next</button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
