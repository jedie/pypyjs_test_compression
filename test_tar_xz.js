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
        $.ajax({
            url: url,
            dataType: 'native', // https://github.com/acigna/jquery-ajax-native
            xhrFields: {
              responseType: 'arraybuffer' // ("arraybuffer", "blob", "document", "json")
            },
            fail: function(data) { print("fail:", data); },
            error: function(data) { print("error:", data); },
            success: function(data) {
                var request_duration = new Date() - request_start_time;
                print("\n" + url + " loaded in " + human_time(request_duration));

                // data == ArrayBuffer
//              print("data type:" + Object.prototype.toString.call(data));
              var data = new Uint8Array(data);
//              print("data type:" + Object.prototype.toString.call(data));
//              print("stringify:"+head_stringify(data, 60));
//              print("Parse "+data.byteLength+" Bytes.");

                var compressed_bytes = data.byteLength;
                var compressed_kb = compressed_bytes/1024;
                var start_time = new Date;

                LZMA.decompress(data,
                    on_finish=function(data) {
                        if (VERBOSE) { print("lzma decompress "+url+" finish.") }

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

                    },
                    on_progress=function(percent) {
//                        if (VERBOSE) {
                        print("Decompressing: " + (percent * 100) + "%");
//                        };
                    }
                );
            }
        })
    }
    function get_module(module_name) {
        get_archive("./download/"+module_name+".tar.xz");
    }

    $("#go").on( "click", function() {
        out.text("");
        VERBOSE=$('#verbose').prop('checked');
        total_uncompressed_bytes=0;
        total_start_time=new Date();

        get_archive(url="./download/pypyjs.tar.xz");
        get_module(module_name = "HTMLParser");
        get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
    });
    print("Please click on 'Test' button !");

});