import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaCog, FaHistory, FaBars } from 'react-icons/fa';
import styles from './Header.module.scss';

const MenuItemWithIcon = ({ icon: Icon, text, onClick }) => (
  <motion.button
    onClick={onClick}
    className={styles.menuItem}
    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
    whileTap={{ scale: 0.95 }}
  >
    <Icon className={styles.menuItemIcon} />
    <span>{text}</span>
  </motion.button>
);

const Header = ({
  onClearHistory,
  setShowSettings,
  onToggleBrowseHistory,
  onExitBrowseHistory,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMenuItemClick = (action) => {
    action();
    setIsMenuOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'automate') {
      alert('Coming soon!');
      setActiveTab('chat'); // Reset to chat mode after alert
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'chat' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('chat')}
        >
          Chat Mode
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'automate' ? styles.active : ''
          }`}
          onClick={() => handleTabChange('automate')}
        >
          Automate Mode
        </button>
      </div>
      <div className={styles.hamburgerMenu}>
        <motion.button
          onClick={toggleMenu}
          aria-label="Menu"
          className={styles.hamburgerButton}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaBars className={styles.icon} />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className={styles.dropdownMenu}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MenuItemWithIcon
                icon={FaTrash}
                text="Clear Chat"
                onClick={() => {
                  handleMenuItemClick(onClearHistory);
                  setShowSettings(false);
                  onExitBrowseHistory();
                }}
              />
              <MenuItemWithIcon
                icon={FaHistory}
                text="Browse History"
                onClick={() => {
                  handleMenuItemClick(onToggleBrowseHistory);
                  setShowSettings(false);
                }}
              />
              <MenuItemWithIcon
                icon={FaCog}
                text="Settings"
                onClick={() => handleMenuItemClick(() => setShowSettings(true))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
