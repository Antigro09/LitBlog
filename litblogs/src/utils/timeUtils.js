/**
 * Formats a timestamp into a human-readable relative time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} - Formatted relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Just posted (within the first minute)
  if (diffInSeconds < 60) {
    return 'Just posted';
  }
  
  // Minutes ago (up to 60 minutes)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Hours ago (up to 24 hours)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Days ago (up to 7 days)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // Different year - show month/day/year
  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
  
  // Same year - show month and day
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

/**
 * Sets up an interval to update time elements with the data-timestamp attribute
 */
export const setupTimeUpdater = () => {
  // Update all timestamps every minute
  const intervalId = setInterval(() => {
    const timeElements = document.querySelectorAll('[data-timestamp]');
    timeElements.forEach(element => {
      const timestamp = element.getAttribute('data-timestamp');
      element.textContent = formatRelativeTime(timestamp);
    });
  }, 60000); // Update every minute
  
  // Return the interval ID so it can be cleared if needed
  return intervalId;
}; 