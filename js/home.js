class Config {
    static APIToken = "2e094072b85da86618be8988a2f87f82";
    static UrlOneCall = "https://api.openweathermap.org/data/2.5/onecall";
    static UrlWeather = "https://api.openweathermap.org/data/2.5/weather";
    static UrlNearby = "https://api.openweathermap.org/data/2.5/find";
}

class TabManager {
    static SetTodayTabActive() {
        $("#todayTab").css("background-color", "#54A567");
        $("#fiveDayTab").css("background-color", "#000000");
    }
    static SetFiveDayTabActive() {
        $("#todayTab").css("background-color", "#000000");
        $("#fiveDayTab").css("background-color", "#54A567");
    }
}

class PageManager {
    static RenderFiveDayForecast() {
        this.HideMainPage();
        this.HideErrorPage();
        this.ShowFiveDateForecast();
        TabManager.SetFiveDayTabActive();
    }
    static RenderMainPage() {
        this.HideErrorPage();
        this.HideFiveDateForecast();
        this.ShowMainPage();
        TabManager.SetTodayTabActive();
    }
    static RenderCannotFind() {
        this.HideMainPage();
        this.HideFiveDateForecast();
        this.ShowErrorPage();
    }
    static ShowMainPage() {
        $('#mainBlockCurrent').show('fast');
        $('#mainBlockHourly').show('fast');
        $('#mainBlockNearby').show('fast');
    }
    static HideMainPage() {
        $('#mainBlockCurrent').hide('fast');
        $('#mainBlockHourly').hide('fast');
        $('#mainBlockNearby').hide('fast');
    }
    static ShowErrorPage() {
        $('#ErrorPage').show('fast');
    }
    static HideErrorPage() {
        $('#ErrorPage').hide('fast');
    }
    static ShowFiveDateForecast() {
        $('#fiveDayBlockPicker').show('fast');
        $('#fiveDayBlockHourly').show('fast');
    }
    static HideFiveDateForecast() {
        $('#fiveDayBlockPicker').hide('fast');
        $('#fiveDayBlockHourly').hide('fast');
    }
}

class Utils {
    static NormalizeHours(hour) {
        if (hour <= 12) {
            return hour + "am";
        }
        if ((hour - 12) > 12) {
            return (hour - 24) + "am";
        }
        return (hour - 12) + "pm";
    }

    static GetNormalDateString(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();

        if (hours < 10) {
            hours = "0" + hours;
        }
        hours += ":";
        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        return hours + minutes;
    }

    static GetCelciumFromKelvin(temp) {
        return Math.floor(temp - 273)
    }
}

$(() => {
    $("#todayTab").css("background-color", "#54A567")

    $("#todayTab").on("click", function () {
        PageManager.RenderMainPage();
    });

    $("#fiveDayTab").on("click", function () {
        PageManager.RenderFiveDayForecast();
    });

    $("#searchButton").on("click", function () {
        GetCurrentTemperatureInCity(searchText.value);
    });

    $("#currentDate").text(new Date().toISOString().slice(0, 10));

    SetInitialWeather();
});

function SetInitialWeather() {
    navigator.geolocation.getCurrentPosition(GetCurrentTemperatureByLocation, GetCurrentTemperatureInCity("London"));
}
function GetCurrentTemperatureByLocation(data) {
    SetDataByLocation(data.coords.latitude, data.coords.longitude);
}

function GetCurrentTemperatureInCity(city) {
    $.ajax({
        'url': Config.UrlWeather + "?q=" + city + "&appid=" + Config.APIToken,
        'dataType': "json"
    })
        .done(function (data) {
            SetDataByLocation(data.coord.lat, data.coord.lon);
        })

        .fail(function (data) {
            PageManager.RenderCannotFind();
        });
}

function SetDataByLocation(latitude, longitude) {
    $.ajax({
        'url': Config.UrlOneCall + "?lat=" + latitude + "&lon=" + longitude + "&exclude=minutely,alerts" + "&appid=" + Config.APIToken,
        'dataType': "json"
    })
        .done(function (data) {
            SetMainPageData(data);
            SetCityNameByLocation(latitude, longitude);
            SetFiveDayPageData(data.daily);
            PageManager.RenderMainPage();
        })

        .fail(function (data) {
            PageManager.RenderCannotFind();
        });
}

function SetMainPageData(data) {
    SetMainCurrentTable(data.current);
    SetHourlyTable(data.hourly);
    SetNearbyTable(data.lat, data.lon);
}
function SetMainCurrentTable(data) {
    let temperature = Utils.GetCelciumFromKelvin(data.temp);
    let temperatureFeelsLike = Utils.GetCelciumFromKelvin(data.feels_like);

    $("#actualTemp").text(temperature + "°C");
    $("#feelsLikeTemp").text("Real Feel: " + temperatureFeelsLike + "°C");

    let sunrise = new Date(data.sunrise * 1000);
    let sunset = new Date(data.sunset * 1000)

    $("#sunrise").text("Sunrise: " + Utils.GetNormalDateString(sunrise));
    $("#sunset").text("Sunset: " + Utils.GetNormalDateString(sunset));
    $("#weatherCloud").text(data.weather[0].main);
    $("#weatherIcon").attr("src", "./images/Icons/" + data.weather[0].icon + ".png");
}
function SetCityNameByLocation(lat, lon) {
    $.ajax({
        'url': Config.UrlWeather + "?lat=" + lat + "&lon=" + lon + "&appid=" + Config.APIToken,
        'dataType': "json"
    })
        .done(function (data) {
            $("#searchText").val(data.name);
        })

        .fail(function (data) {
            PageManager.RenderCannotFind();
        });
}
function SetHourlyTable(data) {
    SetHourlyTimeTable();
    SetHourlyTableFromData(data);
}
function SetHourlyTimeTable() {
    let date = new Date();
    for (let i = 1; i <= 6; i++) {
        $("#hourlyTime" + i).text(Utils.NormalizeHours(date.getHours() + i));
    }
}
function SetHourlyTableFromData(data) {
    for (let i = 1; i <= 6; i++) {
        let weatherData = data[i];

        let temperature = Utils.GetCelciumFromKelvin(weatherData.temp);
        let temperatureFeelsLike = Utils.GetCelciumFromKelvin(weatherData.feels_like);

        $("#hourlyTemp" + i).text(temperature + "°C");
        $("#hourlyFeelsTemp" + i).text(temperatureFeelsLike + "°C");
        $("#hourlyWind" + i).text(weatherData.wind_speed + " km/h");
        $("#hourlyCondition" + i).text(weatherData.weather[0].main);
        $("#hourlyIcon" + i).attr("src", "./images/Icons/" + weatherData.weather[0].icon + ".png");
    }
}

function SetFiveDayPageData(data) {
    for (let i = 0; i < 5; i++) {
        let weatherData = data[i];

        let temp = Utils.GetCelciumFromKelvin(weatherData.temp.day);
        $("#fiveDayTemp" + (i + 1)).text(temp + "°C");
        $("#fiveDayCondition" + (i + 1)).text(weatherData.weather[0].main);
        $("#fiveDayIcon" + (i + 1)).attr("src", "./images/Icons/" + weatherData.weather[0].icon + ".png");

        SetFiveDayPickerMonth();
    }
}

function SetFiveDayPickerMonth() {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let date = new Date();

    for (let i = 1; i <= 5; i++) {
        $("#fiveDayDate" + i).text(monthNames[date.getMonth()] + " " + (date.getDate() + i - 1));
        let asd = dayNames[date.getDay() + i - 2];
        $("#fiveDayDay" + i).text(dayNames[date.getDay() + i - 2]);
    }
}

function SetNearbyTable(latitude, longitude) {
    $.ajax({
        'url': Config.UrlNearby + "?lat=" + latitude + "&lon=" + longitude + "&cnt=4" + "&appid=" + Config.APIToken,
        'dataType': "json"
    })
        .done(function (data) {
            for (let i = 0; i <= 4; i++) {
                let weatherData = data.list[i];

                $("#nearbyCity" + (i + 1)).text(weatherData.name);
                $("#nearbyTemp" + (i + 1)).text(Utils.GetCelciumFromKelvin(weatherData.main.temp) + "°C");
                $("#nearbyIcon" + (i + 1)).attr("src", "./images/Icons/" + weatherData.weather[0].icon + ".png");
            }
        })

        .fail(function (data) {
            
        });
}