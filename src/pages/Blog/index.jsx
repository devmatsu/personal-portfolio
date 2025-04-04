import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import PageTransition from 'components/PageTransition';
import Breadcrumb from 'components/Breadcrumb';
import TitleGroup from 'components/TitleGroup';
import Header from 'components/Header';
import Footer from 'components/Footer';
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

  useEffect(() => {
    document.title = 'Matsu | Blog';
  }, []);

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
    <div className={styles.page}>
      <Header />
      <div className="breadcrumbWrapper">
        <Breadcrumb paths={[{ label: 'Home', path: '/' }, { label: 'Blog' }]} />
        <TitleGroup
          title=""
          highlight="Posts"
          subtitle="Sharing insights and ideas on web development, JavaScript, backend and more."
          />
      </div>
      <PageTransition>

        <div className={styles.blogSession}>
          <div className={styles.blogContainer}>
            {posts.map((post) => {
              return (
                <div key={post.id} className={styles.post}>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>

                  <div className={styles.postFooter}>
                    <div className={styles.footerLeft}>
                      <span>{post.reading_time_minutes} min read</span>
                    </div>

                    <Link to={`/blog/post/${post.id}`} className={styles.postLink}>
                      Read more
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.pagination}>
            <button onClick={handlePrevPage} disabled={page === 1}>Previous</button>
            <button onClick={handleNextPage} disabled={!hasMorePosts}>Next</button>
          </div>
        </div>

        <Footer />
      </PageTransition>
    </div>
  );
}
