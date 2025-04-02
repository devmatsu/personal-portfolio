import { useEffect, useState } from 'react';

export function useActiveSection(sectionIds = []) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      let found = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 200) {
            found = id;
            break;
          }
        }
      }
      setActive(found);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds]);

  return active;
}
