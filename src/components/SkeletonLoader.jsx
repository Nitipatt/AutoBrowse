import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import styles from './SkeletonLoader.module.scss';

const SkeletonLoader = () => {
  const [lines, setLines] = useState([
    { width: '100%', height: '20px' },
    { width: '75%', height: '15px' },
    { width: '90%', height: '15px' },
    { width: '60%', height: '15px' },
  ]);

  const controls = useAnimation();

  const randomizeWidths = () => {
    setLines(
      lines.map((line) => ({
        ...line,
        width: `${Math.floor(Math.random() * (100 - 30) + 30)}%`,
      }))
    );
  };

  useEffect(() => {
    controls.start({
      backgroundPosition: ['-200% 0', '200% 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      },
    });

    const interval = setInterval(randomizeWidths, 1500);
    return () => clearInterval(interval);
  }, [controls]);

  return (
    <div className={styles.skeletonLoader}>
      {lines.map((line, index) => (
        <motion.div
          key={index}
          className={styles.skeletonLine}
          style={{ width: line.width, height: line.height }}
          animate={controls}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
