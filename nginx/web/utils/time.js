function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000); // Difference in seconds

    const units = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    for (const unit of units) {
        const count = Math.floor(diff / unit.seconds);
        if (count > 0) {
            return `${count} ${unit.label}${count > 1 ? "s" : ""} ago`;
        }
    }

    return "just now";
}

function timeUntil(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((date - now) / 1000); // Difference in seconds

    const units = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    for (const unit of units) {
        const count = Math.floor(diff / unit.seconds);
        if (count > 0) {
            return `${count} ${unit.label}${count > 1 ? "s" : ""}`;
        }
    }

    return "now";
}

function formatTime(hours, minutes=0) {
    // We can handle dates too :)
    if (hours instanceof Date) {
        const date = hours
        hours = date.getHours()
        minutes = date.getMinutes()
        return `${hours % 12 || 12}:${minutes < 10 ? "0" + minutes : minutes} ${hours / 12 > 1 ? "PM" : "AM"}`
    }
    return `${hours % 12 || 12}:${minutes < 10 ? "0" + minutes : minutes} ${(hours % 24) / 12 >= 1 ? "PM" : "AM"}`
}

function fromTimeString(string) {
    const [time, period] = string.split(" "); // Split into time and period (e.g., "8:45" and "AM")
    const [hoursStr, minutesStr] = time.split(":"); // Split into hours and minutes (e.g., "8" and "45")
    
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    
    // Adjust for AM/PM
    if (period === "PM" && hours !== 12) {
        hours += 12;
    } else if (period === "AM" && hours === 12) {
        hours = 0;
    }
    
    return { hours, minutes };
}

function niceDateTimeString(date) {
    // Array of month names
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    // Array of day names
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Get day of the week, month, day, year, and time
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Format the time to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert to 12-hour format, 0 becomes 12
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes; // Add leading zero if minutes < 10

    // Function to add suffix to the day (e.g., 'st', 'nd', 'rd', 'th')
    function getDaySuffix(day) {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    // Combine everything into a formatted string
    return `${hours12}:${minutesFormatted} ${ampm} on ${dayOfWeek}, ${month} ${day}${getDaySuffix(day)}`;
}

const getCalendarRows = (sundayStartDateProp) => {
    const startOfMonth = new Date(sundayStartDateProp.getFullYear(), sundayStartDateProp.getMonth(), 1);
    const daysInMonth = new Date(sundayStartDateProp.getFullYear(), sundayStartDateProp.getMonth() + 1, 0).getDate();
    
    // Get the weekday index of the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayIndex = startOfMonth.getDay();
    
    // Total cells needed (starting empty cells + month days)
    const totalCells = firstDayIndex + daysInMonth;
    
    // Number of rows needed (7 days per row)
    return Math.ceil(totalCells / 7);
};

// Get the most recent month (set to the first day of the current month)
function getMostRecentMonth(monthNumber) {
    if(monthNumber) {
        const monthFirst = new Date()
        monthFirst.setMonth(monthNumber)
        monthFirst.setDate(1)
        return monthFirst
    }
    const today = new Date();
    today.setDate(1); // Set to the first day of the current month
    return today;
}

// Get the first Sunday before or on the first day of the month
function getFirstSundayBeforeOrOnMonth(date) {
    const firstDayOfMonth = new Date(date);
    firstDayOfMonth.setDate(1); // Set to the first day of the month

    const dayOfWeek = firstDayOfMonth.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    const diffToSunday = dayOfWeek === 0 ? 0 : dayOfWeek; // Calculate the difference to the previous Sunday

    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstDayOfMonth.getDate() - diffToSunday); // Adjust the date to the Sunday before or on the 1st

    return firstSunday;
}

function getStartOfSundayNSundaysAgo(n = 0, baseDate) {
    const now = baseDate ? new Date(baseDate) : new Date();
    
    // Get current day of the week (0 = Sunday, 6 = Saturday)
    const currentDay = now.getDay(); 
    
    // Calculate days to go back to the last Sunday
    const daysToLastSunday = currentDay === 0 ? 0 : currentDay; 
    
    // Move back N Sundays
    const totalDaysToGoBack = daysToLastSunday + (n * 7);
    
    // Set to last Sunday at 00:00:00
    now.setDate(now.getDate() - totalDaysToGoBack);
    now.setHours(0, 0, 0, 0);

    return now;
}

export {
    timeAgo,
    timeUntil,
    formatTime,
    fromTimeString,
    niceDateTimeString,
    getCalendarRows,
    getMostRecentMonth,
    getFirstSundayBeforeOrOnMonth,
    getStartOfSundayNSundaysAgo
}