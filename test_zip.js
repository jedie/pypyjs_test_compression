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

    function get_archive(url) {
        print("Request url: '" + url + "'");

        JSZipUtils.getBinaryContent(url, function(err, data) {
          if(err) {
              print("Error:"+err);
          } else {
              print("\nParse "+url);
//              print("data type:" + typeof data);
//              print("data:" + JSON.stringify(data));
//              print("Parse a "+data.length+" Bytes.");

              var total_size=0;
              var start_time = new Date;

              var zip = new JSZip(data);
              var files = zip.filter(function(){return true;});

              for (f of files) {
                /*
                API: http://stuk.github.io/jszip/documentation/api_zipobject.html

                asText() 	    string 	the content as an unicode string.
                asBinary() 	    string 	the content as binary string.
                asArrayBuffer()	ArrayBuffer 	need a compatible browser.
                asUint8Array() 	Uint8Array 	    need a compatible browser.
                asNodeBuffer() 	nodejs Buffer 	need nodejs.
                */

//                print(JSON.stringify(f));

                var data=f.asUint8Array();

//                print("\tname........: " + f.name);
//                print("\tis dir......: " + f.dir);
//                print("\tmode........: " + f.unixPermissions);
//                print("\tlength......: " + data.length);
//                print("\tcontent.....: " + head_stringify(data, 60));

                total_size += data.length
              }

              var duration = new Date() - start_time;
              var kb = total_size/1024;
              var mb = kb/1024;
              var rate = mb / (duration/1000);
              print("Contains "+files.length+" items with uncompressed: " + kb.toFixed(1) + "KB");
              print("Parsed .zip in " + duration + " ms - Data rate: " + rate.toFixed(1) + " MB/s");
          }
        });
    }
    function get_module(module_name) {
        print("get_module("+module_name+")");
        var url="./download/"+module_name+".zip";

        get_archive(url);
    }

    // Test:

    get_archive(url="./download/pypyjs.zip");

    get_module(module_name = "HTMLParser");
    get_module(module_name = "MimeWriter");

//    get_module(module_name = "doesntexists");

});