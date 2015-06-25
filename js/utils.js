// based on code from http://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
function human_time(milliseconds) {
    var temp = Math.floor(milliseconds / 1000);
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + 'min.'
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + 'sec.'
    }
    return milliseconds + 'ms'
}

function head_stringify(data, count) {
    if (typeof data == "string") {
        var txt = data.slice(0,count)
    } else {
        var txt="";
        for (var i=0; i<count; i++) {
            txt += String.fromCharCode(data[i]);
        }
    }
    return JSON.stringify(txt)+"...";
}