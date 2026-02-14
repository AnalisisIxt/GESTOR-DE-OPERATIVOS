
export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

export const generateOperativeId = (date: Date, sequence: number): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');
  return `OP${yyyy}${mm}${dd}${seq}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getGeolocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  });
};

export const isSameDayShift = (dateStr: string, timeStr: string): boolean => {
  const now = new Date();
  const opDate = new Date(dateStr + ' ' + timeStr);
  
  // Shift starts at 09:00
  const todayNine = new Date(now);
  todayNine.setHours(9, 0, 0, 0);
  
  if (now < todayNine) {
    // Current window is from yesterday 09:00 to today 09:00
    const yesterdayNine = new Date(todayNine);
    yesterdayNine.setDate(yesterdayNine.getDate() - 1);
    return opDate >= yesterdayNine && opDate < todayNine;
  } else {
    // Current window is from today 09:00 to tomorrow 09:00
    const tomorrowNine = new Date(todayNine);
    tomorrowNine.setDate(tomorrowNine.getDate() + 1);
    return opDate >= todayNine && opDate < tomorrowNine;
  }
};
