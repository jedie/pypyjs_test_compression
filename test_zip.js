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

$(document).ready(function() {
    var out = $("#output");
    function print(data) {
        out.append(data+"\n");
    }

    function load_file(f) {
        /*
        API: http://stuk.github.io/jszip/documentation/api_zipobject.html

        asText() 	    string 	the content as an unicode string.
        asBinary() 	    string 	the content as binary string.
        asArrayBuffer()	ArrayBuffer 	need a compatible browser.
        asUint8Array() 	Uint8Array 	need a compatible browser.
        asNodeBuffer() 	nodejs Buffer 	need nodejs.
        */

//        print(JSON.stringify(f));
        print("\n\tname........: " + f.name);
        print("\tis dir......: " + f.dir);
        print("\tmode........: " + f.unixPermissions);
        print("\tlength......: " + f.length);
        print("\tcontent.....: " + head_stringify(f.asText(), 60));
    }

    function get_archive(url) {
        JSZipUtils.getBinaryContent(url, function(err, data) {
          if(err) {
              print("Error:"+err);
          } else {
//              print("data type:" + typeof data);
//              print("data:" + JSON.stringify(data));
//              print("Parse a "+data.length+" Bytes.");
              var start_time = new Date;

              var zip = new JSZip(data);
              var files = zip.filter(function(){return true;});

              var duration = new Date() - start_time;
              print("Parse a "+data.length+" Bytes zip file in " + duration + " ms.");
              print("Contains "+files.length+" items:");
              files.forEach(load_file);
          }
        });
    }
    function get_module(module_name) {
        print("\nget_module("+module_name+")");

        var url="./download/"+module_name+".zip";
        print("url: '" + url + "'");

        get_archive(url);
    }

    // Test:

    get_archive(url="./download/pypyjs.zip");

    get_module(module_name = "HTMLParser");
    get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
});