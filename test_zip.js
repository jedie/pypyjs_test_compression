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

    var total_start_time;
    var total_uncompressed_bytes;
    var VERBOSE;

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
              var uncompressed_bytes = total_size;
              var uncompressed_kb = uncompressed_bytes/1024;
              var rate = (uncompressed_kb/1024) / (duration/1000);

              msg = "Decompress " + files.length + " files";
              msg += " - " + compressed_kb.toFixed(1) + "KB";
              msg += " to: " + uncompressed_kb.toFixed(1) + " KB";
              msg += " in " + human_time(duration);
              msg += " - Data rate: " + rate.toFixed(1) + " MB/s"
              print(msg);

              total_duration = new Date()-total_start_time;
              total_uncompressed_bytes += uncompressed_bytes;
              var total_mb = total_uncompressed_bytes/1024/1024;
              var total_rate=total_mb / (total_duration/1000);
              msg = "total: "+total_mb.toFixed(2)+" MB";
              msg += " in " + human_time(total_duration);
              msg += " -> " + total_rate.toFixed(1) + " MB/s";
              print(msg);
          }
        });
    }
    function get_module(module_name) {
        get_archive("./download/"+module_name+".zip");
    }

    $("#go").on( "click", function() {
        out.text("");
        VERBOSE=$('#verbose').prop('checked');
        total_uncompressed_bytes=0;
        total_start_time=new Date();

        get_archive(url="./download/pypyjs.zip");
        get_module(module_name = "HTMLParser");
        get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
    });
    print("Please click on 'Test' button !");

});