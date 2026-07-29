function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';

    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const month = date.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });

  const year = date.getUTCFullYear();

  return `${day}${suffix(day)} ${month}, ${year}`;
}

export default formatDate;
