$(document).ready(function() {
    var out = $("#output");
    function print(data) {
        out.append(data+"\n");
    }

    var VERBOSE=true;

    function get_archive(url) {
        print("Request url: '" + url + "'");
        var request_start_time = new Date;
        $.ajax({
            url: url,
            dataType: 'native', // https://github.com/acigna/jquery-ajax-native
            xhrFields: {
              responseType: 'arraybuffer'
            },
            success: function(data) {
                var request_duration = new Date() - request_start_time;
                print("\n" + url + " loaded in " + human_time(request_duration));

                // data == ArrayBuffer
//                print("result type: " + Object.prototype.toString.call(data));

                var compressed_bytes = data.byteLength
                var compressed_kb = compressed_bytes/1024;
                var start_time = new Date;

                data = pako.inflate(data); // https://github.com/nodeca/pako/
                // data == Uint8Array

                var files = untar(data);

                if (VERBOSE) { print("<table>"); }
                // https://github.com/antimatter15/untar.js/
                files.forEach(function(file){
                    if (VERBOSE) {
                        print("<tr>");
                        print("<td>"+file.filename+"</td>");
                        print("<td>"+file.size + "bytes</td>");
                        print("<td>"+head_stringify(file.fileData, 60)+"</td>");
                        print("</tr>");
                    }
                })
                if (VERBOSE) { print("</table>"); }

                var duration = new Date() - start_time;

                var uncompressed_bytes = data.length
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
        var url="./download/"+module_name+".tar.gz";
        get_archive(url);
    }

    $("#go").on( "click", function() {
        out.text("");
        VERBOSE=$('#verbose').prop('checked');

        get_archive(url="./download/pypyjs.tar.gz");
        get_module(module_name = "HTMLParser");
        get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
    });
    print("Please click on 'Test' button !");

});