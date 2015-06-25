$(document).ready(function() {
    var out = $("#output");
    function print(data) {
        out.append(data+"\n");
    }

    function get_archive(url) {
        print("Request url: '" + url + "'");

        GZip.load(
            url=url,
            onload=function(h) {
                print("\n" + url + " loaded:");
//                print(JSON.stringify(h));
                if (!h.filename) {
                    return;
                }

                var compressed_bytes = h.data.length;
                var compressed_kb = compressed_bytes/1024;

                var start_time = new Date;

                var tar = new TarGZ;
                tar.parseTar(h.data.join(''));

                var duration = new Date() - start_time;
                duration += h.decompressionTime;

                var uncompressed_bytes = h.outputSize;
                var uncompressed_kb = uncompressed_bytes/1024;
                var rate = (uncompressed_kb/1024) / (duration/1000);
                msg = "Decompress " + compressed_kb.toFixed(1) + "KB";
                msg += " to: " + uncompressed_kb.toFixed(1) + " KB";
                msg += " in " + duration + " ms";
                msg += " - Data rate: " + rate.toFixed(1) + " MB/s"
                print(msg);

                var start_time = new Date;
                print("<table>");
                var start_time = new Date;
                tar.files.forEach(function(file){
                    print("<tr>");
                    print("<td>"+file.filename+"</td>");
                    print("<td>"+file.length + "bytes</td>");
                    print("<td>"+head_stringify(file.data, 60)+"</td>");
                    print("</tr>");
                })
                var duration = new Date() - start_time;
                print("</table>");
                var duration = new Date() - start_time;
                print("(print output in " + duration + "ms)\n");
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
        print("\nget_module("+module_name+")");
        var url="./download/"+module_name+".tar.gz";
        get_archive(url);
    }

    // Test:
    
    get_archive(url="./download/pypyjs.tar.gz");

    get_module(module_name = "HTMLParser");
    get_module(module_name = "MimeWriter");
//    get_module(module_name = "doesntexists");
});