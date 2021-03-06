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
        get_archive("./download/"+module_name+".tar.gz");
    }

    $("#go").on( "click", function() {
        out.text("");
        VERBOSE=$('#verbose').prop('checked');
        total_uncompressed_bytes=0;
        total_start_time=new Date();

        get_archive(url="./download/pypyjs.tar.gz");
        get_module(module_name = "HTMLParser");
        get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
    });
    print("Please click on 'Test' button !");
});