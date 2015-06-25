$(document).ready(function() {
    var out = $("#output");
    function print(data) {
        out.append(data+"\n");
    }

    var VERBOSE=true;

    function get_archive(url) {
        print("Request url: '" + url + "'");
        var request_start_time = new Date;
        GZip.load(
            url=url,
            onload=function(h) {
                var request_duration = new Date() - request_start_time;
                print("\n" + url + " loaded in " + human_time(request_duration));
//                print(JSON.stringify(h));

                // h.data == Array
//                print("h.data type: " + Object.prototype.toString.call(h.data));
//                print("h.data: " + h.data);

                if (!h.filename) {
                    return;
                }

                var compressed_bytes = h.size;
                var compressed_kb = compressed_bytes/1024;
                var start_time = new Date;

                var tar = new TarGZ;
                tar.parseTar(h.data.join(''));
                var files = tar.files;

                if (VERBOSE) { print("<table>"); }
                files.forEach(function(file){
                    if (VERBOSE) {
                        print("<tr>");
                        print("<td>"+file.filename+"</td>");
                        print("<td>"+file.length + "bytes</td>");
                        print("<td>"+head_stringify(file.data, 60)+"</td>");
                        print("</tr>");
                    }
                })
                if (VERBOSE) { print("</table>"); }

                var duration = new Date() - start_time;
                duration += h.decompressionTime;

                var uncompressed_bytes = h.outputSize;
                var uncompressed_kb = uncompressed_bytes/1024;
                var rate = (uncompressed_kb/1024) / (duration/1000);
                msg = "Decompress " + files.length + " files";
                msg += " - " + compressed_kb.toFixed(1) + "KB";
                msg += " to: " + uncompressed_kb.toFixed(1) + " KB";
                msg += " in " + duration + " ms";
                msg += " - Data rate: " + rate.toFixed(1) + " MB/s"
                print(msg);
            },
            onstream=function(h) {
//                print("<small>" + url + " " + h.offset + " bytes downloaded...</small>");
            },
            onerror=function(xhr, e, h) {
                if (h != 0) {
                    print("\nERROR:");
                    print("xhr:" + xhr);
                    print("error:" + e);
                    print("h:" + h);
                }
            }
        );
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