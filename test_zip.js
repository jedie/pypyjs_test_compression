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

//    var VERBOSE=true;
    var VERBOSE=false;

    function get_archive(url) {
        print("Request url: '" + url + "'");
        var request_start_time = new Date;
        JSZipUtils.getBinaryContent(url, function(err, data) {
          if(err) {
              print("Error:"+err);
          } else {
                var request_duration = new Date() - request_start_time;
                print("\n" + url + " loaded in " + human_time(request_duration));

//              print("data type:" + typeof data);
//              print("data:" + JSON.stringify(data));
//              print("Parse a "+data.length+" Bytes.");

              var compressed_bytes = data.byteLength
              var compressed_kb = compressed_bytes/1024;
              var total_size=0;
              var start_time = new Date;

              var zip = new JSZip(data);
              var files = zip.filter(function(){return true;});

              if (VERBOSE) { print("<table>"); }
              files.forEach(function(file){
                /*
                API: http://stuk.github.io/jszip/documentation/api_zipobject.html

                asText() 	    string 	the content as an unicode string.
                asBinary() 	    string 	the content as binary string.
                asArrayBuffer()	ArrayBuffer 	need a compatible browser.
                asUint8Array() 	Uint8Array 	    need a compatible browser.
                asNodeBuffer() 	nodejs Buffer 	need nodejs.
                */

//                print(JSON.stringify(f));
                var data=file.asUint8Array();
                total_size += data.length

                if (VERBOSE) {
                    print("<tr>");
                    print("<td>"+file.name+"</td>");
                    print("<td>"+data.length + "bytes</td>");
                    print("<td>"+head_stringify(data, 60)+"</td>");
                    print("</tr>");
                }
              });
              if (VERBOSE) { print("</table>"); }

              var duration = new Date() - start_time;

              var uncompressed_bytes = total_size
              var uncompressed_kb = uncompressed_bytes/1024;
              var rate = (uncompressed_kb/1024) / (duration/1000);
              msg = "Decompress " + files.length + " files";
              msg += " - " + compressed_kb.toFixed(1) + "KB";
              msg += " to: " + uncompressed_kb.toFixed(1) + " KB";
              msg += " in " + duration + " ms";
              msg += " - Data rate: " + rate.toFixed(1) + " MB/s"
              print(msg);
          }
        });
    }
    function get_module(module_name) {
        print("get_module("+module_name+")");
        var url="./download/"+module_name+".zip";

        get_archive(url);
    }

    $("#go").on( "click", function() {
        out.text("");
        VERBOSE=$('#verbose').prop('checked');

        get_archive(url="./download/pypyjs.zip");
        get_module(module_name = "HTMLParser");
        get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
    });
    print("Please click on 'Test' button !");

});