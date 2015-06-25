// based on code from http://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
function human_time(milliseconds) {
    var temp = milliseconds / 1000;
    var minutes = (temp %= 3600) / 60;
    if (minutes>1) {
        return minutes.toFixed(1) + 'min.'
    }
    var seconds = temp % 60;
    if (seconds>1) {
        return seconds.toFixed(1) + 'sec.'
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