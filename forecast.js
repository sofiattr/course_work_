// Для отримання сьогоднішньої дати у форматі YYYY-MM-DD
function get_today_date() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}
// Для отримання дати через певну кількість днів у форматі YYYY-MM-DD
function get_date_in_days(days) {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + days);
    return futureDate.toISOString().split('T')[0];
}
// Функції для отримання погодних даних від сьогодні до певної кількості днів вперед
async function get_weather_in_days(location, days, YOUR_API_KEY = "4PSYAUWNUWQM8SBY68SUSE2N7") {
    const today = get_today_date();
    const date = get_date_in_days(days);
    return await get_weather(location, today, date, YOUR_API_KEY);
}
// Функції для отримання погодних даних на сьогодні 
async function get_weather_today(location, YOUR_API_KEY = "4PSYAUWNUWQM8SBY68SUSE2N7") {
    const date = get_today_date();
    return await get_weather(location, date, date, YOUR_API_KEY);
}
async function get_weather_tomorrow(location, YOUR_API_KEY = "4PSYAUWNUWQM8SBY68SUSE2N7") {
    const date = get_date_in_days(1);
    return await get_weather(location, date, date, YOUR_API_KEY);
}
async function get_weather_next_week(location, YOUR_API_KEY = "4PSYAUWNUWQM8SBY68SUSE2N7") {
    const today = get_today_date();
    const date = get_date_in_days(7);
    return await get_weather(location, today, date, YOUR_API_KEY);
}
async function get_weather(location, date1, date2, YOUR_API_KEY = "4PSYAUWNUWQM8SBY68SUSE2N7") {
    const response = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${date1}/${date2}?key=${YOUR_API_KEY}`);
    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.log("Error fetching weather data:", response.statusText);
    }
}

